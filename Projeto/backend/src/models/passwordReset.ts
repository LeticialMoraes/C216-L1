import bcrypt from "bcrypt";
import { pool } from "../../db/pool";

const SALT_ROUNDS = 10;

export async function redefinirSenhaPorEmail(
  email: string,
  novaSenha: string,
): Promise<void> {
  if (!pool) {
    throw new Error("POOL_UNAVAILABLE");
  }

  const passwordHash = await bcrypt.hash(novaSenha, SALT_ROUNDS);

  const result = await pool.query(
    "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id",
    [passwordHash, email],
  );

  if ((result.rowCount ?? 0) === 0) {
    throw new Error("EMAIL_NAO_ENCONTRADO");
  }
}
