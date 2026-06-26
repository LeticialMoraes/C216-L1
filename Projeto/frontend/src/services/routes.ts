/** URL base da API (sem barra final). */
const configuredApiBase = import.meta.env.VITE_API_URL?.trim();
export const apiBase =
  configuredApiBase && configuredApiBase.length > 0
    ? configuredApiBase.replace(/\/$/, "")
    : "http://localhost:3000";

/** Caminhos da API usados pela aplicação. */
export const routes = {
  auth: {
    register: () => `${apiBase}/auth/register`,
    login: () => `${apiBase}/auth/login`,
    resetPassword: () => `${apiBase}/auth/reset-password`,
    me: () => `${apiBase}/auth/me`,
  },
  categorias: {
    list: () => `${apiBase}/categorias`,
    byId: (id: number) => `${apiBase}/categorias/${id}`,
  },
  fornecedores: {
    list: () => `${apiBase}/fornecedores`,
    byId: (id: number) => `${apiBase}/fornecedores/${id}`,
  },
  produtos: {
    list: () => `${apiBase}/produtos`,
    byId: (id: number) => `${apiBase}/produtos/${id}`,
    fornecedores: (id: number) => `${apiBase}/produtos/${id}/fornecedores`,
    fornecedorById: (produtoId: number, fornecedorId: number) =>
      `${apiBase}/produtos/${produtoId}/fornecedores/${fornecedorId}`,
  },
  movimentacoes: {
    list: () => `${apiBase}/movimentacoes`,
    byId: (id: number) => `${apiBase}/movimentacoes/${id}`,
  },
  dashboard: {
    get: () => `${apiBase}/dashboard`,
  },
  relatorios: {
    estoque: () => `${apiBase}/relatorios/estoque`,
    movimentacoes: () => `${apiBase}/relatorios/movimentacoes`,
  },
  health: () => `${apiBase}/health`,
} as const;
