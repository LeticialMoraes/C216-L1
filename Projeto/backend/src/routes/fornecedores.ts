import { Router, type Response } from "express";
import {
  listarFornecedores,
  buscarFornecedorPorId,
  criarFornecedor,
  atualizarFornecedor,
  deletarFornecedor,
  type FornecedorRow,
  type FornecedorListRow,
} from "../models/fornecedor";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseIdParam(raw: string | string[] | undefined): number | null {
  if (typeof raw !== "string") {
    return null;
  }
  const id = Number.parseInt(raw, 10);
  if (!Number.isInteger(id) || id < 1) {
    return null;
  }
  return id;
}

function toJson(row: FornecedorRow | FornecedorListRow) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    ativo: row.ativo,
    produtosVinculados:
      "produtos_vinculados" in row ? row.produtos_vinculados : 0,
    createdAt: row.created_at,
  };
}

function handleDbUnavailable(res: Response): void {
  res.status(503).json({
    error: "Base de dados não configurada. Defina DATABASE_URL no .env",
  });
}

function normalizeOptionalString(
  value: unknown,
  maxLength: number,
): string | null | "invalid" {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value !== "string") {
    return "invalid";
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > maxLength) {
    return "invalid";
  }
  return trimmed;
}

function validateEmail(value: unknown): string | null | "invalid" {
  const email = normalizeOptionalString(value, 150);
  if (email === "invalid") {
    return "invalid";
  }
  if (email === null) {
    return null;
  }
  if (!EMAIL_REGEX.test(email)) {
    return "invalid";
  }
  return email;
}

function validateTelefone(value: unknown): string | null | "invalid" {
  return normalizeOptionalString(value, 20);
}

router.get("/", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await listarFornecedores();
    res.json(rows.map(toJson));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao listar fornecedores" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const row = await buscarFornecedorPorId(id);
    if (!row) {
      res.status(404).json({ error: "Fornecedor não encontrado" });
      return;
    }
    res.json(toJson(row));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar fornecedor" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Corpo inválido" });
    return;
  }

  const { nome, email, telefone } = body as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length < 1) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }
  if (nome.trim().length > 150) {
    res.status(400).json({ error: "Nome deve ter no máximo 150 caracteres" });
    return;
  }

  const emailNorm = validateEmail(email);
  if (emailNorm === "invalid") {
    res.status(400).json({ error: "E-mail inválido" });
    return;
  }

  const telefoneNorm = validateTelefone(telefone);
  if (telefoneNorm === "invalid") {
    res.status(400).json({ error: "Telefone inválido" });
    return;
  }

  try {
    const row = await criarFornecedor(nome.trim(), emailNorm, telefoneNorm);
    res.status(201).json(toJson(row));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao criar fornecedor" });
  }
});

router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Corpo inválido" });
    return;
  }

  const { nome, email, telefone, ativo } = body as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length < 1) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }
  if (nome.trim().length > 150) {
    res.status(400).json({ error: "Nome deve ter no máximo 150 caracteres" });
    return;
  }

  const emailNorm = validateEmail(email);
  if (emailNorm === "invalid") {
    res.status(400).json({ error: "E-mail inválido" });
    return;
  }

  const telefoneNorm = validateTelefone(telefone);
  if (telefoneNorm === "invalid") {
    res.status(400).json({ error: "Telefone inválido" });
    return;
  }

  if (typeof ativo !== "boolean") {
    res.status(400).json({ error: "Campo ativo deve ser booleano" });
    return;
  }

  try {
    const row = await atualizarFornecedor(
      id,
      nome.trim(),
      emailNorm,
      telefoneNorm,
      ativo,
    );
    if (!row) {
      res.status(404).json({ error: "Fornecedor não encontrado" });
      return;
    }
    res.json(toJson(row));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao atualizar fornecedor" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const deleted = await deletarFornecedor(id);
    if (!deleted) {
      res.status(404).json({ error: "Fornecedor não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao deletar fornecedor" });
  }
});

export default router;
