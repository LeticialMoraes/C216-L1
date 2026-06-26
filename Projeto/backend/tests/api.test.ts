import { beforeEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock("../db/pool", () => ({
  pool: {
    query: queryMock,
    connect: vi.fn(),
  },
}));

import { createApp } from "../src/app";
import { signAuthToken } from "../src/lib/authToken";

function authHeader() {
  const token = signAuthToken({
    sub: "550e8400-e29b-41d4-a716-446655440000",
    email: "admin@fitstock.com",
    accessProfile: "administrador",
  });
  return { Authorization: `Bearer ${token}` };
}

describe("API HTTP", () => {
  const app = createApp();

  beforeEach(() => {
    queryMock.mockReset();
  });

  it("GET /health retorna status ok", async () => {
    const res = await request(app).get("/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it("GET /categorias sem token retorna 401", async () => {
    const res = await request(app).get("/categorias");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/autenticação/i);
  });

  it("GET /categorias com token inválido retorna 401", async () => {
    const res = await request(app)
      .get("/categorias")
      .set("Authorization", "Bearer token-invalido");

    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/sessão inválida/i);
  });

  it("GET /categorias autenticado retorna lista", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 1,
          nome: "Feminino",
          descricao: null,
          created_at: new Date("2026-01-01T00:00:00.000Z"),
          total_produtos: 3,
        },
      ],
    });

    const res = await request(app).get("/categorias").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toMatchObject({
      id: 1,
      nome: "Feminino",
      totalProdutos: 3,
    });
  });

  it("POST /categorias sem nome retorna 400", async () => {
    const res = await request(app)
      .post("/categorias")
      .set(authHeader())
      .send({ nome: "   " });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/nome/i);
  });

  it("POST /categorias válido cria categoria", async () => {
    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 2,
          nome: "Masculino",
          descricao: "Linha masculina",
          created_at: new Date("2026-06-20T12:00:00.000Z"),
        },
      ],
    });

    const res = await request(app)
      .post("/categorias")
      .set(authHeader())
      .send({ nome: "Masculino", descricao: "Linha masculina" });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      id: 2,
      nome: "Masculino",
      descricao: "Linha masculina",
    });
  });

  it("GET /dashboard autenticado retorna métricas", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ total_produtos: "2" }] })
      .mockResolvedValueOnce({
        rows: [
          {
            total_itens_estoque: "50",
            produtos_esgotados: "1",
            produtos_estoque_baixo: "1",
          },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const res = await request(app).get("/dashboard").set(authHeader());

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      total_produtos: 2,
      total_itens_estoque: 50,
      produtos_esgotados: 1,
      produtos_estoque_baixo: 1,
    });
  });
});
