import { routes } from "./routes";
import { getAuthToken } from "../utils/authStorage";

export type Fornecedor = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  createdAt: string;
};

export type FornecedorCreateInput = {
  nome: string;
  email?: string | null;
  telefone?: string | null;
};

export type FornecedorUpdateInput = FornecedorCreateInput & {
  ativo: boolean;
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

export async function listarFornecedores(): Promise<Fornecedor[]> {
  const res = await fetch(routes.fornecedores.list(), {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível carregar fornecedores.");
  }
  return res.json() as Promise<Fornecedor[]>;
}

export async function criarFornecedor(
  dados: FornecedorCreateInput,
): Promise<Fornecedor> {
  const res = await fetch(routes.fornecedores.list(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível criar o fornecedor.");
  }
  return res.json() as Promise<Fornecedor>;
}

export async function atualizarFornecedor(
  id: number,
  dados: FornecedorUpdateInput,
): Promise<Fornecedor> {
  const res = await fetch(routes.fornecedores.byId(id), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível atualizar o fornecedor.");
  }
  return res.json() as Promise<Fornecedor>;
}

export async function deletarFornecedor(id: number): Promise<void> {
  const res = await fetch(routes.fornecedores.byId(id), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    await parseError(res, "Não foi possível excluir o fornecedor.");
  }
}
