import { Router, type Response } from "express";
import {
  listarProdutos,
  buscarProdutoPorId,
  criarProduto,
  atualizarProduto,
  deletarProduto,
  vincularFornecedor,
  desvincularFornecedor,
  categoriaExiste,
  fornecedorExiste,
  produtoExiste,
  calcularStatus,
  type ProdutoListRow,
  type ProdutoRow,
  type ProdutoFornecedorVinculoRow,
  type ProdutoDados,
  type ProdutoStatus,
} from "../models/produto";
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

function parseStatusQuery(
  raw: unknown,
): ProdutoStatus | undefined | "invalid" {
  if (raw === undefined || raw === null || raw === "") {
    return undefined;
  }
  if (typeof raw !== "string") {
    return "invalid";
  }
  const status = raw.toLowerCase();
  if (status === "ok" || status === "baixo" || status === "esgotado") {
    return status;
  }
  return "invalid";
}

function toProdutoJson(row: ProdutoRow | ProdutoListRow) {
  const categoriaNome =
    "categoria_nome" in row ? row.categoria_nome : undefined;

  return {
    id: row.id,
    nome: row.nome,
    sku: row.sku,
    descricao: row.descricao,
    preco: Number(row.preco),
    quantidade: row.quantidade,
    quantidadeMinima: row.quantidade_minima,
    tamanhos: row.tamanhos,
    categoriaId: row.categoria_id,
    ...(categoriaNome !== undefined ? { categoriaNome } : {}),
    fornecedorNome:
      "fornecedor_nome" in row ? row.fornecedor_nome : null,
    status: calcularStatus(row.quantidade, row.quantidade_minima),
    createdAt: row.created_at,
  };
}

function toFornecedorVinculoJson(row: ProdutoFornecedorVinculoRow) {
  return {
    id: row.id,
    nome: row.nome,
    email: row.email,
    telefone: row.telefone,
    ativo: row.ativo,
    precoCusto: row.preco_custo !== null ? Number(row.preco_custo) : null,
    prazoEntregaDias: row.prazo_entrega_dias,
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

function parseOptionalInt(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "number") {
    if (!Number.isInteger(value) || value < 0) {
      return "invalid";
    }
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value)) {
    return Number.parseInt(value, 10);
  }
  return "invalid";
}

function parseRequiredInt(value: unknown): number | null | "invalid" {
  const parsed = parseOptionalInt(value);
  if (parsed === null || parsed === "invalid") {
    return parsed ?? "invalid";
  }
  if (parsed < 1) {
    return "invalid";
  }
  return parsed;
}

function parsePreco(value: unknown): number | null | "invalid" {
  if (typeof value === "number") {
    if (!Number.isFinite(value) || value <= 0) {
      return "invalid";
    }
    return Math.round(value * 100) / 100;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const num = Number(value.replace(",", "."));
    if (!Number.isFinite(num) || num <= 0) {
      return "invalid";
    }
    return Math.round(num * 100) / 100;
  }
  return "invalid";
}

function parseOptionalPreco(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  return parsePreco(value);
}

function parseProdutoBody(
  body: unknown,
): { data: ProdutoDados } | { error: string } {
  if (!body || typeof body !== "object") {
    return { error: "Corpo inválido" };
  }

  const o = body as Record<string, unknown>;
  const { nome, sku, descricao, preco, quantidade, quantidadeMinima, tamanhos, categoriaId } = o;

  if (typeof nome !== "string" || nome.trim().length < 1) {
    return { error: "Nome é obrigatório" };
  }
  if (nome.trim().length > 150) {
    return { error: "Nome deve ter no máximo 150 caracteres" };
  }

  if (typeof sku !== "string" || sku.trim().length < 1) {
    return { error: "SKU é obrigatório" };
  }
  if (sku.trim().length > 30) {
    return { error: "SKU deve ter no máximo 30 caracteres" };
  }

  let descricaoNorm: string | null = null;
  if (descricao !== undefined && descricao !== null) {
    if (typeof descricao !== "string") {
      return { error: "Descrição inválida" };
    }
    descricaoNorm = descricao.trim() || null;
  }

  const precoNorm = parsePreco(preco);
  if (precoNorm === "invalid" || precoNorm === null) {
    return { error: "Preço inválido" };
  }

  let quantidadeFinal = 0;
  if (quantidade !== undefined && quantidade !== null) {
    const quantidadeNorm = parseOptionalInt(quantidade);
    if (quantidadeNorm === "invalid" || quantidadeNorm === null) {
      return { error: "Quantidade inválida" };
    }
    quantidadeFinal = quantidadeNorm;
  }

  let quantidadeMinimaFinal = 10;
  if (quantidadeMinima === undefined || quantidadeMinima === null) {
    quantidadeMinimaFinal = 10;
  } else {
    const qMin = parseOptionalInt(quantidadeMinima);
    if (qMin === "invalid" || qMin === null) {
      return { error: "Quantidade mínima inválida" };
    }
    quantidadeMinimaFinal = qMin;
  }

  let tamanhosNorm: string | null = null;
  if (tamanhos !== undefined && tamanhos !== null) {
    if (typeof tamanhos !== "string") {
      return { error: "Tamanhos inválidos" };
    }
    const trimmed = tamanhos.trim();
    if (trimmed.length > 50) {
      return { error: "Tamanhos deve ter no máximo 50 caracteres" };
    }
    tamanhosNorm = trimmed || null;
  }

  const categoriaIdNorm = parseRequiredInt(categoriaId);
  if (categoriaIdNorm === "invalid" || categoriaIdNorm === null) {
    return { error: "Categoria inválida" };
  }

  return {
    data: {
      nome: nome.trim(),
      sku: sku.trim(),
      descricao: descricaoNorm,
      preco: precoNorm,
      quantidade: quantidadeFinal,
      quantidadeMinima: quantidadeMinimaFinal,
      tamanhos: tamanhosNorm,
      categoriaId: categoriaIdNorm,
    },
  };
}

router.get("/", async (req: AuthenticatedRequest, res: Response) => {
  let categoriaId: number | undefined;
  if (req.query.categoria_id !== undefined && req.query.categoria_id !== "") {
    const raw = req.query.categoria_id;
    const parsed =
      typeof raw === "string"
        ? parseRequiredInt(raw)
        : Array.isArray(raw) && typeof raw[0] === "string"
          ? parseRequiredInt(raw[0])
          : "invalid";
    if (parsed === "invalid" || parsed === null) {
      res.status(400).json({ error: "categoria_id inválido" });
      return;
    }
    categoriaId = parsed;
  }

  const status = parseStatusQuery(req.query.status);
  if (status === "invalid") {
    res.status(400).json({ error: "status inválido (use ok, baixo ou esgotado)" });
    return;
  }

  try {
    const rows = await listarProdutos({ categoriaId, status });
    res.json(rows.map(toProdutoJson));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

router.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const result = await buscarProdutoPorId(id);
    if (!result) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }

    res.json({
      ...toProdutoJson(result.produto),
      fornecedores: result.fornecedores.map(toFornecedorVinculoJson),
    });
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao buscar produto" });
  }
});

router.post("/", async (req: AuthenticatedRequest, res: Response) => {
  const parsed = parseProdutoBody(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const existe = await categoriaExiste(parsed.data.categoriaId);
    if (!existe) {
      res.status(400).json({ error: "Categoria não encontrada" });
      return;
    }

    const row = await criarProduto(parsed.data);
    const full = await buscarProdutoPorId(row.id);
    res.status(201).json(toProdutoJson(full!.produto));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    if (isPgUniqueViolation(e)) {
      res.status(409).json({ error: "Já existe um produto com este SKU" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

router.put("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  const parsed = parseProdutoBody(req.body);
  if ("error" in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }

  try {
    const existe = await categoriaExiste(parsed.data.categoriaId);
    if (!existe) {
      res.status(400).json({ error: "Categoria não encontrada" });
      return;
    }

    const row = await atualizarProduto(id, parsed.data);
    if (!row) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }
    const full = await buscarProdutoPorId(id);
    res.json(toProdutoJson(full!.produto));
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    if (isPgUniqueViolation(e)) {
      res.status(409).json({ error: "Já existe um produto com este SKU" });
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

router.delete("/:id", async (req: AuthenticatedRequest, res: Response) => {
  const id = parseIdParam(req.params.id);
  if (id === null) {
    res.status(400).json({ error: "ID inválido" });
    return;
  }

  try {
    const deleted = await deletarProduto(id);
    if (!deleted) {
      res.status(404).json({ error: "Produto não encontrado" });
      return;
    }
    res.status(204).send();
  } catch (e) {
    if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
      handleDbUnavailable(res);
      return;
    }
    console.error(e);
    res.status(500).json({ error: "Erro ao deletar produto" });
  }
});

router.post(
  "/:id/fornecedores",
  async (req: AuthenticatedRequest, res: Response) => {
    const produtoId = parseIdParam(req.params.id);
    if (produtoId === null) {
      res.status(400).json({ error: "ID do produto inválido" });
      return;
    }

    const body = req.body;
    if (!body || typeof body !== "object") {
      res.status(400).json({ error: "Corpo inválido" });
      return;
    }

    const { fornecedorId, precoCusto, prazoEntregaDias } = body as Record<
      string,
      unknown
    >;

    const fornecedorIdNorm = parseRequiredInt(fornecedorId);
    if (fornecedorIdNorm === "invalid" || fornecedorIdNorm === null) {
      res.status(400).json({ error: "fornecedorId inválido" });
      return;
    }

    const precoCustoNorm = parseOptionalPreco(precoCusto);
    if (precoCustoNorm === "invalid") {
      res.status(400).json({ error: "precoCusto inválido" });
      return;
    }

    const prazoNorm = parseOptionalInt(prazoEntregaDias);
    if (prazoNorm === "invalid") {
      res.status(400).json({ error: "prazoEntregaDias inválido" });
      return;
    }

    try {
      const produtoOk = await produtoExiste(produtoId);
      if (!produtoOk) {
        res.status(404).json({ error: "Produto não encontrado" });
        return;
      }

      const fornecedorOk = await fornecedorExiste(fornecedorIdNorm);
      if (!fornecedorOk) {
        res.status(400).json({ error: "Fornecedor não encontrado" });
        return;
      }

      const vinculo = await vincularFornecedor(
        produtoId,
        fornecedorIdNorm,
        precoCustoNorm,
        prazoNorm,
      );
      res.status(201).json(toFornecedorVinculoJson(vinculo));
    } catch (e) {
      if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
        handleDbUnavailable(res);
        return;
      }
      if (isPgUniqueViolation(e)) {
        res.status(409).json({
          error: "Este fornecedor já está vinculado a este produto",
        });
        return;
      }
      console.error(e);
      res.status(500).json({ error: "Erro ao vincular fornecedor" });
    }
  },
);

router.delete(
  "/:id/fornecedores/:fid",
  async (req: AuthenticatedRequest, res: Response) => {
    const produtoId = parseIdParam(req.params.id);
    const fornecedorId = parseIdParam(req.params.fid);

    if (produtoId === null || fornecedorId === null) {
      res.status(400).json({ error: "ID inválido" });
      return;
    }

    try {
      const removed = await desvincularFornecedor(produtoId, fornecedorId);
      if (!removed) {
        res.status(404).json({ error: "Vínculo não encontrado" });
        return;
      }
      res.status(204).send();
    } catch (e) {
      if (e instanceof Error && e.message === "POOL_UNAVAILABLE") {
        handleDbUnavailable(res);
        return;
      }
      console.error(e);
      res.status(500).json({ error: "Erro ao desvincular fornecedor" });
    }
  },
);

export default router;
