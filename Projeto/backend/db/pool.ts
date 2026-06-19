import dotenv from "dotenv";
import pg from "pg";
import { parse as parseConnectionString } from "pg-connection-string";

dotenv.config();

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL?.trim();

function poolFromPgEnv(): pg.Pool | null {
  if (
    process.env.PGHOST &&
    process.env.PGUSER &&
    process.env.PGDATABASE
  ) {
    return new Pool();
  }
  return null;
}

function createPool(): pg.Pool | null {
  if (databaseUrl) {
    try {
      parseConnectionString(databaseUrl);
      return new Pool({ connectionString: databaseUrl });
    } catch {
      console.warn(
        "[db] DATABASE_URL inválido (URL mal formado). " +
          "Caracteres como # ? & : @ na password têm de ir codificados (ex.: # → %23). " +
          "Ou comente DATABASE_URL e defina PGHOST, PGPORT, PGUSER, PGPASSWORD e PGDATABASE.",
      );
      return poolFromPgEnv();
    }
  }

  const fromEnv = poolFromPgEnv();
  if (fromEnv) return fromEnv;

  console.warn(
    "[db] Sem ligação à BD: defina DATABASE_URL válido ou PGHOST+PGUSER+PGDATABASE (e PGPASSWORD se precisar).",
  );
  return null;
}

export const pool = createPool();
