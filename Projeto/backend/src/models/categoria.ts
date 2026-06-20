import { pool } from "../../db/pool";

export type CategoriaRow = {
  id: number;
  nome: string;
  descricao: string | null;
  created_at: Date;
};

export type CategoriaListRow = CategoriaRow & {
  total_produtos: number;
};

export async function listarCategorias(): Promise<CategoriaListRow[]> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<CategoriaListRow>(
    `SELECT c.*,
            (
              SELECT COUNT(*)::int
              FROM produtos p
              WHERE p.categoria_id = c.id
            ) AS total_produtos
     FROM categorias c
     ORDER BY c.nome`,
  );
  return result.rows;
}

export async function buscarCategoriaPorId(
  id: number,
): Promise<CategoriaRow | null> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<CategoriaRow>(
    "SELECT * FROM categorias WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function criarCategoria(
  nome: string,
  descricao: string | null,
): Promise<CategoriaRow> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<CategoriaRow>(
    "INSERT INTO categorias (nome, descricao) VALUES ($1, $2) RETURNING *",
    [nome, descricao],
  );
  return result.rows[0];
}

export async function atualizarCategoria(
  id: number,
  nome: string,
  descricao: string | null,
): Promise<CategoriaRow | null> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<CategoriaRow>(
    "UPDATE categorias SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *",
    [nome, descricao, id],
  );
  return result.rows[0] ?? null;
}

export async function deletarCategoria(id: number): Promise<boolean> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query(
    "DELETE FROM categorias WHERE id = $1",
    [id],
  );
  return (result.rowCount ?? 0) > 0;
}
