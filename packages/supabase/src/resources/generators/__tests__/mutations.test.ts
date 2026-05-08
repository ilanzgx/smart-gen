import { createGenerator, updateGeneratorById, deleteGeneratorById } from "../mutations";
import { SupabaseClient } from "@supabase/supabase-js";
import { describe, it, expect, beforeEach, vi } from "vitest";

describe("generators.mutations testes unitários", () => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
  const mockEq = vi.fn().mockImplementation(function (this: any) {
    return this;
  });

  const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });
  const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
  const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });

  const mockFrom = vi.fn().mockReturnValue({
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: mockSelect,
    eq: mockEq,
  });

  // Adicionando select ao mockEq para suportar o encadeamento do update
  mockEq.mockReturnValue({
    select: mockSelect,
    then: (onFulfilled: any) => Promise.resolve({ data: null, error: null }).then(onFulfilled),
  });

  const mockSupabase = {
    from: mockFrom,
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createGenerator", () => {
    it("deve criar um novo gerador com sucesso", async () => {
      // Arrange
      const mockData = { id: "1", name: "Gerador Teste" };
      const input = { name: "Gerador Teste", esp32_id: "AA:BB:CC" };

      mockSingle.mockResolvedValue({ data: mockData, error: null });

      // Act
      const result = await createGenerator(mockSupabase, input);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("gerador");
      expect(mockInsert).toHaveBeenCalledWith(input);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it("deve lançar erro se a criação falhar", async () => {
      // Arrange
      const mockError = { message: "Erro ao inserir" };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(createGenerator(mockSupabase, {} as any)).rejects.toEqual(mockError);
    });
  });

  describe("updateGeneratorById", () => {
    it("deve atualizar um gerador com sucesso", async () => {
      // Arrange
      const id = "1";
      const mockData = { id: "1", name: "Gerador Atualizado" };
      const input = { name: "Gerador Atualizado" };

      mockSingle.mockResolvedValue({ data: mockData, error: null });

      // Act
      const result = await updateGeneratorById(mockSupabase, id, input);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("gerador");
      expect(mockUpdate).toHaveBeenCalledWith(input);
      expect(mockSingle).toHaveBeenCalled();
      expect(result).toEqual(mockData);
    });

    it("deve lançar erro se a atualização falhar", async () => {
      // Arrange
      const mockError = { message: "Erro ao atualizar" };
      mockSingle.mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(updateGeneratorById(mockSupabase, "1", {})).rejects.toEqual(mockError);
    });
  });

  describe("deleteGeneratorById", () => {
    it("deve deletar um gerador com sucesso", async () => {
      // Arrange
      const id = "1";
      mockEq.mockResolvedValue({ error: null });

      // Act
      await deleteGeneratorById(mockSupabase, id);

      // Assert
      expect(mockSupabase.from).toHaveBeenCalledWith("gerador");
      expect(mockDelete).toHaveBeenCalled();
      expect(mockEq).toHaveBeenCalledWith("id", id);
    });

    it("deve lançar erro se a deleção falhar", async () => {
      // Arrange
      const mockError = { message: "Erro ao deletar" };
      mockEq.mockResolvedValue({ error: mockError });

      // Act & Assert
      await expect(deleteGeneratorById(mockSupabase, "1")).rejects.toEqual(mockError);
    });
  });
});
