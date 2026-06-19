import { routes } from "./routes";

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

  return data as LoginSuccess;
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
