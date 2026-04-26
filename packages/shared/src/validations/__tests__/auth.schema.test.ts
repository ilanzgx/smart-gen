import { describe, it, expect } from "vitest";
import {
  loginSchema,
  registerSchema,
  recoverPasswordSchema,
  updatePasswordSchema,
} from "../auth.schema";

describe("loginSchema testes unitários", () => {
  it("deve aceitar credenciais válidas", () => {
    // Arrange
    const input = { email: "user@gmail.com", password: "senha123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("deve rejeitar email inválido", () => {
    // Arrange
    const input = { email: "invalido", password: "senha123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar quando email não for fornecido", () => {
    // Arrange
    const input = { password: "senha123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar quando senha não for fornecida", () => {
    // Arrange
    const input = { email: "user@gmail.com" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar senha com menos de 6 caracteres", () => {
    // Arrange
    const input = { email: "user@gmail.com", password: "123" };

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar objeto vazio", () => {
    // Arrange
    const input = {};

    // Act
    const result = loginSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("registerSchema testes unitários", () => {
  it("deve aceitar dados válidos de cadastro", () => {
    // Arrange
    const input = {
      name: "João Silva",
      email: "joao@gmail.com",
      password: "senha123",
      confirmPassword: "senha123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("deve rejeitar quando o nome tiver menos de 3 caracteres", () => {
    // Arrange
    const input = {
      name: "Jo",
      email: "joao@gmail.com",
      password: "senha123",
      confirmPassword: "senha123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar quando o nome não for fornecido", () => {
    // Arrange
    const input = {
      email: "joao@gmail.com",
      password: "senha123",
      confirmPassword: "senha123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar email inválido", () => {
    // Arrange
    const input = {
      name: "João Silva",
      email: "invalido",
      password: "senha123",
      confirmPassword: "senha123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar senha com menos de 6 caracteres", () => {
    // Arrange
    const input = {
      name: "João Silva",
      email: "joao@gmail.com",
      password: "123",
      confirmPassword: "123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar quando as senhas não coincidem", () => {
    // Arrange
    const input = {
      name: "João Silva",
      email: "joao@gmail.com",
      password: "senha123",
      confirmPassword: "outra456",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (issue) => issue.path.includes("confirmPassword"),
      );
      expect(confirmError?.message).toBe("As senhas não coincidem");
    }
  });

  it("deve rejeitar quando confirmPassword não for fornecido", () => {
    // Arrange
    const input = {
      name: "João Silva",
      email: "joao@gmail.com",
      password: "senha123",
    };

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar objeto vazio", () => {
    // Arrange
    const input = {};

    // Act
    const result = registerSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("recoverPasswordSchema testes unitários", () => {
  it("deve aceitar um email válido", () => {
    // Arrange
    const input = { email: "test@gmail.com" };

    // Act
    const result = recoverPasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("deve rejeitar um email inválido", () => {
    // Arrange
    const input = { email: "email-invalido" };

    // Act
    const result = recoverPasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar quando email não for fornecido", () => {
    // Arrange
    const input = {};

    // Act
    const result = recoverPasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar um email vazio", () => {
    // Arrange
    const input = { email: "" };

    // Act
    const result = recoverPasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});

describe("updatePasswordSchema testes unitários", () => {
  it("deve aceitar senhas iguais com no mínimo 6 caracteres", () => {
    // Arrange
    const input = { password: "senha123", confirmPassword: "senha123" };

    // Act
    const result = updatePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(true);
  });

  it("deve rejeitar quando as senhas não coincidem", () => {
    // Arrange
    const input = { password: "senha123", confirmPassword: "outra456" };

    // Act
    const result = updatePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
    if (!result.success) {
      const confirmError = result.error.issues.find(
        (issue) => issue.path.includes("confirmPassword"),
      );
      expect(confirmError?.message).toBe("As senhas não coincidem");
    }
  });

  it("deve rejeitar senha com menos de 6 caracteres", () => {
    // Arrange
    const input = { password: "123", confirmPassword: "123" };

    // Act
    const result = updatePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar quando password não for fornecido", () => {
    // Arrange
    const input = { confirmPassword: "senha123" };

    // Act
    const result = updatePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar quando confirmPassword não for fornecido", () => {
    // Arrange
    const input = { password: "senha123" };

    // Act
    const result = updatePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });

  it("deve rejeitar quando ambos os campos estiverem vazios", () => {
    // Arrange
    const input = { password: "", confirmPassword: "" };

    // Act
    const result = updatePasswordSchema.safeParse(input);

    // Assert
    expect(result.success).toBe(false);
  });
});
