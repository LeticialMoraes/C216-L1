import { Router, type Response } from "express";
import {
  getDadosDashboard,
  DashboardError,
  type DashboardDados,
  type MovimentacaoRecenteRow,
  type ProdutoCriticoRow,
} from "../models/dashboard";
import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middlewares/requireAuth";

const router = Router();

router.use(requireAuth);

function toJson(dados: DashboardDados) {
  return {
    total_produtos: dados.total_produtos,
    total_itens_estoque: dados.total_itens_estoque,
    produtos_estoque_baixo: dados.produtos_estoque_baixo,
    produtos_esgotados: dados.produtos_esgotados,
    movimentacoes_recentes: dados.movimentacoes_recentes.map(
      (mov: MovimentacaoRecenteRow) => ({
        tipo: mov.tipo,
        quantidade: mov.quantidade,
        created_at: mov.created_at,
        produto_nome: mov.produto_nome,
        sku: mov.sku,
      }),
    ),
    produtos_criticos: dados.produtos_criticos.map((prod: ProdutoCriticoRow) => ({
      nome: prod.nome,
      sku: prod.sku,
      quantidade: prod.quantidade,
      quantidade_minima: prod.quantidade_minima,
      categoria_nome: prod.categoria_nome,
    })),
  };
}

router.get("/", async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const dados = await getDadosDashboard();
    res.json(toJson(dados));
  } catch (error) {
    if (error instanceof DashboardError && error.code === "POOL_UNAVAILABLE") {
      res.status(503).json({
        error: "Base de dados não configurada. Defina DATABASE_URL no .env",
      });
      return;
    }
    console.error(error);
    res.status(500).json({ error: "Erro ao carregar dashboard" });
  }
});

export default router;
