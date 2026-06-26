import { routes } from "./routes";
import { getAuthToken } from "../utils/authStorage";

export type MovimentacaoRecente = {
  tipo: "entrada" | "saida";
  quantidade: number;
  created_at: string;
  produto_nome: string;
  sku: string;
};

export type ProdutoCritico = {
  nome: string;
  sku: string;
  quantidade: number;
  quantidade_minima: number;
  categoria_nome: string;
};

export type DashboardDados = {
  total_produtos: number;
  total_itens_estoque: number;
  produtos_estoque_baixo: number;
  produtos_esgotados: number;
  movimentacoes_recentes: MovimentacaoRecente[];
  produtos_criticos: ProdutoCritico[];
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

export async function getDadosDashboard(): Promise<DashboardDados> {
  const res = await fetch(routes.dashboard.get(), { headers: authHeaders() });
  if (!res.ok) {
    await parseError(res, "Não foi possível carregar o dashboard.");
  }
  return res.json() as Promise<DashboardDados>;
}
