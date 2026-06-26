import { Router, type Response } from "express";
import {
  getRelatorioEstoque,
  getRelatorioMovimentacoes,
  RelatorioError,
  type RelatorioEstoqueDados,
  type RelatorioMovimentacoesDados,
  type RelatorioMovimentacaoFiltros,
} from "../models/relatorio";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function parseTipoQuery(
  raw: unknown,
): RelatorioMovimentacaoFiltros["tipo"] | undefined | "invalid" {
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

function estoqueToJson(dados: RelatorioEstoqueDados) {
  return {
    itens: dados.itens.map((item) => ({
      nome: item.nome,
      categoriaNome: item.categoria_nome,
      quantidade: item.quantidade,
      quantidadeMinima: item.quantidade_minima,
      preco: item.preco,
      valorEstoque: item.valor_estoque,
      status: item.status,
    })),
    resumo: {
      totalProdutos: dados.resumo.total_produtos,
      totalItens: dados.resumo.total_itens,
      valorTotalEstoque: dados.resumo.valor_total_estoque,
    },
  };
}

function movimentacoesToJson(dados: RelatorioMovimentacoesDados) {
  return {
    totais: {
      totalMovimentacoes: dados.totais.total_movimentacoes,
      totalEntradas: dados.totais.total_entradas,
      totalSaidas: dados.totais.total_saidas,
    },
    itens: dados.itens.map((item) => ({
      id: item.id,
      produtoNome: item.produto_nome,
      usuarioNome: item.usuario_nome,
      tipo: item.tipo,
      quantidade: item.quantidade,
      observacao: item.observacao,
      createdAt: item.created_at,
    })),
  };
}

router.get("/estoque", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const dados = await getRelatorioEstoque();
    res.json(estoqueToJson(dados));
  } catch (error) {
    if (error instanceof RelatorioError && error.code === "POOL_UNAVAILABLE") {
      res.status(503).json({
        error: "Base de dados não configurada. Defina DATABASE_URL no .env",
      });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao gerar relatório de estoque" });
  }
});

router.get(
  "/movimentacoes",
  async (req: AuthenticatedRequest, res: Response) => {
    const tipo = parseTipoQuery(req.query.tipo);
    if (tipo === "invalid") {
      res.status(400).json({ error: "tipo inválido (use entrada ou saida)" });
      return;
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
      const dados = await getRelatorioMovimentacoes({
        tipo,
        dataInicio,
        dataFim,
      });
      res.json(movimentacoesToJson(dados));
    } catch (error) {
      if (
        error instanceof RelatorioError &&
        error.code === "POOL_UNAVAILABLE"
      ) {
        res.status(503).json({
          error: "Base de dados não configurada. Defina DATABASE_URL no .env",
        });
        return;
      }
      console.error(error);
      res.status(500).json({ error: "Erro ao gerar relatório de movimentações" });
    }
  },
);

export default router;
