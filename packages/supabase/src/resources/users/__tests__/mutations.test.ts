import { describe, it, expect, vi, beforeEach } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import { updateUserById } from "../mutations";
import type { UpdateUserDTO } from "../types";

describe("users.mutations testes unitários", () => {
  let mockSingle: ReturnType<typeof vi.fn>;
  let mockSelect: ReturnType<typeof vi.fn>;
  let mockEq: ReturnType<typeof vi.fn>;
  let mockUpdate: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSingle = vi.fn();
    mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
    mockEq = vi.fn().mockReturnValue({ select: mockSelect });
    mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    mockSupabase = {
      from: mockFrom,
    } as unknown as SupabaseClient;

    vi.clearAllMocks();
  });

  it("deve atualizar um usuário pelo ID com sucesso", async () => {
    // Arrange
    const mockData: UpdateUserDTO = { nome: "Novo Nome", email: "novo@email.com" };
    const mockUpdatedUser = { id: "user-123", ...mockData };
    mockSingle.mockResolvedValue({ data: mockUpdatedUser, error: null });

    // Act
    const sut = await updateUserById(mockSupabase, "user-123", mockData);

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("usuario");
    expect(mockUpdate).toHaveBeenCalledWith(mockData);
    expect(mockEq).toHaveBeenCalledWith("id", "user-123");
    expect(mockSingle).toHaveBeenCalled();
    expect(sut).toEqual(mockUpdatedUser);
  });

  it("deve lançar um erro se a atualização falhar", async () => {
    // Arrange
    const mockData: UpdateUserDTO = { nome: "Novo Nome" };
    const mockError = { message: "Erro ao atualizar usuário" };
    mockSingle.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(updateUserById(mockSupabase, "user-123", mockData)).rejects.toEqual(
      mockError,
    );
  });

  it("deve atualizar apenas os campos fornecidos no DTO", async () => {
    // Arrange
    const mockData: UpdateUserDTO = { nome: "Apenas Nome" };
    const mockUpdatedUser = { id: "user-123", nome: "Apenas Nome", email: "old@email.com" };
    mockSingle.mockResolvedValue({ data: mockUpdatedUser, error: null });

    // Act
    await updateUserById(mockSupabase, "user-123", mockData);

    // Assert
    expect(mockUpdate).toHaveBeenCalledWith({ nome: "Apenas Nome" });
  });
});
