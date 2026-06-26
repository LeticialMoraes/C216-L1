import { Router, type Request, type Response } from "express";
import bcrypt from "bcrypt";
import { pool } from "../../db/pool";
import { signAuthToken } from "../lib/authToken";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";
import {
  redefinirSenhaPorEmail,
} from "../models/passwordReset";

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

    const token = signAuthToken({
      sub: row.id,
      email: row.email,
      accessProfile: row.access_profile,
    });

    res.json({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      accessProfile: row.access_profile,
      token,
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

function validateProfileBody(body: unknown): string | null {
  if (!body || typeof body !== "object") {
    return "Corpo inválido";
  }
  const o = body as Record<string, unknown>;
  const first = o.firstName;
  const last = o.lastName;
  const email = o.email;
  const password = o.password;

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
  if (
    password !== undefined &&
    password !== null &&
    (typeof password !== "string" || password.length < 8)
  ) {
    return "Senha deve ter pelo menos 8 caracteres";
  }
  return null;
}

router.get("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!pool) {
    res.status(503).json({
      error: "Base de dados não configurada. Defina DATABASE_URL no .env",
    });
    return;
  }

  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  try {
    const result = await pool.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      access_profile: string;
    }>(
      `SELECT id, email, first_name, last_name, access_profile
       FROM users
       WHERE id = $1`,
      [userId],
    );

    const row = result.rows[0];
    if (!row) {
      res.status(401).json({ error: "Sessão inválida ou expirada" });
      return;
    }

    res.json({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      accessProfile: row.access_profile,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro ao carregar perfil" });
  }
});

router.put("/me", requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  if (!pool) {
    res.status(503).json({
      error: "Base de dados não configurada. Defina DATABASE_URL no .env",
    });
    return;
  }

  const userId = req.user?.sub;
  if (!userId) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  const validationError = validateProfileBody(req.body);
  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  const { firstName, lastName, email, password } = req.body as {
    firstName: string;
    lastName: string;
    email: string;
    password?: string;
  };

  const emailNorm = email.trim().toLowerCase();

  try {
    const passwordHash =
      typeof password === "string" && password.length >= 8
        ? await bcrypt.hash(password, SALT_ROUNDS)
        : null;

    const result = await pool.query<{
      id: string;
      email: string;
      first_name: string;
      last_name: string;
      access_profile: string;
    }>(
      passwordHash
        ? `UPDATE users
           SET first_name = $1, last_name = $2, email = $3, password_hash = $4
           WHERE id = $5
           RETURNING id, email, first_name, last_name, access_profile`
        : `UPDATE users
           SET first_name = $1, last_name = $2, email = $3
           WHERE id = $4
           RETURNING id, email, first_name, last_name, access_profile`,
      passwordHash
        ? [
            firstName.trim(),
            lastName.trim(),
            emailNorm,
            passwordHash,
            userId,
          ]
        : [firstName.trim(), lastName.trim(), emailNorm, userId],
    );

    const row = result.rows[0];
    if (!row) {
      res.status(401).json({ error: "Sessão inválida ou expirada" });
      return;
    }

    const token = signAuthToken({
      sub: row.id,
      email: row.email,
      accessProfile: row.access_profile,
    });

    res.json({
      id: row.id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      accessProfile: row.access_profile,
      token,
      message: "Perfil atualizado com sucesso.",
    });
  } catch (e: unknown) {
    const err = e as { code?: string };
    if (err.code === "23505") {
      res.status(409).json({ error: "Este e-mail já está registado" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao atualizar perfil" });
  }
});

router.post("/reset-password", async (req: Request, res: Response) => {
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
  if (typeof password !== "string" || password.length < 8) {
    res.status(400).json({ error: "Senha deve ter pelo menos 8 caracteres" });
    return;
  }

  try {
    await redefinirSenhaPorEmail(email.trim().toLowerCase(), password);
    res.json({ message: "Senha redefinida com sucesso." });
  } catch (e) {
    if (e instanceof Error && e.message === "EMAIL_NAO_ENCONTRADO") {
      res.status(404).json({ error: "Não existe conta com este e-mail" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao redefinir senha" });
  }
});

export default router;
