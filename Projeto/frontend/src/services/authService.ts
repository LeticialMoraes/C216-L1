import { routes } from "./routes";
import {
  clearAuthSession,
  getAuthToken,
  saveAuthSession,
} from "../utils/authStorage";

export type RegisterPayload = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accessProfile: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginSuccess = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accessProfile: string;
  token: string;
  message: string;
};

export type RegisterSuccess = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accessProfile: string;
  createdAt: string;
  message: string;
};

export async function loginUser(payload: LoginPayload): Promise<LoginSuccess> {
  const res = await fetch(routes.auth.login(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: unknown = await res.json();

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Não foi possível iniciar sessão.";
    throw new Error(msg);
  }

  const user = data as LoginSuccess;

  if (user.token) {
    saveAuthSession(user.token, {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      accessProfile: user.accessProfile,
    });
  }

  return user;
}

export async function registerUser(
  payload: RegisterPayload,
): Promise<RegisterSuccess> {
  const res = await fetch(routes.auth.register(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: unknown = await res.json();

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Não foi possível criar a conta.";
    throw new Error(msg);
  }

  return data as RegisterSuccess;
}

export type ResetPasswordPayload = {
  email: string;
  password: string;
};

export async function resetPassword(
  payload: ResetPasswordPayload,
): Promise<{ message: string }> {
  const res = await fetch(routes.auth.resetPassword(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data: unknown = await res.json();

  if (!res.ok) {
    const msg =
      typeof data === "object" &&
      data !== null &&
      "error" in data &&
      typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : "Não foi possível redefinir a senha.";
    throw new Error(msg);
  }

  return data as { message: string };
}

export type UserProfile = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  accessProfile: string;
};

export type UpdateProfilePayload = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
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

async function parseAuthError(res: Response, fallback: string): Promise<never> {
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

export async function getProfile(): Promise<UserProfile> {
  const res = await fetch(routes.auth.me(), {
    headers: authHeaders(),
  });

  if (res.status === 401) {
    clearAuthSession();
    await parseAuthError(res, "Sessão expirada. Inicie sessão novamente.");
  }

  if (res.status === 404) {
    throw new Error(
      "Endpoint de perfil não encontrado. Reconstrua o backend com: docker compose up -d --build",
    );
  }

  if (!res.ok) {
    await parseAuthError(res, "Não foi possível carregar o perfil.");
  }

  return (await res.json()) as UserProfile;
}

export async function updateProfile(
  payload: UpdateProfilePayload,
): Promise<UserProfile & { message: string; token: string }> {
  const res = await fetch(routes.auth.me(), {
    method: "PUT",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    await parseAuthError(res, "Não foi possível atualizar o perfil.");
  }

  const data = (await res.json()) as UserProfile & {
    message: string;
    token: string;
  };

  saveAuthSession(data.token, {
    id: data.id,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    accessProfile: data.accessProfile,
  });

  return data;
}
