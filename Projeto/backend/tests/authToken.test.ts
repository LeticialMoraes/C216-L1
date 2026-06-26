import { describe, expect, it, beforeEach } from "vitest";
import { signAuthToken, verifyAuthToken } from "../src/lib/authToken";

describe("authToken", () => {
  const payload = {
    sub: "550e8400-e29b-41d4-a716-446655440000",
    email: "teste@fitstock.com",
    accessProfile: "administrador",
  };

  beforeEach(() => {
    process.env.AUTH_SECRET = "test-secret";
  });

  it("gera token verificável com o mesmo segredo", () => {
    const token = signAuthToken(payload);
    expect(verifyAuthToken(token)).toEqual(payload);
  });

  it("rejeita token com assinatura inválida", () => {
    const token = signAuthToken(payload);
    const [body] = token.split(".");
    expect(verifyAuthToken(`${body}.assinatura-invalida`)).toBeNull();
  });

  it("rejeita token malformado", () => {
    expect(verifyAuthToken("token-sem-ponto")).toBeNull();
    expect(verifyAuthToken("")).toBeNull();
  });

  it("rejeita token assinado com outro segredo", () => {
    const token = signAuthToken(payload);
    process.env.AUTH_SECRET = "outro-segredo";
    expect(verifyAuthToken(token)).toBeNull();
  });
});
