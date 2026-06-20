import { pool } from "../../db/pool";

export type ProdutoStatus = "ok" | "baixo" | "esgotado";

export type ProdutoRow = {
  id: number;
  nome: string;
  sku: string;
  descricao: string | null;
  preco: string;
  quantidade: number;
  quantidade_minima: number;
  tamanhos: string | null;
  categoria_id: number;
  created_at: Date;
};

export type ProdutoListRow = ProdutoRow & {
  categoria_nome: string;
  fornecedor_nome: string | null;
};

export type ProdutoFornecedorVinculoRow = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  created_at: Date;
  preco_custo: string | null;
  prazo_entrega_dias: number | null;
};

export type ListarProdutosFiltros = {
  categoriaId?: number;
  status?: ProdutoStatus;
};

export type ProdutoDados = {
  nome: string;
  sku: string;
  descricao: string | null;
  preco: number;
  quantidade: number;
  quantidadeMinima: number;
  tamanhos: string | null;
  categoriaId: number;
};

export function calcularStatus(
  quantidade: number,
  quantidadeMinima: number,
): ProdutoStatus {
  if (quantidade <= 0) {
    return "esgotado";
  }
  if (quantidade <= quantidadeMinima) {
    return "baixo";
  }
  return "ok";
}

export async function categoriaExiste(categoriaId: number): Promise<boolean> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<{ id: number }>(
    "SELECT id FROM categorias WHERE id = $1",
    [categoriaId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function fornecedorExiste(fornecedorId: number): Promise<boolean> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<{ id: number }>(
    "SELECT id FROM fornecedores WHERE id = $1",
    [fornecedorId],
  );
  return (result.rowCount ?? 0) > 0;
}

export async function listarProdutos(
  filtros: ListarProdutosFiltros = {},
): Promise<ProdutoListRow[]> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filtros.categoriaId !== undefined) {
    params.push(filtros.categoriaId);
    conditions.push(`p.categoria_id = $${params.length}`);
  }

  if (filtros.status === "esgotado") {
    conditions.push("p.quantidade <= 0");
  } else if (filtros.status === "baixo") {
    conditions.push("p.quantidade > 0 AND p.quantidade <= p.quantidade_minima");
  } else if (filtros.status === "ok") {
    conditions.push("p.quantidade > p.quantidade_minima");
  }

  const whereClause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const result = await pool.query<ProdutoListRow>(
    `SELECT p.*,
            c.nome AS categoria_nome,
            (
              SELECT f.nome
              FROM produto_fornecedor pf
              JOIN fornecedores f ON f.id = pf.fornecedor_id
              WHERE pf.produto_id = p.id
              ORDER BY f.nome
              LIMIT 1
            ) AS fornecedor_nome
     FROM produtos p
     JOIN categorias c ON p.categoria_id = c.id
     ${whereClause}
     ORDER BY p.nome`,
    params,
  );

  return result.rows;
}

export async function buscarProdutoPorId(
  id: number,
): Promise<{ produto: ProdutoListRow; fornecedores: ProdutoFornecedorVinculoRow[] } | null> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const produtoResult = await pool.query<ProdutoListRow>(
    `SELECT p.*,
            c.nome AS categoria_nome,
            (
              SELECT f.nome
              FROM produto_fornecedor pf
              JOIN fornecedores f ON f.id = pf.fornecedor_id
              WHERE pf.produto_id = p.id
              ORDER BY f.nome
              LIMIT 1
            ) AS fornecedor_nome
     FROM produtos p
     JOIN categorias c ON p.categoria_id = c.id
     WHERE p.id = $1`,
    [id],
  );

  const produto = produtoResult.rows[0];
  if (!produto) {
    return null;
  }

  const fornecedoresResult = await pool.query<ProdutoFornecedorVinculoRow>(
    `SELECT f.*, pf.preco_custo, pf.prazo_entrega_dias
     FROM fornecedores f
     JOIN produto_fornecedor pf ON f.id = pf.fornecedor_id
     WHERE pf.produto_id = $1
     ORDER BY f.nome`,
    [id],
  );

  return {
    produto,
    fornecedores: fornecedoresResult.rows,
  };
}

export async function criarProduto(dados: ProdutoDados): Promise<ProdutoRow> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<ProdutoRow>(
    `INSERT INTO produtos (
       nome, sku, descricao, preco, quantidade, quantidade_minima, tamanhos, categoria_id
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [
      dados.nome,
      dados.sku,
      dados.descricao,
      dados.preco,
      dados.quantidade,
      dados.quantidadeMinima,
      dados.tamanhos,
      dados.categoriaId,
    ],
  );

  return result.rows[0];
}

export async function atualizarProduto(
  id: number,
  dados: ProdutoDados,
): Promise<ProdutoRow | null> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<ProdutoRow>(
    `UPDATE produtos
     SET nome = $1,
         sku = $2,
         descricao = $3,
         preco = $4,
         quantidade = $5,
         quantidade_minima = $6,
         tamanhos = $7,
         categoria_id = $8
     WHERE id = $9
     RETURNING *`,
    [
      dados.nome,
      dados.sku,
      dados.descricao,
      dados.preco,
      dados.quantidade,
      dados.quantidadeMinima,
      dados.tamanhos,
      dados.categoriaId,
      id,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deletarProduto(id: number): Promise<boolean> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query("DELETE FROM produtos WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}

export async function vincularFornecedor(
  produtoId: number,
  fornecedorId: number,
  precoCusto: number | null,
  prazoEntregaDias: number | null,
): Promise<ProdutoFornecedorVinculoRow> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  await pool.query(
    `INSERT INTO produto_fornecedor (produto_id, fornecedor_id, preco_custo, prazo_entrega_dias)
     VALUES ($1, $2, $3, $4)`,
    [produtoId, fornecedorId, precoCusto, prazoEntregaDias],
  );

  const vinculo = await pool.query<ProdutoFornecedorVinculoRow>(
    `SELECT f.*, pf.preco_custo, pf.prazo_entrega_dias
     FROM fornecedores f
     JOIN produto_fornecedor pf ON f.id = pf.fornecedor_id
     WHERE pf.produto_id = $1 AND pf.fornecedor_id = $2`,
    [produtoId, fornecedorId],
  );

  return vinculo.rows[0];
}

export async function desvincularFornecedor(
  produtoId: number,
  fornecedorId: number,
): Promise<boolean> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query(
    `DELETE FROM produto_fornecedor
     WHERE produto_id = $1 AND fornecedor_id = $2`,
    [produtoId, fornecedorId],
  );

  return (result.rowCount ?? 0) > 0;
}

export async function produtoExiste(produtoId: number): Promise<boolean> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<{ id: number }>(
    "SELECT id FROM produtos WHERE id = $1",
    [produtoId],
  );
  return (result.rowCount ?? 0) > 0;
}
