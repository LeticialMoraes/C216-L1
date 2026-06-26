import { pool } from "../../db/pool";

export type MovimentacaoTipo = "entrada" | "saida";

export type MovimentacaoRow = {
  id: number;
  produto_id: number;
  usuario_id: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  observacao: string | null;
  created_at: Date;
};

export type MovimentacaoListRow = MovimentacaoRow & {
  produto_nome: string;
  sku: string;
  usuario_nome: string;
};

export type ListarMovimentacoesFiltros = {
  tipo?: MovimentacaoTipo;
  produtoId?: number;
  dataInicio?: string;
  dataFim?: string;
};

export class MovimentacaoError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "PRODUTO_NOT_FOUND"
      | "ESTOQUE_INSUFICIENTE"
      | "POOL_UNAVAILABLE",
  ) {
    super(message);
    this.name = "MovimentacaoError";
  }
}

const listSelect = `
  SELECT m.*,
         p.nome AS produto_nome,
         p.sku,
         TRIM(u.first_name || ' ' || u.last_name) AS usuario_nome
  FROM movimentacoes m
  JOIN produtos p ON m.produto_id = p.id
  JOIN users u ON m.usuario_id = u.id
`;

function buildListWhere(
  filtros: ListarMovimentacoesFiltros,
): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filtros.tipo !== undefined) {
    params.push(filtros.tipo);
    conditions.push(`m.tipo = $${params.length}`);
  }

  if (filtros.produtoId !== undefined) {
    params.push(filtros.produtoId);
    conditions.push(`m.produto_id = $${params.length}`);
  }

  if (filtros.dataInicio !== undefined) {
    params.push(filtros.dataInicio);
    conditions.push(`m.created_at >= $${params.length}::date`);
  }

  if (filtros.dataFim !== undefined) {
    params.push(filtros.dataFim);
    conditions.push(
      `m.created_at < ($${params.length}::date + interval '1 day')`,
    );
  }

  const clause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { clause, params };
}

export async function listarMovimentacoes(
  filtros: ListarMovimentacoesFiltros = {},
): Promise<MovimentacaoListRow[]> {
  if (!pool) {
    throw new MovimentacaoError(
      "Base de dados indisponível",
      "POOL_UNAVAILABLE",
    );
  }

  const { clause, params } = buildListWhere(filtros);

  const result = await pool.query<MovimentacaoListRow>(
    `${listSelect}
     ${clause}
     ORDER BY m.created_at DESC`,
    params,
  );

  return result.rows;
}

export async function buscarMovimentacaoPorId(
  id: number,
): Promise<MovimentacaoListRow | null> {
  if (!pool) {
    throw new MovimentacaoError(
      "Base de dados indisponível",
      "POOL_UNAVAILABLE",
    );
  }

  const result = await pool.query<MovimentacaoListRow>(
    `${listSelect}
     WHERE m.id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
}

export async function registrarMovimentacao(
  produtoId: number,
  usuarioId: string,
  tipo: MovimentacaoTipo,
  quantidade: number,
  observacao: string | null,
): Promise<MovimentacaoListRow> {
  if (!pool) {
    throw new MovimentacaoError(
      "Base de dados indisponível",
      "POOL_UNAVAILABLE",
    );
  }

  const client = await pool.connect();
  let movimentacaoId: number;

  try {
    await client.query("BEGIN");

    const produtoResult = await client.query<{ id: number; quantidade: number }>(
      "SELECT id, quantidade FROM produtos WHERE id = $1 FOR UPDATE",
      [produtoId],
    );

    const produto = produtoResult.rows[0];
    if (!produto) {
      throw new MovimentacaoError(
        "Produto não encontrado",
        "PRODUTO_NOT_FOUND",
      );
    }

    if (tipo === "saida" && produto.quantidade < quantidade) {
      throw new MovimentacaoError(
        "Estoque insuficiente para esta saída",
        "ESTOQUE_INSUFICIENTE",
      );
    }

    const insertResult = await client.query<MovimentacaoRow>(
      `INSERT INTO movimentacoes (produto_id, usuario_id, tipo, quantidade, observacao)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [produtoId, usuarioId, tipo, quantidade, observacao],
    );

    movimentacaoId = insertResult.rows[0].id;
    const delta = tipo === "entrada" ? quantidade : -quantidade;

    await client.query(
      "UPDATE produtos SET quantidade = quantidade + $1 WHERE id = $2",
      [delta, produtoId],
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  const detalhe = await buscarMovimentacaoPorId(movimentacaoId);
  if (!detalhe) {
    throw new Error("Falha ao carregar movimentação criada");
  }

  return detalhe;
}
