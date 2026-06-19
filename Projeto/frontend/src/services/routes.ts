/** URL base da API (sem barra final). */
export const apiBase =
  import.meta.env.VITE_API_URL?.replace(/\/$/, "") ?? "http://localhost:3000";

/** Caminhos da API usados pela aplicação. */
export const routes = {
  auth: {
    register: () => `${apiBase}/auth/register`,
    login: () => `${apiBase}/auth/login`,
  },
  health: () => `${apiBase}/health`,
} as const;
