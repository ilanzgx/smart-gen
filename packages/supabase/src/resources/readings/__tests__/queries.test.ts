import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";
import {
  getReadings,
  getReadingById,
  getReadingsByGeneratorId,
  getLastReadingByGeneratorId,
  getCriticalReadings
} from "../queries";

describe("readings.queries testes unitários", () => {
  const mockSingle = vi.fn();
  const mockMaybeSingle = vi.fn();
  const mockOrder = vi.fn();
  const mockLimit = vi.fn();
  const mockEq = vi.fn();
  const mockSelect = vi.fn();
  const mockOr = vi.fn();
  const mockGte = vi.fn();
  const mockLte = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

  const mockSupabase = {
    from: mockFrom,
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    const queryBuilder: any = {};
    queryBuilder.eq = mockEq;
    queryBuilder.or = mockOr;
    queryBuilder.order = mockOrder;
    queryBuilder.gte = mockGte;
    queryBuilder.lte = mockLte;
    queryBuilder.limit = mockLimit;
    queryBuilder.single = mockSingle;
    queryBuilder.maybeSingle = mockMaybeSingle;
    queryBuilder.then = (onFulfilled: any) =>
      Promise.resolve({ data: [], error: null }).then(onFulfilled);

    mockSelect.mockReturnValue(queryBuilder);
    mockEq.mockReturnValue(queryBuilder);
    mockOr.mockReturnValue(queryBuilder);
    mockOrder.mockReturnValue(queryBuilder);
    mockGte.mockReturnValue(queryBuilder);
    mockLte.mockReturnValue(queryBuilder);
    mockLimit.mockReturnValue(queryBuilder);
  });

  it("deve buscar todos os registros de leitura", async () => {
    // Arrange
    const mockData = [{ id: "reg-1", temperatura: 45 }];
    mockSelect.mockReturnValue(
      Promise.resolve({ data: mockData, error: null }),
    );

    // Act
    const sut = await getReadings(mockSupabase);

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("registro");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(sut).toEqual(mockData);
  });

  it("deve buscar um registro específico pelo ID", async () => {
    // Arrange
    const mockData = { id: "reg-1", temperatura: 45 };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    // Act
    const sut = await getReadingById(mockSupabase, "reg-1");

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("registro");
    expect(mockEq).toHaveBeenCalledWith("id", "reg-1");
    expect(mockSingle).toHaveBeenCalled();
    expect(sut).toEqual(mockData);
  });

  it("deve buscar registros filtrados por ID do gerador", async () => {
    // Arrange
    const mockData = [{ id: "reg-1", gerador_id: "gen-123" }];
    mockEq.mockReturnValue(Promise.resolve({ data: mockData, error: null }));

    // Act
    const sut = await getReadingsByGeneratorId(mockSupabase, "gen-123");

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("registro");
    expect(mockEq).toHaveBeenCalledWith("gerador_id", "gen-123");
    expect(sut).toEqual(mockData);
  });

  it("deve buscar a leitura mais recente por ID do gerador", async () => {
    // Arrange
    const mockData = { id: "reg-latest", level: 80 };
    mockMaybeSingle.mockResolvedValue({ data: mockData, error: null });

    // Act
    const sut = await getLastReadingByGeneratorId(mockSupabase, "gen-123");

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("registro");
    expect(mockEq).toHaveBeenCalledWith("gerador_id", "gen-123");
    expect(mockOrder).toHaveBeenCalledWith("timestamp", { ascending: false });
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(mockMaybeSingle).toHaveBeenCalled();
    expect(sut).toEqual(mockData);
  });

  it("deve lançar erro se a busca geral falhar", async () => {
    // Arrange
    const mockError = { message: "Erro de rede" };
    mockSelect.mockReturnValue(
      Promise.resolve({ data: null, error: mockError }),
    );

    // Act & Assert
    await expect(getReadings(mockSupabase)).rejects.toEqual(mockError);
  });

  it("deve lançar erro se a busca por ID do gerador falhar", async () => {
    // Arrange
    const mockError = { message: "Gerador não encontrado" };
    mockEq.mockReturnValue(Promise.resolve({ data: null, error: mockError }));

    // Act & Assert
    await expect(
      getReadingsByGeneratorId(mockSupabase, "gen-invalid"),
    ).rejects.toEqual(mockError);
  });

  it("deve lançar erro se a busca pela última leitura falhar", async () => {
    // Arrange
    const mockError = { message: "Erro ao buscar última leitura" };
    mockMaybeSingle.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(
      getLastReadingByGeneratorId(mockSupabase, "gen-123"),
    ).rejects.toEqual(mockError);
  });

  describe("getCriticalReadings", () => {
    it("deve buscar leituras críticas com valores padrão (sem opções)", async () => {
      // Arrange
      const mockData = [{ id: "reg-1", temperatura: 85, nivel_agua: 50 }];
      mockLimit.mockReturnValue(Promise.resolve({ data: mockData, error: null }));

      // Act
      const sut = await getCriticalReadings(mockSupabase);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("registro");
      expect(mockSelect).toHaveBeenCalledWith("*");
      expect(mockOr).toHaveBeenCalledWith("temperatura.gte.85,nivel_agua.lte.10");
      expect(mockOrder).toHaveBeenCalledWith("timestamp", { ascending: false });
      expect(mockLimit).toHaveBeenCalledWith(50); // padrão: 50
      expect(sut).toEqual(mockData);
    });

    it("deve buscar leituras críticas filtrando por generatorId", async () => {
      // Arrange
      const mockData = [{ id: "reg-1", gerador_id: "gen-123", temperatura: 85 }];
      mockLimit.mockReturnValue(Promise.resolve({ data: mockData, error: null }));

      // Act
      const sut = await getCriticalReadings(mockSupabase, { generatorId: "gen-123" });

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("registro");
      expect(mockEq).toHaveBeenCalledWith("gerador_id", "gen-123");
      expect(sut).toEqual(mockData);
    });

    it("deve buscar leituras críticas filtrando por intervalo de datas e limite customizado", async () => {
      // Arrange
      const mockData = [{ id: "reg-1", temperatura: 85 }];
      const startDate = new Date("2026-05-01T00:00:00Z");
      const endDate = new Date("2026-05-02T00:00:00Z");
      mockLimit.mockReturnValue(Promise.resolve({ data: mockData, error: null }));

      // Act
      const sut = await getCriticalReadings(mockSupabase, {
        startDate,
        endDate,
        limit: 10,
      });

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("registro");
      expect(mockGte).toHaveBeenCalledWith("timestamp", startDate.toISOString());
      expect(mockLte).toHaveBeenCalledWith("timestamp", endDate.toISOString());
      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(sut).toEqual(mockData);
    });

    it("deve lançar erro se a busca por leituras críticas falhar", async () => {
      // Arrange
      const mockError = { message: "Erro na consulta" };
      mockLimit.mockReturnValue(Promise.resolve({ data: null, error: mockError }));

      // Act & Assert
      await expect(getCriticalReadings(mockSupabase)).rejects.toEqual(mockError);
    });
  });
});
