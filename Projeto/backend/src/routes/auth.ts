import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../db/pool";

const router = Router();

const SALT_ROUNDS = 10;

const ACCESS_PROFILES = ["administrador", "operador", "visualizador"] as const;

type AccessProfile = (typeof ACCESS_PROFILES)[number];

function isAccessProfile(value: unknown): value is AccessProfile {
  return typeof value === "string" && ACCESS_PROFILES.includes(value as AccessProfile);
}

function validateBody(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Corpo inválido";
  }
  const o = body as Record<string, unknown>;
  const first = o.firstName;
  const last = o.lastName;
  const email = o.email;
  const password = o.password;
  const profile = o.accessProfile;

  if (typeof first !== "string" || first.trim().length < 1 || first.length > 120) {
    return "Nome inválido";
  }
  if (typeof last !== "string" || last.trim().length < 1 || last.length > 120) {
    return "Sobrenome inválido";
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "E-mail inválido";
  }
  if (email.length > 255) {
    return "E-mail muito longo";
  }
  if (typeof password !== "string" || password.length < 8) {
    return "Senha deve ter pelo menos 8 caracteres";
  }
  if (!isAccessProfile(profile)) {
    return "Perfil de acesso inválido";
  }
  return null;
}

router.post("/login", async (req: Request, res: Response) => {
  if (!pool) {
    res.status(503).json({
      error: "Base de dados não configurada. Defina DATABASE_URL no .env",
    });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Corpo inválido" });
    return;
  }

  const { email, password } = body as Record<string, unknown>;
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: "E-mail inválido" });
    return;
  }
  if (typeof password !== "string" || password.length < 1) {
    res.status(400).json({ error: "Senha inválida" });
    return;
  }

  const emailNorm = email.trim().toLowerCase();

  try {
    const result = await pool.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      access_profile: string;
      password_hash: string;
    }>(
      `SELECT id, email, first_name, last_name, access_profile, password_hash
       FROM users
       WHERE email = $1`,
      [emailNorm],
    );

    const row = result.rows[0];
    if (!row) {
      res.status(401).json({ error: "E-mail ou senha incorretos" });
      return;
    }

    const match = await bcrypt.compare(password, row.password_hash);
    if (!match) {
      res.status(401).json({ error: "E-mail ou senha incorretos" });
      return;
    }

    res.json({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      accessProfile: row.access_profile,
      message: "Sessão iniciada com sucesso.",
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao iniciar sessão" });
  }
});

router.post("/register", async (req: Request, res: Response) => {
  if (!pool) {
    res.status(503).json({
      error: "Base de dados não configurada. Defina DATABASE_URL no .env",
    });
    return;
  }

  const validationError = validateBody(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const { firstName, lastName, email, password, accessProfile } = req.body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    accessProfile: AccessProfile;
  };

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const emailNorm = email.trim().toLowerCase();

  try {
    const result = await pool.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      access_profile: string;
      created_at: string;
    }>(
      `INSERT INTO users (first_name, last_name, email, password_hash, access_profile)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, first_name, last_name, access_profile, created_at`,
      [
        firstName.trim(),
        lastName.trim(),
        emailNorm,
        passwordHash,
        accessProfile,
      ],
    );

    const row = result.rows[0];
    res.status(201).json({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      accessProfile: row.access_profile,
      createdAt: row.created_at,
      message:
        "Conta criada. (Verificação de e-mail pode ser ligada depois no backend.)",
    });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") {
      res.status(409).json({ error: "Este e-mail já está registado" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao criar conta" });
  }
});

export default router;
