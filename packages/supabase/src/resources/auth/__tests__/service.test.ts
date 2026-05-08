import { describe, it, expect, beforeEach, vi } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../../database.types";
import {
  signIn,
  signUp,
  signOut,
  getSession,
  getUser,
  resetPasswordForEmail,
  updatePassword,
  updateProfile,
  updateEmail,
} from "../service";

describe("auth.service testes unitários", () => {
  let mockSignIn: ReturnType<typeof vi.fn>;
  let mockSignUp: ReturnType<typeof vi.fn>;
  let mockSignOut: ReturnType<typeof vi.fn>;
  let mockGetSession: ReturnType<typeof vi.fn>;
  let mockGetUser: ReturnType<typeof vi.fn>;
  let mockResetPasswordForEmail: ReturnType<typeof vi.fn>;
  let mockUpdateUser: ReturnType<typeof vi.fn>;
  let mockEqFn: ReturnType<typeof vi.fn>;
  let mockUpdateFn: ReturnType<typeof vi.fn>;
  let mockFrom: ReturnType<typeof vi.fn>;
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSignIn = vi.fn();
    mockSignUp = vi.fn();
    mockSignOut = vi.fn();
    mockGetSession = vi.fn();
    mockGetUser = vi.fn();
    mockResetPasswordForEmail = vi.fn();
    mockUpdateUser = vi.fn();
    mockEqFn = vi.fn().mockResolvedValue({ error: null });
    mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEqFn });
    mockFrom = vi.fn().mockReturnValue({ update: mockUpdateFn });

    mockSupabase = {
      auth: {
        signInWithPassword: mockSignIn,
        signUp: mockSignUp,
        signOut: mockSignOut,
        getSession: mockGetSession,
        getUser: mockGetUser,
        resetPasswordForEmail: mockResetPasswordForEmail,
        updateUser: mockUpdateUser,
      },
      from: mockFrom,
    } as unknown as SupabaseClient;
  });

  it("deve realizar login do usuário", async () => {
    // Arrange
    const mockData = {
      user: { id: "uuid" },
      session: { access_token: "token" },
    };
    const mockError = null;

    mockSignIn.mockResolvedValue({ data: mockData, error: mockError });

    // Act
    const sut = await signIn(mockSupabase, {
      email: "test@gmail.com",
      password: "password",
    });

    // Assert
    expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: "test@gmail.com",
      password: "password",
    });
    expect(sut).toEqual(mockData);
  });

  it("deve lançar um erro se o login falhar", async () => {
    // Arrange
    const mockError = { message: "Erro de login" };

    mockSignIn.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(
      signIn(mockSupabase, {
        email: "test@gmail.com",
        password: "password",
      }),
    ).rejects.toEqual(mockError);
  });

  it("deve realizar cadastro do usuário", async () => {
    // Arrange
    const mockData = {
      user: { id: "uuid" },
      session: { access_token: "token" },
    };
    const mockError = null;

    mockSignUp.mockResolvedValue({ data: mockData, error: mockError });

    // Act
    const sut = await signUp(mockSupabase, {
      email: "test@gmail.com",
      password: "password",
    });

    // Assert
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: "test@gmail.com",
      password: "password",
    });
    expect(sut).toEqual(mockData);
  });

  it("deve lançar um erro se o cadastro falhar", async () => {
    // Arrange
    const mockError = { message: "Erro de cadastro" };

    mockSignUp.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(
      signUp(mockSupabase, {
        email: "test@gmail.com",
        password: "password",
      }),
    ).rejects.toEqual(mockError);
  });

  it("deve realizar logout do usuário", async () => {
    // Arrange
    const mockError = null;

    mockSignOut.mockResolvedValue({ error: mockError });

    // Act
    await signOut(mockSupabase);

    // Assert
    expect(mockSupabase.auth.signOut).toHaveBeenCalled();
  });

  it("deve lançar um erro se o logout falhar", async () => {
    // Arrange
    const mockError = { message: "Erro de logout" };

    mockSignOut.mockResolvedValue({ error: mockError });

    // Act & Assert
    await expect(signOut(mockSupabase)).rejects.toEqual(mockError);
  });

  it("deve retornar a sessão atual do usuário", async () => {
    // Arrange
    const mockData = {
      session: { access_token: "token" },
    };
    const mockError = null;

    mockGetSession.mockResolvedValue({ data: mockData, error: mockError });

    // Act
    const sut = await getSession(mockSupabase);

    // Assert
    expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    expect(sut).toEqual(mockData.session);
  });

  it("deve retornar null se a sessão não estiver disponível", async () => {
    // Arrange
    const mockData = {
      session: null,
    };
    const mockError = null;

    mockGetSession.mockResolvedValue({ data: mockData, error: mockError });

    // Act
    const sut = await getSession(mockSupabase);

    // Assert
    expect(mockSupabase.auth.getSession).toHaveBeenCalled();
    expect(sut).toEqual(null);
  });

  it("deve lançar um erro se a obtenção da sessão falhar", async () => {
    // Arrange
    const mockError = { message: "Erro ao obter sessão" };

    mockGetSession.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(getSession(mockSupabase)).rejects.toEqual(mockError);
  });

  it("deve retornar o usuário autenticado", async () => {
    // Arrange
    const mockData = {
      user: { id: "uuid" },
    };
    const mockError = null;

    mockGetUser.mockResolvedValue({ data: mockData, error: mockError });

    // Act
    const sut = await getUser(mockSupabase);

    // Assert
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    expect(sut).toEqual(mockData.user);
  });

  it("deve retornar null se o usuário não estiver disponível", async () => {
    // Arrange
    const mockData = {
      user: null,
    };
    const mockError = null;

    mockGetUser.mockResolvedValue({ data: mockData, error: mockError });

    // Act
    const sut = await getUser(mockSupabase);

    // Assert
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
    expect(sut).toEqual(null);
  });

  it("deve lançar um erro se a obtenção do usuário falhar", async () => {
    // Arrange
    const mockError = { message: "Erro ao obter usuário" };

    mockGetUser.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(getUser(mockSupabase)).rejects.toEqual(mockError);
  });

  it("deve enviar email de redefinição de senha com os parâmetros corretos", async () => {
    // Arrange
    mockResetPasswordForEmail.mockResolvedValue({ data: {}, error: null });

    // Act
    await resetPasswordForEmail(
      mockSupabase,
      "test@gmail.com",
      "https://example.com/atualizar-senha",
    );

    // Assert
    expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
      "test@gmail.com",
      { redirectTo: "https://example.com/atualizar-senha" },
    );
  });

  it("deve lançar um erro se o envio de redefinição de senha falhar", async () => {
    // Arrange
    const mockError = { message: "Email rate limit exceeded" };
    mockResetPasswordForEmail.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(
      resetPasswordForEmail(
        mockSupabase,
        "test@gmail.com",
        "https://example.com/atualizar-senha",
      ),
    ).rejects.toEqual(mockError);
  });

  it("deve atualizar a senha do usuário com sucesso", async () => {
    // Arrange
    mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });

    // Act
    await updatePassword(mockSupabase, "nova-senha-123");

    // Assert
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      password: "nova-senha-123",
    });
  });

  it("deve lançar um erro se a atualização de senha falhar", async () => {
    // Arrange
    const mockError = { message: "Erro ao atualizar senha" };
    mockUpdateUser.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(updatePassword(mockSupabase, "nova-senha-123")).rejects.toEqual(
      mockError,
    );
  });

  it("deve atualizar o perfil do usuário com sucesso", async () => {
    // Arrange
    mockUpdateUser.mockResolvedValue({ data: { user: {} }, error: null });

    // Act
    await updateProfile(mockSupabase, { name: "Novo Nome" });

    // Assert
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      data: { name: "Novo Nome" },
    });
  });

  it("deve lançar um erro se a atualização do perfil falhar", async () => {
    // Arrange
    const mockError = { message: "Erro ao atualizar perfil" };
    mockUpdateUser.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(updateProfile(mockSupabase, { name: "Novo Nome" })).rejects.toEqual(
      mockError,
    );
  });

  it("deve atualizar o email do usuário e a tabela usuario com sucesso", async () => {
    // Arrange
    const mockUser = { user: { id: "user-123" } };
    mockUpdateUser.mockResolvedValue({ data: mockUser, error: null });

    // Act
    await updateEmail(mockSupabase, "novo@email.com");

    // Assert
    expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
      email: "novo@email.com",
    });
    expect(mockSupabase.from).toHaveBeenCalledWith("usuario");
    expect(mockUpdateFn).toHaveBeenCalledWith({ email: "novo@email.com" });
    expect(mockEqFn).toHaveBeenCalledWith("id", "user-123");
  });

  it("deve lançar um erro se a atualização do email no auth falhar", async () => {
    // Arrange
    const mockError = { message: "Erro ao atualizar email no auth" };
    mockUpdateUser.mockResolvedValue({ data: null, error: mockError });

    // Act & Assert
    await expect(updateEmail(mockSupabase, "novo@email.com")).rejects.toEqual(mockError);
  });

  it("deve lançar um erro se não houver usuário após atualizar email", async () => {
    // Arrange
    const mockUser = { user: null };
    mockUpdateUser.mockResolvedValue({ data: mockUser, error: null });

    // Act & Assert
    await expect(updateEmail(mockSupabase, "novo@email.com")).rejects.toThrow(
      "Não foi possível obter o ID do usuário após atualização.",
    );
  });

  it("deve lançar um erro se a atualização na tabela usuario falhar", async () => {
    // Arrange
    const mockUser = { user: { id: "user-123" } };
    mockUpdateUser.mockResolvedValue({ data: mockUser, error: null });
    const mockDbError = { message: "Erro ao atualizar tabela usuario" };
    mockEqFn.mockResolvedValue({ error: mockDbError });

    // Act & Assert
    await expect(updateEmail(mockSupabase, "novo@email.com")).rejects.toEqual(mockDbError);
  });
});
