import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { PasswordInput } from "../components/PasswordInput";
import { paths } from "../routes/paths";
import { resetPassword } from "../services/authService";
import { messageToasts } from "../utils/messageToasts";
import { getPasswordStrength } from "../utils/passwordStrength";

const C = {
  panel: "#F9F8FD",
  primary: "#3E3B82",
  gold: "#B5A642",
} as const;

export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthBarPct = (strength.score / 4) * 100;

  const fieldLabel =
    "mb-2 block text-[0.6875rem] font-bold uppercase tracking-[0.12em]";
  const fieldInput =
    "w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-[0.9375rem] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/15";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      messageToasts.error("Introduza um e-mail válido.");
      return;
    }
    if (password.length < 8) {
      messageToasts.error("A senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      messageToasts.error("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const result = await resetPassword({
        email: email.trim(),
        password,
      });
      messageToasts.success(result.message);
      navigate(paths.login);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao redefinir senha.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="font-sans flex min-h-svh w-full items-center justify-center px-6 py-12"
      style={{ backgroundColor: C.panel }}
    >
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="font-['Playfair_Display',Georgia,serif] text-2xl font-semibold">
            <span style={{ color: C.primary }}>fit</span>
            <span style={{ color: C.gold }}>stock</span>
          </p>
          <h1 className="m-0 mt-4 font-['Playfair_Display',Georgia,serif] text-[clamp(1.5rem,3vw,2rem)] font-semibold tracking-tight text-neutral-900">
            Recuperar senha
          </h1>
          <p className="mt-2 m-0 text-sm text-neutral-600">
            Informe o e-mail da conta e defina uma nova senha.
          </p>
        </header>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit} noValidate>
          <div>
            <label
              className={fieldLabel}
              style={{ color: C.primary }}
              htmlFor="email"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className={fieldInput}
              autoComplete="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label
              className={fieldLabel}
              style={{ color: C.primary }}
              htmlFor="password"
            >
              Nova senha
            </label>
            <PasswordInput
              id="password"
              name="password"
              className={fieldInput}
              autoComplete="new-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password ? (
              <div className="mt-2">
                <div className="h-1.5 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${strengthBarPct}%`,
                      backgroundColor: C.gold,
                    }}
                  />
                </div>
                <p className="m-0 mt-1 text-xs text-neutral-500">
                  Força: {strength.label}
                </p>
              </div>
            ) : null}
          </div>

          <div>
            <label
              className={fieldLabel}
              style={{ color: C.primary }}
              htmlFor="confirmPassword"
            >
              Confirmar senha
            </label>
            <PasswordInput
              id="confirmPassword"
              name="confirmPassword"
              className={fieldInput}
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-lg py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: C.primary }}
            disabled={loading}
          >
            {loading ? "A guardar…" : "Redefinir senha"}
          </button>
        </form>

        <p className="m-0 mt-8 text-center text-sm text-neutral-600">
          <Link
            className="font-semibold no-underline hover:underline"
            style={{ color: C.gold }}
            to={paths.login}
          >
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  );
}
