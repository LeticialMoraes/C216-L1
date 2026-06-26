import { beforeEach, describe, expect, it, vi } from "vitest";

const { queryMock, connectMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  connectMock: vi.fn(),
}));

vi.mock("../db/pool", () => ({
  pool: {
    query: queryMock,
    connect: connectMock,
  },
}));

import { registrarMovimentacao } from "../src/models/movimentacao";

describe("registrarMovimentacao", () => {
  const clientQuery = vi.fn();
  const clientRelease = vi.fn();

  beforeEach(() => {
    queryMock.mockReset();
    connectMock.mockReset();
    clientQuery.mockReset();
    clientRelease.mockReset();

    connectMock.mockResolvedValue({
      query: clientQuery,
      release: clientRelease,
    });
  });

  it("rejeita saída quando estoque é insuficiente", async () => {
    clientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ id: 1, quantidade: 5 }] });

    await expect(
      registrarMovimentacao(1, "user-uuid", "saida", 10, null),
    ).rejects.toMatchObject({
      code: "ESTOQUE_INSUFICIENTE",
    });

    expect(clientQuery).toHaveBeenCalledWith("ROLLBACK");
    expect(clientRelease).toHaveBeenCalled();
  });

  it("rejeita quando produto não existe", async () => {
    clientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [] });

    await expect(
      registrarMovimentacao(99, "user-uuid", "entrada", 5, null),
    ).rejects.toMatchObject({
      code: "PRODUTO_NOT_FOUND",
    });
  });

  it("registra entrada e atualiza estoque na transação", async () => {
    const createdAt = new Date("2026-06-20T12:00:00.000Z");

    clientQuery
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce({ rows: [{ id: 1, quantidade: 20 }] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce(undefined);

    queryMock.mockResolvedValueOnce({
      rows: [
        {
          id: 7,
          produto_id: 1,
          usuario_id: "user-uuid",
          tipo: "entrada",
          quantidade: 5,
          observacao: "Reposição",
          created_at: createdAt,
          produto_nome: "Legging Pro",
          sku: "LEG-001",
          usuario_nome: "Letícia Moraes",
        },
      ],
    });

    const resultado = await registrarMovimentacao(
      1,
      "user-uuid",
      "entrada",
      5,
      "Reposição",
    );

    expect(resultado.id).toBe(7);
    expect(resultado.tipo).toBe("entrada");
    expect(clientQuery).toHaveBeenCalledWith("COMMIT");
    expect(clientQuery).toHaveBeenCalledWith(
      "UPDATE produtos SET quantidade = quantidade + $1 WHERE id = $2",
      [5, 1],
    );
  });
});
