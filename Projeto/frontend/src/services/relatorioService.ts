import { routes } from "./routes";
import { getAuthToken } from "../utils/authStorage";
import type { ProdutoStatus } from "../utils/produtoStatus";

export type RelatorioEstoqueItem = {
  nome: string;
  categoriaNome: string;
  quantidade: number;
  quantidadeMinima: number;
  preco: number;
  valorEstoque: number;
  status: ProdutoStatus;
};

export type RelatorioEstoque = {
  itens: RelatorioEstoqueItem[];
  resumo: {
    totalProdutos: number;
    totalItens: number;
    valorTotalEstoque: number;
  };
};

export type RelatorioMovimentacaoItem = {
  id: number;
  produtoNome: string;
  usuarioNome: string;
  tipo: "entrada" | "saida";
  quantidade: number;
  observacao: string | null;
  createdAt: string;
};

export type RelatorioMovimentacoes = {
  totais: {
    totalMovimentacoes: number;
    totalEntradas: number;
    totalSaidas: number;
  };
  itens: RelatorioMovimentacaoItem[];
};

export type RelatorioMovimentacoesFiltros = {
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
};

function authHeaders(): HeadersInit {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function parseError(res: Response, fallback: string): Promise<never> {
  const data: unknown = await res.json().catch(() => null);
  const msg =
    typeof data === "object" &&
    data !== null &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
      ? (data as { error: string }).error
      : fallback;
  throw new Error(msg);
}

export async function getRelatorioEstoque(): Promise<RelatorioEstoque> {
  const res = await fetch(routes.relatorios.estoque(), {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível gerar o relatório de estoque.");
  }
  return res.json() as Promise<RelatorioEstoque>;
}

export async function getRelatorioMovimentacoes(
  filtros: RelatorioMovimentacoesFiltros = {},
): Promise<RelatorioMovimentacoes> {
  const params = new URLSearchParams();
  if (filtros.tipo) {
    params.set("tipo", filtros.tipo);
  }
  if (filtros.data_inicio) {
    params.set("data_inicio", filtros.data_inicio);
  }
  if (filtros.data_fim) {
    params.set("data_fim", filtros.data_fim);
  }

  const qs = params.toString();
  const url = qs
    ? `${routes.relatorios.movimentacoes()}?${qs}`
    : routes.relatorios.movimentacoes();

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    await parseError(res, "Não foi possível gerar o relatório de movimentações.");
  }
  return res.json() as Promise<RelatorioMovimentacoes>;
}
