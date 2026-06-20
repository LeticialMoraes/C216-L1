import { pool } from "../../db/pool";

export type FornecedorRow = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  created_at: Date;
};

export type FornecedorListRow = FornecedorRow & {
  produtos_vinculados: number;
};

export async function listarFornecedores(): Promise<FornecedorListRow[]> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<FornecedorListRow>(
    `SELECT f.*,
            (
              SELECT COUNT(*)::int
              FROM produto_fornecedor pf
              WHERE pf.fornecedor_id = f.id
            ) AS produtos_vinculados
     FROM fornecedores f
     ORDER BY f.nome`,
  );
  return result.rows;
}

export async function buscarFornecedorPorId(
  id: number,
): Promise<FornecedorRow | null> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<FornecedorRow>(
    "SELECT * FROM fornecedores WHERE id = $1",
    [id],
  );
  return result.rows[0] ?? null;
}

export async function criarFornecedor(
  nome: string,
  email: string | null,
  telefone: string | null,
): Promise<FornecedorRow> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<FornecedorRow>(
    "INSERT INTO fornecedores (nome, email, telefone) VALUES ($1, $2, $3) RETURNING *",
    [nome, email, telefone],
  );
  return result.rows[0];
}

export async function atualizarFornecedor(
  id: number,
  nome: string,
  email: string | null,
  telefone: string | null,
  ativo: boolean,
): Promise<FornecedorRow | null> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query<FornecedorRow>(
    "UPDATE fornecedores SET nome = $1, email = $2, telefone = $3, ativo = $4 WHERE id = $5 RETURNING *",
    [nome, email, telefone, ativo, id],
  );
  return result.rows[0] ?? null;
}

export async function deletarFornecedor(id: number): Promise<boolean> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const result = await pool.query("DELETE FROM fornecedores WHERE id = $1", [
    id,
  ]);
  return (result.rowCount ?? 0) > 0;
}
