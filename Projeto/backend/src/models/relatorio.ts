import { pool } from "../../db/pool";
import { calcularStatus } from "./produto";

export type RelatorioEstoqueItemRow = {
  nome: string;
  categoria_nome: string;
  quantidade: number;
  quantidade_minima: number;
  preco: string;
};

export type RelatorioEstoqueResumoRow = {
  total_produtos: string;
  total_itens: string | null;
  valor_total_estoque: string | null;
};

export type RelatorioMovimentacaoFiltros = {
  tipo?: "entrada" | "saida";
  dataInicio?: string;
  dataFim?: string;
};

export type RelatorioMovimentacaoItemRow = {
  id: number;
  produto_nome: string;
  usuario_nome: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  observacao: string | null;
  created_at: Date;
};

export type RelatorioMovimentacaoTotaisRow = {
  total_movimentacoes: string;
  total_entradas: string | null;
  total_saidas: string | null;
};

export type RelatorioEstoqueItem = {
  nome: string;
  categoria_nome: string;
  quantidade: number;
  quantidade_minima: number;
  preco: number;
  valor_estoque: number;
  status: "ok" | "baixo" | "esgotado";
};

export type RelatorioEstoqueDados = {
  itens: RelatorioEstoqueItem[];
  resumo: {
    total_produtos: number;
    total_itens: number;
    valor_total_estoque: number;
  };
};

export type RelatorioMovimentacoesDados = {
  totais: {
    total_movimentacoes: number;
    total_entradas: number;
    total_saidas: number;
  };
  itens: RelatorioMovimentacaoItemRow[];
};

export class RelatorioError extends Error {
  constructor(
    message: string,
    public readonly code: "POOL_UNAVAILABLE",
  ) {
    super(message);
    this.name = "RelatorioError";
  }
}

function toInt(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}

function buildMovimentacoesWhere(
  filtros: RelatorioMovimentacaoFiltros,
): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filtros.tipo !== undefined) {
    params.push(filtros.tipo);
    conditions.push(`m.tipo = $${params.length}`);
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

export async function getRelatorioEstoque(): Promise<RelatorioEstoqueDados> {
  if (!pool) {
    throw new RelatorioError("Base de dados indisponível", "POOL_UNAVAILABLE");
  }

  const [itensResult, resumoResult] = await Promise.all([
    pool.query<RelatorioEstoqueItemRow>(`
      SELECT p.nome,
             c.nome AS categoria_nome,
             p.quantidade,
             p.quantidade_minima,
             p.preco
      FROM produtos p
      JOIN categorias c ON p.categoria_id = c.id
      ORDER BY
        CASE
          WHEN p.quantidade = 0 THEN 0
          WHEN p.quantidade <= p.quantidade_minima THEN 1
          ELSE 2
        END,
        p.nome ASC
    `),
    pool.query<RelatorioEstoqueResumoRow>(`
      SELECT COUNT(*) AS total_produtos,
             COALESCE(SUM(quantidade), 0) AS total_itens,
             COALESCE(SUM(quantidade * preco), 0) AS valor_total_estoque
      FROM produtos
    `),
  ]);

  const resumoRow = resumoResult.rows[0];

  return {
    itens: itensResult.rows.map((row) => {
      const preco = toNumber(row.preco);
      const quantidade = row.quantidade;
      return {
        nome: row.nome,
        categoria_nome: row.categoria_nome,
        quantidade,
        quantidade_minima: row.quantidade_minima,
        preco,
        valor_estoque: quantidade * preco,
        status: calcularStatus(quantidade, row.quantidade_minima),
      };
    }),
    resumo: {
      total_produtos: toInt(resumoRow?.total_produtos),
      total_itens: toInt(resumoRow?.total_itens),
      valor_total_estoque: toNumber(resumoRow?.valor_total_estoque),
    },
  };
}

export async function getRelatorioMovimentacoes(
  filtros: RelatorioMovimentacaoFiltros = {},
): Promise<RelatorioMovimentacoesDados> {
  if (!pool) {
    throw new RelatorioError("Base de dados indisponível", "POOL_UNAVAILABLE");
  }

  const { clause, params } = buildMovimentacoesWhere(filtros);

  const [itensResult, totaisResult] = await Promise.all([
    pool.query<RelatorioMovimentacaoItemRow>(
      `
      SELECT m.id,
             p.nome AS produto_nome,
             TRIM(u.first_name || ' ' || u.last_name) AS usuario_nome,
             m.tipo,
             m.quantidade,
             m.observacao,
             m.created_at
      FROM movimentacoes m
      JOIN produtos p ON m.produto_id = p.id
      JOIN users u ON m.usuario_id = u.id
      ${clause}
      ORDER BY m.created_at DESC
    `,
      params,
    ),
    pool.query<RelatorioMovimentacaoTotaisRow>(
      `
      SELECT COUNT(*) AS total_movimentacoes,
             COALESCE(SUM(m.quantidade) FILTER (WHERE m.tipo = 'entrada'), 0) AS total_entradas,
             COALESCE(SUM(m.quantidade) FILTER (WHERE m.tipo = 'saida'), 0) AS total_saidas
      FROM movimentacoes m
      ${clause}
    `,
      params,
    ),
  ]);

  const totaisRow = totaisResult.rows[0];

  return {
    totais: {
      total_movimentacoes: toInt(totaisRow?.total_movimentacoes),
      total_entradas: toInt(totaisRow?.total_entradas),
      total_saidas: toInt(totaisRow?.total_saidas),
    },
    itens: itensResult.rows,
  };
}
