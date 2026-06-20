import { routes } from "./routes";
import { getAuthToken } from "../utils/authStorage";

export type Categoria = {
  id: number;
  nome: string;
  descricao: string | null;
  createdAt: string;
};

export type CategoriaInput = {
  nome: string;
  descricao?: string | null;
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

export async function listarCategorias(): Promise<Categoria[]> {
  const res = await fetch(routes.categorias.list(), {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível carregar categorias.");
  }
  return res.json() as Promise<Categoria[]>;
}

export async function criarCategoria(dados: CategoriaInput): Promise<Categoria> {
  const res = await fetch(routes.categorias.list(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível criar a categoria.");
  }
  return res.json() as Promise<Categoria>;
}

export async function atualizarCategoria(
  id: number,
  dados: CategoriaInput,
): Promise<Categoria> {
  const res = await fetch(routes.categorias.byId(id), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível atualizar a categoria.");
  }
  return res.json() as Promise<Categoria>;
}

export async function deletarCategoria(id: number): Promise<void> {
  const res = await fetch(routes.categorias.byId(id), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    await parseError(res, "Não foi possível excluir a categoria.");
  }
}
