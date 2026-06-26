import { routes } from "./routes";
import { getAuthToken } from "../utils/authStorage";

export type MovimentacaoTipo = "entrada" | "saida";

export type Movimentacao = {
  id: number;
  produtoId: number;
  produtoNome: string;
  sku: string;
  usuarioId: string;
  usuarioNome: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  observacao: string | null;
  createdAt: string;
};

export type ListarMovimentacoesFiltros = {
  tipo?: string;
  data_inicio?: string;
  data_fim?: string;
};

export type RegistrarMovimentacaoInput = {
  produtoId: number;
  tipo: MovimentacaoTipo;
  quantidade: number;
  observacao?: string | null;
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

export async function listarMovimentacoes(
  filtros: ListarMovimentacoesFiltros = {},
): Promise<Movimentacao[]> {
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
    ? `${routes.movimentacoes.list()}?${qs}`
    : routes.movimentacoes.list();

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    await parseError(res, "Não foi possível carregar movimentações.");
  }
  return res.json() as Promise<Movimentacao[]>;
}

export async function registrarMovimentacao(
  dados: RegistrarMovimentacaoInput,
): Promise<Movimentacao> {
  const res = await fetch(routes.movimentacoes.list(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível registrar a movimentação.");
  }
  return res.json() as Promise<Movimentacao>;
}
