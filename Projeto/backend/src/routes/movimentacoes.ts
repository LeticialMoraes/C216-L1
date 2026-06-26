import { Router, type Response } from "express";
import {
  listarMovimentacoes,
  buscarMovimentacaoPorId,
  registrarMovimentacao,
  MovimentacaoError,
  type MovimentacaoListRow,
  type MovimentacaoTipo,
} from "../models/movimentacao";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

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

function parseTipoQuery(raw: unknown): MovimentacaoTipo | undefined | "invalid" {
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  if (typeof raw !== "string") {
    return "invalid";
  }
  const tipo = raw.toLowerCase();
  if (tipo === "entrada" || tipo === "saida") {
    return tipo;
  }
  return "invalid";
}

function parseDateQuery(raw: unknown): string | undefined | "invalid" {
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  if (typeof raw !== "string" || !DATE_REGEX.test(raw)) {
    return "invalid";
  }
  return raw;
}

function toJson(row: MovimentacaoListRow) {
  return {
    id: row.id,
    produtoId: row.produto_id,
    produtoNome: row.produto_nome,
    sku: row.sku,
    usuarioId: row.usuario_id,
    usuarioNome: row.usuario_nome,
    tipo: row.tipo,
    quantidade: row.quantidade,
    observacao: row.observacao,
    createdAt: row.created_at,
  };
}

function handleDbUnavailable(res: Response): void {
  res.status(503).json({
    error: "Base de dados não configurada. Defina DATABASE_URL no .env",
  });
}

function handleMovimentacaoError(error: unknown, res: Response): boolean {
  if (error instanceof MovimentacaoError) {
    if (error.code === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return true;
    }
    if (error.code === "PRODUTO_NOT_FOUND") {
      res.status(404).json({ error: error.message });
      return true;
    }
    if (error.code === "ESTOQUE_INSUFICIENTE") {
      res.status(400).json({ error: error.message });
      return true;
    }
  }
  return false;
}

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  const tipo = parseTipoQuery(req.query.tipo);
  if (tipo === "invalid") {
    res.status(400).json({ error: "tipo inválido (use entrada ou saida)" });
    return;
  }

  let produtoId: number | undefined;
  if (req.query.produto_id !== undefined && req.query.produto_id !== "") {
    const raw = req.query.produto_id;
    const parsed =
      typeof raw === "string"
        ? parseIdParam(raw)
        : Array.isArray(raw) && typeof raw[0] === "string"
          ? parseIdParam(raw[0])
          : null;
    if (parsed === null) {
      res.status(400).json({ error: "produto_id inválido" });
      return;
    }
    produtoId = parsed;
  }

  const dataInicio = parseDateQuery(req.query.data_inicio);
  if (dataInicio === "invalid") {
    res.status(400).json({ error: "data_inicio inválida (use YYYY-MM-DD)" });
    return;
  }

  const dataFim = parseDateQuery(req.query.data_fim);
  if (dataFim === "invalid") {
    res.status(400).json({ error: "data_fim inválida (use YYYY-MM-DD)" });
    return;
  }

  try {
    const rows = await listarMovimentacoes({
      tipo,
      produtoId,
      dataInicio,
      dataFim,
    });
    res.json(rows.map(toJson));
  } catch (error) {
    if (handleMovimentacaoError(error, res)) {
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao listar movimentações" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const row = await buscarMovimentacaoPorId(id);
    if (!row) {
      res.status(404).json({ error: "Movimentação não encontrada" });
      return;
    }
    res.json(toJson(row));
  } catch (error) {
    if (handleMovimentacaoError(error, res)) {
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao buscar movimentação" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const usuarioId = req.user?.sub;
  if (!usuarioId) {
    res.status(401).json({ error: "Autenticação necessária" });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== "object") {
    res.status(400).json({ error: "Corpo inválido" });
    return;
  }

  const { produtoId, tipo, quantidade, observacao } = body as Record<
    string,
    unknown
  >;

  const produtoIdNorm =
    typeof produtoId === "number" && Number.isInteger(produtoId)
      ? produtoId
      : typeof produtoId === "string"
        ? parseIdParam(produtoId)
        : null;
  if (produtoIdNorm === null) {
    res.status(400).json({ error: "produtoId inválido" });
    return;
  }

  if (tipo !== "entrada" && tipo !== "saida") {
    res.status(400).json({ error: "tipo inválido (use entrada ou saida)" });
    return;
  }

  let quantidadeNorm: number | null = null;
  if (typeof quantidade === "number" && Number.isInteger(quantidade)) {
    quantidadeNorm = quantidade;
  } else if (
    typeof quantidade === "string" &&
    /^\d+$/.test(quantidade)
  ) {
    quantidadeNorm = Number.parseInt(quantidade, 10);
  }

  if (quantidadeNorm === null || quantidadeNorm < 1) {
    res.status(400).json({ error: "quantidade inválida" });
    return;
  }

  let observacaoNorm: string | null = null;
  if (observacao !== undefined && observacao !== null) {
    if (typeof observacao !== "string") {
      res.status(400).json({ error: "observacao inválida" });
      return;
    }
    observacaoNorm = observacao.trim() || null;
  }

  try {
    const row = await registrarMovimentacao(
      produtoIdNorm,
      usuarioId,
      tipo,
      quantidadeNorm,
      observacaoNorm,
    );
    res.status(201).json(toJson(row));
  } catch (error) {
    if (handleMovimentacaoError(error, res)) {
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao registrar movimentação" });
  }
});

export default router;
