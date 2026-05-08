import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { subscribeToGeneratorReadings } from "../service";

describe("readings.service testes unitários", () => {
  let mockChannel: Partial<RealtimeChannel>;
  let mockSupabase: SupabaseClient;
  let postgresChangeHandler: (payload: { new: unknown; old: unknown }) => void;
  let channelSubscribeCallback: (status: string, err?: Error) => void;

  beforeEach(() => {
    vi.clearAllMocks();

    postgresChangeHandler = () => {};
    channelSubscribeCallback = () => {};

    mockChannel = {
      topic: "realtime:registro-gerador-test-id",
      on: vi.fn().mockImplementation((event, filter, callback) => {
        if (event === "postgres_changes") {
          postgresChangeHandler = callback as (payload: { new: unknown; old: unknown }) => void;
        }
        return mockChannel;
      }),
      subscribe: vi.fn().mockImplementation((cb) => {
        channelSubscribeCallback = cb as (status: string, err?: Error) => void;
        return mockChannel;
      }),
      unsubscribe: vi.fn(),
    };

    mockSupabase = {
      channel: vi.fn().mockImplementation((topic) => {
        return mockChannel as RealtimeChannel;
      }),
      removeChannel: vi.fn().mockResolvedValue({ error: null }),
    } as unknown as SupabaseClient;
  });

  it("deve criar canal com tópico correto", () => {
    // Arrange & Act
    subscribeToGeneratorReadings(mockSupabase, "test-id", () => {});

    // Assert
    expect(mockSupabase.channel).toHaveBeenCalledWith("registro-gerador-test-id");
  });

  it("deve configurar postgres_changes com parâmetros corretos", () => {
    // Arrange & Act
    subscribeToGeneratorReadings(mockSupabase, "test-id", () => {});

    // Assert
    expect(mockChannel.on).toHaveBeenCalledWith(
      "postgres_changes",
      expect.objectContaining({
        event: "INSERT",
        schema: "public",
        table: "registro",
        filter: "gerador_id=eq.test-id",
      }),
      expect.any(Function),
    );
  });

  it("deve chamar callback quando nova leitura recebida", () => {
    // Arrange
    const mockCallback = vi.fn();
    subscribeToGeneratorReadings(mockSupabase, "test-id", mockCallback);

    const novaLeitura = {
      new: { id: "1", temperatura: 45.5, nivel_agua: 80 },
      old: null,
    };

    // Act
    postgresChangeHandler(novaLeitura);

    // Assert
    expect(mockCallback).toHaveBeenCalledWith({
      new: expect.objectContaining({ temperatura: 45.5 }),
      old: null,
    });
  });

  it("deve retornar objeto com função unsubscribe", () => {
    // Arrange & Act
    const { unsubscribe } = subscribeToGeneratorReadings(mockSupabase, "test-id", () => {});

    // Assert
    expect(typeof unsubscribe).toBe("function");
  });

  it("deve chamar removeChannel quando unsubscribe chamado", async () => {
    // Arrange
    const { unsubscribe } = subscribeToGeneratorReadings(mockSupabase, "test-id", () => {});

    // Act
    await unsubscribe();

    // Assert
    expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel);
  });

  it("deve tentar reconectar em CHANNEL_ERROR até 3 vezes", async () => {
    // Arrange
    vi.useFakeTimers();

    const { unsubscribe } = subscribeToGeneratorReadings(mockSupabase, "test-id", () => {});

    // Act
    channelSubscribeCallback("CHANNEL_ERROR", new Error("Test error"));
    await vi.advanceTimersByTimeAsync(1000);

    channelSubscribeCallback("CHANNEL_ERROR", new Error("Test error"));
    await vi.advanceTimersByTimeAsync(1000);

    channelSubscribeCallback("CHANNEL_ERROR", new Error("Test error"));
    await vi.advanceTimersByTimeAsync(1000);

    // Assert
    expect(mockSupabase.channel).toHaveBeenCalledTimes(4);

    // Cleanup
    vi.useRealTimers();
    await unsubscribe();
  });

  it("deve resetar retries quando conecta com sucesso (SUBSCRIBED)", async () => {
    // Arrange
    vi.useFakeTimers();

    subscribeToGeneratorReadings(mockSupabase, "test-id", () => {});

    // Act
    channelSubscribeCallback("CHANNEL_ERROR", new Error("Test error"));
    await vi.advanceTimersByTimeAsync(1000);

    channelSubscribeCallback("SUBSCRIBED");

    channelSubscribeCallback("CHANNEL_ERROR", new Error("Test error"));
    await vi.advanceTimersByTimeAsync(1000);

    // Assert - 1 inicial + 1 retry (reset após SUBSCRIBED) + 1 nova retry
    expect(mockSupabase.channel).toHaveBeenCalledTimes(3);

    // Cleanup
    vi.useRealTimers();
  });

  it("deve limpar timeout ao chamar unsubscribe", async () => {
    // Arrange
    vi.useFakeTimers();

    const { unsubscribe } = subscribeToGeneratorReadings(mockSupabase, "test-id", () => {});

    // Força erro para criar timeout
    channelSubscribeCallback("CHANNEL_ERROR", new Error("Test error"));

    // Act
    await unsubscribe();

    // Avançar timer - timeout foi limpo, não deve haver retry
    await vi.advanceTimersByTimeAsync(1000);

    // Assert - apenas chamada inicial, sem retries
    expect(mockSupabase.channel).toHaveBeenCalledTimes(1);

    // Cleanup
    vi.useRealTimers();
  });

  it("deve chamar onSubscribed apenas em reconexão, não na conexão inicial", () => {
    // Arrange
    const mockOnSubscribed = vi.fn();

    subscribeToGeneratorReadings(mockSupabase, "test-id", () => {}, mockOnSubscribed);

    // Act - primeira conexão
    channelSubscribeCallback("SUBSCRIBED");

    // Assert - não deve chamar na primeira vez
    expect(mockOnSubscribed).not.toHaveBeenCalled();

    // Act - reconexão (segunda vez)
    channelSubscribeCallback("SUBSCRIBED");

    // Assert - deve chamar em reconexão
    expect(mockOnSubscribed).toHaveBeenCalledTimes(1);
  });
});
