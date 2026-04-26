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
} from "../service";

describe("auth.service testes unitários", () => {
  const mockSignIn = vi.fn();
  const mockSignUp = vi.fn();
  const mockSignOut = vi.fn();
  const mockGetSession = vi.fn();
  const mockGetUser = vi.fn();
  const mockResetPasswordForEmail = vi.fn();
  const mockUpdateUser = vi.fn();

  const mockSupabase = {
    auth: {
      signInWithPassword: mockSignIn,
      signUp: mockSignUp,
      signOut: mockSignOut,
      getSession: mockGetSession,
      getUser: mockGetUser,
      resetPasswordForEmail: mockResetPasswordForEmail,
      updateUser: mockUpdateUser,
    },
  } as unknown as SupabaseClient;

  beforeEach(() => {
    vi.clearAllMocks();
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
});
