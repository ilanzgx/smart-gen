import { describe, it, expect, vi, beforeEach } from "vitest";
import { createSupabaseInstance } from "../client";
import * as supabaseJs from "@supabase/supabase-js";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    auth: {},
    from: vi.fn(),
  })),
}));

describe("supabase/src/client testes unitarios", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve criar um cliente com os parâmetros corretos", () => {
    // Arrange
    const url = "https://mocked.supabase.co";
    const key = "fake";

    // Act
    const sut = createSupabaseInstance(url, key);

    // Assert
    expect(supabaseJs.createClient).toHaveBeenCalledWith(url, key);
    expect(sut).toBeDefined();
    expect(sut.auth).toBeDefined();
    expect(sut.from).toBeDefined();
  });

  it("deve lançar um erro se a URL ou a chave estiverem vazias", () => {
    // Arrange
    const url = "";
    const key = "fake";

    // Act & Assert
    expect(() => createSupabaseInstance(url, key)).toThrow(Error);

    expect(supabaseJs.createClient).not.toHaveBeenCalledWith(url, key);
  });
});
