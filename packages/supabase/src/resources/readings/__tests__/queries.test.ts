import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";
import {
  getReadings,
  getReadingById,
  getReadingsByGeneratorId,
} from "../queries";

describe("readings.queries testes unitários", () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn();
  const mockSelect = vi.fn();
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

  const mockSupabase = {
    from: mockFrom,
  } as unknown as SupabaseClient<Database>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSelect.mockReturnValue({
      eq: mockEq,
      then: (onFulfilled: any) =>
        Promise.resolve({ data: [], error: null }).then(onFulfilled),
    });

    mockEq.mockReturnValue({
      single: mockSingle,
      then: (onFulfilled: any) =>
        Promise.resolve({ data: [], error: null }).then(onFulfilled),
    });
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
});
