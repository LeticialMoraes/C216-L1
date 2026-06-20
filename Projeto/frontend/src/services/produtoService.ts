import { routes } from "./routes";
import { getAuthToken } from "../utils/authStorage";

export type ProdutoStatus = "ok" | "baixo" | "esgotado";

export type Produto = {
  id: number;
  nome: string;
  sku: string;
  descricao: string | null;
  preco: number;
  quantidade: number;
  quantidadeMinima: number;
  tamanhos: string | null;
  categoriaId: number;
  categoriaNome?: string;
  fornecedorNome?: string | null;
  status: ProdutoStatus;
  createdAt: string;
};

export type ProdutoDetalhe = Produto & {
  fornecedores: ProdutoFornecedorVinculo[];
};

export type ProdutoFornecedorVinculo = {
  id: number;
  nome: string;
  email: string | null;
  telefone: string | null;
  ativo: boolean;
  precoCusto: number | null;
  prazoEntregaDias: number | null;
  createdAt: string;
};

export type ProdutoInput = {
  nome: string;
  sku: string;
  descricao?: string | null;
  preco: number;
  quantidade?: number;
  quantidadeMinima?: number;
  tamanhos?: string | null;
  categoriaId: number;
};

export type ListarProdutosFiltros = {
  categoria_id?: number | string;
  status?: ProdutoStatus;
};

export type VincularFornecedorInput = {
  fornecedorId: number;
  precoCusto?: number | null;
  prazoEntregaDias?: number | null;
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

export async function listarProdutos(
  filtros: ListarProdutosFiltros = {},
): Promise<Produto[]> {
  const params = new URLSearchParams();
  if (filtros.categoria_id !== undefined && filtros.categoria_id !== "") {
    params.set("categoria_id", String(filtros.categoria_id));
  }
  if (filtros.status) {
    params.set("status", filtros.status);
  }

  const qs = params.toString();
  const url = qs
    ? `${routes.produtos.list()}?${qs}`
    : routes.produtos.list();

  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    await parseError(res, "Não foi possível carregar produtos.");
  }
  return res.json() as Promise<Produto[]>;
}

export async function buscarProdutoPorId(id: number): Promise<ProdutoDetalhe> {
  const res = await fetch(routes.produtos.byId(id), {
    headers: authHeaders(),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível carregar o produto.");
  }
  return res.json() as Promise<ProdutoDetalhe>;
}

export async function criarProduto(dados: ProdutoInput): Promise<Produto> {
  const res = await fetch(routes.produtos.list(), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível criar o produto.");
  }
  return res.json() as Promise<Produto>;
}

export async function atualizarProduto(
  id: number,
  dados: ProdutoInput,
): Promise<Produto> {
  const res = await fetch(routes.produtos.byId(id), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível atualizar o produto.");
  }
  return res.json() as Promise<Produto>;
}

export async function deletarProduto(id: number): Promise<void> {
  const res = await fetch(routes.produtos.byId(id), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!res.ok && res.status !== 204) {
    await parseError(res, "Não foi possível excluir o produto.");
  }
}

export async function vincularFornecedor(
  produtoId: number,
  dados: VincularFornecedorInput,
): Promise<ProdutoFornecedorVinculo> {
  const res = await fetch(routes.produtos.fornecedores(produtoId), {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(dados),
  });
  if (!res.ok) {
    await parseError(res, "Não foi possível vincular o fornecedor.");
  }
  return res.json() as Promise<ProdutoFornecedorVinculo>;
}

export async function desvincularFornecedor(
  produtoId: number,
  fornecedorId: number,
): Promise<void> {
  const res = await fetch(
    routes.produtos.fornecedorById(produtoId, fornecedorId),
    {
      method: "DELETE",
      headers: authHeaders(),
    },
  );
  if (!res.ok && res.status !== 204) {
    await parseError(res, "Não foi possível desvincular o fornecedor.");
  }
}
