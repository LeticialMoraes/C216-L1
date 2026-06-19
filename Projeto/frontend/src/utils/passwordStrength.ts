export type PasswordStrengthLabel =
  | "muito fraca"
  | "fraca"
  | "média"
  | "forte"
  | "muito forte";

export type PasswordStrength = {
  /** 0–4 segmentos preenchidos na UI */
  score: number;
  label: PasswordStrengthLabel;
};

/** Heurística simples para a barra de força da senha (UI). */
export function getPasswordStrength(password: string): PasswordStrength {
  if (!password) {
    return { score: 0, label: "muito fraca" };
  }

  let raw = 0;
  if (password.length >= 8) raw += 1;
  if (password.length >= 12) raw += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) raw += 1;
  if (/\d/.test(password)) raw += 1;
  if (/[^A-Za-z0-9]/.test(password)) raw += 1;

  const score = Math.min(4, Math.ceil((raw / 5) * 4));

  const label: PasswordStrengthLabel =
    score <= 0
      ? "muito fraca"
      : score === 1
        ? "fraca"
        : score === 2
          ? "média"
          : score === 3
            ? "forte"
            : "muito forte";

  return { score, label };
}
