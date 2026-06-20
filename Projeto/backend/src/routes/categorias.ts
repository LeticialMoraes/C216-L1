import { Router, type Response } from "express";
import {
  listarCategorias,
  buscarCategoriaPorId,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
  type CategoriaRow,
} from "../models/categoria";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

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

function toJson(row: CategoriaRow) {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    createdAt: row.created_at,
  };
}

function isPgUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: unknown }).code === "23505"
  );
}

function handleDbUnavailable(res: Response): void {
  res.status(503).json({
    error: "Base de dados não configurada. Defina DATABASE_URL no .env",
  });
}

router.get("/", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await listarCategorias();
    res.json(rows.map(toJson));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao listar categorias" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const row = await buscarCategoriaPorId(id);
    if (!row) {
      res.status(404).json({ error: "Categoria não encontrada" });
      return;
    }
    res.json(toJson(row));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar categoria" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Corpo inválido" });
    return;
  }

  const { nome, descricao } = body as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length < 1) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }
  if (nome.trim().length > 100) {
    res.status(400).json({ error: "Nome deve ter no máximo 100 caracteres" });
    return;
  }

  let descricaoNorm: string | null = null;
  if (descricao !== undefined && descricao !== null) {
    if (typeof descricao !== "string") {
      res.status(400).json({ error: "Descrição inválida" });
      return;
    }
    descricaoNorm = descricao.trim() || null;
  }

  try {
    const row = await criarCategoria(nome.trim(), descricaoNorm);
    res.status(201).json(toJson(row));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    if (isPgUniqueViolation(e)) {
      res.status(409).json({ error: "Já existe uma categoria com este nome" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao criar categoria" });
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

  const { nome, descricao } = body as Record<string, unknown>;

  if (typeof nome !== "string" || nome.trim().length < 1) {
    res.status(400).json({ error: "Nome é obrigatório" });
    return;
  }
  if (nome.trim().length > 100) {
    res.status(400).json({ error: "Nome deve ter no máximo 100 caracteres" });
    return;
  }

  let descricaoNorm: string | null = null;
  if (descricao !== undefined && descricao !== null) {
    if (typeof descricao !== "string") {
      res.status(400).json({ error: "Descrição inválida" });
      return;
    }
    descricaoNorm = descricao.trim() || null;
  }

  try {
    const row = await atualizarCategoria(id, nome.trim(), descricaoNorm);
    if (!row) {
      res.status(404).json({ error: "Categoria não encontrada" });
      return;
    }
    res.json(toJson(row));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    if (isPgUniqueViolation(e)) {
      res.status(409).json({ error: "Já existe uma categoria com este nome" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao atualizar categoria" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const deleted = await deletarCategoria(id);
    if (!deleted) {
      res.status(404).json({ error: "Categoria não encontrada" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao deletar categoria" });
  }
});

export default router;
