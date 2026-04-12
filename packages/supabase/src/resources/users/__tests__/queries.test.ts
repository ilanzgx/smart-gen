import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";
import { getUsers, getUserById, getUserByEmail } from "../queries";

describe("users.queries testes unitários", () => {
  const mockSingle = vi.fn();
  const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
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
  });

  it("deve buscar todos os usuários", async () => {
    // Arrange
    const mockData = [{ id: "user-1", nome: "Usuário 1" }];
    mockSelect.mockReturnValue(
      Promise.resolve({ data: mockData, error: null }),
    );

    // Act
    const sut = await getUsers(mockSupabase);

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("usuario");
    expect(mockSelect).toHaveBeenCalledWith("*");
    expect(sut).toEqual(mockData);
  });

  it("deve buscar um usuário pelo ID", async () => {
    // Arrange
    const mockData = { id: "user-1", nome: "Usuário 1" };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    // Act
    const sut = await getUserById(mockSupabase, "user-1");

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("usuario");
    expect(mockEq).toHaveBeenCalledWith("id", "user-1");
    expect(mockSingle).toHaveBeenCalled();
    expect(sut).toEqual(mockData);
  });

  it("deve buscar um usuário pelo email", async () => {
    // Arrange
    const mockData = { id: "user-1", email: "test@test.com" };
    mockSingle.mockResolvedValue({ data: mockData, error: null });

    // Act
    const sut = await getUserByEmail(mockSupabase, "test@test.com");

    // Assert
    expect(mockSupabase.from).toHaveBeenCalledWith("usuario");
    expect(mockEq).toHaveBeenCalledWith("email", "test@test.com");
    expect(mockSingle).toHaveBeenCalled();
    expect(sut).toEqual(mockData);
  });

  it("deve lançar erro se a busca por todos os usuários falhar", async () => {
    // Arrange
    const mockError = { message: "Erro ao buscar usuários" };
    mockSelect.mockReturnValue(
      Promise.resolve({ data: null, error: mockError }),
    );

    // Act & Assert
    await expect(getUsers(mockSupabase)).rejects.toEqual(mockError);
  });

  it("deve lançar erro se a busca por ID falhar", async () => {
    // Arrange
    const mockError = { message: "Usuário não encontrado" };
    mockSingle.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(getUserById(mockSupabase, "invalid-id")).rejects.toEqual(
      mockError,
    );
  });

  it("deve lançar erro se a busca por email falhar", async () => {
    // Arrange
    const mockError = { message: "Usuário não encontrado" };
    mockSingle.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(getUserByEmail(mockSupabase, "invalid-email")).rejects.toEqual(
      mockError,
    );
  });
});
