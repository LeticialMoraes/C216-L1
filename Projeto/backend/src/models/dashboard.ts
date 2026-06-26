import { pool } from "../../db/pool";

export type MovimentacaoRecenteRow = {
  tipo: "entrada" | "saida";
  quantidade: number;
  created_at: Date;
  produto_nome: string;
  sku: string;
};

export type ProdutoCriticoRow = {
  nome: string;
  sku: string;
  quantidade: number;
  quantidade_minima: number;
  categoria_nome: string;
};

export type DashboardDados = {
  total_produtos: number;
  total_itens_estoque: number;
  produtos_estoque_baixo: number;
  produtos_esgotados: number;
  movimentacoes_recentes: MovimentacaoRecenteRow[];
  produtos_criticos: ProdutoCriticoRow[];
};

export class DashboardError extends Error {
  constructor(
    message: string,
    public readonly code: "POOL_UNAVAILABLE",
  ) {
    super(message);
    this.name = "DashboardError";
  }
}

function toInt(value: string | number | null | undefined): number {
  if (value === null || value === undefined) {
    return 0;
  }
  return Number(value);
}

export async function getDadosDashboard(): Promise<DashboardDados> {
  if (!pool) {
    throw new DashboardError(
      "Base de dados indisponível",
      "POOL_UNAVAILABLE",
    );
  }

  const [totais, estoques, recentes, criticos] = await Promise.all([
    pool.query<{ total_produtos: string }>(
      "SELECT COUNT(*) AS total_produtos FROM produtos",
    ),
    pool.query<{
      total_itens_estoque: string | null;
      produtos_esgotados: string;
      produtos_estoque_baixo: string;
    }>(`
      SELECT
        SUM(quantidade) AS total_itens_estoque,
        COUNT(*) FILTER (WHERE quantidade = 0) AS produtos_esgotados,
        COUNT(*) FILTER (WHERE quantidade > 0 AND quantidade <= quantidade_minima) AS produtos_estoque_baixo
      FROM produtos
    `),
    pool.query<MovimentacaoRecenteRow>(`
      SELECT m.tipo, m.quantidade, m.created_at,
             p.nome AS produto_nome, p.sku
      FROM movimentacoes m
      JOIN produtos p ON m.produto_id = p.id
      ORDER BY m.created_at DESC
      LIMIT 5
    `),
    pool.query<ProdutoCriticoRow>(`
      SELECT p.nome, p.sku, p.quantidade, p.quantidade_minima,
             c.nome AS categoria_nome
      FROM produtos p
      JOIN categorias c ON p.categoria_id = c.id
      WHERE p.quantidade <= p.quantidade_minima
      ORDER BY p.quantidade ASC
      LIMIT 5
    `),
  ]);

  const estoque = estoques.rows[0];

  return {
    total_produtos: toInt(totais.rows[0]?.total_produtos),
    total_itens_estoque: toInt(estoque?.total_itens_estoque),
    produtos_esgotados: toInt(estoque?.produtos_esgotados),
    produtos_estoque_baixo: toInt(estoque?.produtos_estoque_baixo),
    movimentacoes_recentes: recentes.rows,
    produtos_criticos: criticos.rows,
  };
}
