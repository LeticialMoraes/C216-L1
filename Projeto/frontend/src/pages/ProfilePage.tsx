import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { SideBar } from "../components/SideBar";
import { PasswordInput } from "../components/PasswordInput";
import { theme } from "../constants/theme";
import { paths } from "../routes/paths";
import {
  getProfile,
  updateProfile,
  type UserProfile,
} from "../services/authService";
import { getStoredUser } from "../utils/authStorage";
import { messageToasts } from "../utils/messageToasts";
import { getPasswordStrength } from "../utils/passwordStrength";

const ROLES: Record<string, string> = {
  administrador: "Administrador",
  operador: "Operador",
  visualizador: "Visualizador",
};

const fieldLabel =
  "mb-2 block text-[0.6875rem] font-bold uppercase tracking-[0.12em]";
const fieldInput =
  "w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-[0.9375rem] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/15";

export function ProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthBarPct = (strength.score / 4) * 100;

  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setProfile(stored);
      setFirstName(stored.firstName);
      setLastName(stored.lastName);
      setEmail(stored.email);
    }

    getProfile()
      .then((data) => {
        setProfile(data);
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
      })
      .catch((err) => {
        const message =
          err instanceof Error ? err.message : "Erro ao carregar perfil.";
        messageToasts.error(message);
        if (/sessão/i.test(message)) {
          navigate(paths.login, { replace: true });
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim()) {
      messageToasts.error("Preencha nome e sobrenome.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      messageToasts.error("Introduza um e-mail válido.");
      return;
    }
    if (password && password.length < 8) {
      messageToasts.error("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password && password !== confirmPassword) {
      messageToasts.error("As senhas não coincidem.");
      return;
    }

    setSaving(true);
    try {
      const result = await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        ...(password ? { password } : {}),
      });
      setProfile(result);
      setPassword("");
      setConfirmPassword("");
      messageToasts.success(result.message);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao atualizar perfil.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="font-sans flex min-h-svh w-full"
      style={{ backgroundColor: theme.panel }}
    >
      <SideBar />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="mb-8">
          <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-neutral-900">
            Meu perfil
          </h1>
          <p className="m-0 mt-2 text-sm text-neutral-600">
            Atualize os seus dados pessoais e senha de acesso.
          </p>
        </header>

        {loading && !profile ? (
          <p className="text-neutral-500">A carregar perfil…</p>
        ) : (
          <form
            className="mx-auto w-full max-w-xl rounded-2xl border border-[#ECEAF5] bg-white p-6 shadow-[0_8px_30px_rgba(62,59,130,0.06)] sm:p-8"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  className={fieldLabel}
                  style={{ color: theme.primary }}
                  htmlFor="firstName"
                >
                  Nome
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  className={fieldInput}
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div>
                <label
                  className={fieldLabel}
                  style={{ color: theme.primary }}
                  htmlFor="lastName"
                >
                  Sobrenome
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  className={fieldInput}
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                className={fieldLabel}
                style={{ color: theme.primary }}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="mt-5">
              <label className={fieldLabel} style={{ color: theme.primary }}>
                Perfil de acesso
              </label>
              <p className="m-0 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
                {ROLES[profile?.accessProfile ?? ""] ??
                  profile?.accessProfile ??
                  "—"}
              </p>
            </div>

            <div className="mt-8 border-t border-neutral-200 pt-6">
              <h2 className="m-0 text-sm font-semibold text-neutral-900">
                Alterar senha
              </h2>
              <p className="m-0 mt-1 text-xs text-neutral-500">
                Deixe em branco para manter a senha atual.
              </p>

              <div className="mt-4">
                <label
                  className={fieldLabel}
                  style={{ color: theme.primary }}
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
                          backgroundColor: theme.gold,
                        }}
                      />
                    </div>
                    <p className="m-0 mt-1 text-xs text-neutral-500">
                      Força: {strength.label}
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4">
                <label
                  className={fieldLabel}
                  style={{ color: theme.primary }}
                  htmlFor="confirmPassword"
                >
                  Confirmar nova senha
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
            </div>

            <button
              type="submit"
              className="mt-8 w-full rounded-lg py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
              disabled={saving}
            >
              {saving ? "A guardar…" : "Guardar alterações"}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
