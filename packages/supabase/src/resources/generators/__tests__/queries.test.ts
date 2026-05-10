import { getGeneratorById, getGenerators } from "../queries";
import { SupabaseClient } from "@supabase/supabase-js";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("generators.queries testes unitários", () => {
  const mockSingle = vi.fn();
  const mockOrder = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
  const mockSelect = vi.fn().mockReturnValue({
    order: mockOrder,
    eq: mockEq,
  });
  const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });

  const mockSupabase = {
    from: mockFrom,
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOrder.mockResolvedValue({
      data: [],
      error: null,
    });
  });

  it("deve buscar todos os geradores ordenados por data de criação", async () => {
    // Arrange
    const mockData = [{ id: "uuid", esp32_id: "esp32_uuid" }];

    mockOrder.mockResolvedValue({
      data: mockData,
      error: null,
    });

    // Act
    const sut = await getGenerators(mockSupabase);

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("gerador");
    expect(mockOrder).toHaveBeenCalledWith("created_at", { ascending: true });
    expect(sut).toEqual(mockData);
  });

  it("deve lançar um erro se a consulta falhar", async () => {
    // Arrange
    mockOrder.mockResolvedValue({
      data: null,
      error: { message: "Erro de consulta" },
    });

    // Act & Assert
    await expect(getGenerators(mockSupabase)).rejects.toThrow(Error);
    await expect(getGeneratorById(mockSupabase, "uuid")).rejects.toThrow(Error);
  });

  it("deve buscar um gerador específico", async () => {
    // Arrange
    const mockData = { id: "uuid", esp32_id: "esp32_uuid" };

    mockSingle.mockResolvedValue({
      data: mockData,
      error: null,
    });

    // Act
    const sut = await getGeneratorById(mockSupabase, "uuid");

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("gerador");
    expect(mockEq).toHaveBeenCalledWith("id", "uuid");
    expect(mockSingle).toHaveBeenCalled();
    expect(sut).toEqual(mockData);
  });
});
