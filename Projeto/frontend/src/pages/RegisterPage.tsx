import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { paths } from "../routes/paths";
import { PasswordInput } from "../components/PasswordInput";
import { registerUser } from "../services/authService";
import { messageToasts } from "../utils/messageToasts";
import { getPasswordStrength } from "../utils/passwordStrength";

const ROLES = [
  { value: "administrador", label: "Administrador" },
  { value: "operador", label: "Operador" },
  { value: "visualizador", label: "Visualizador" },
] as const;

/** Paleta alinhada ao mock (roxo profundo + ouro na força da senha). */
const C = {
  sidebar: "#F5F5FF",
  primary: "#3E3B82",
  gold: "#B5A642",
} as const;

const stepMeta = [
  { n: 1, title: "Dados pessoais", hint: "Nome e e-mail" },
  { n: 2, title: "Acesso", hint: "Senha e perfil" },
  { n: 3, title: "Confirmação", hint: "Verificar e-mail" },
] as const;

export function RegisterPage() {
  const [success, setSuccess] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [accessProfile, setAccessProfile] = useState<string>(
    ROLES[0]?.value ?? "administrador",
  );
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const strengthBarPct = (strength.score / 4) * 100;

  function validateForm(): boolean {
    if (!firstName.trim() || !lastName.trim()) {
      messageToasts.error("Preencha nome e sobrenome.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      messageToasts.error("Introduza um e-mail válido.");
      return false;
    }
    if (password.length < 8) {
      messageToasts.error("A senha deve ter pelo menos 8 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      messageToasts.error("As senhas não coincidem.");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      await registerUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        accessProfile,
      });
      setRegisteredEmail(email.trim());
      setSuccess(true);
      messageToasts.success("Conta criada com sucesso.");
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao criar conta.",
      );
    } finally {
      setLoading(false);
    }
  }

  const fieldLabel =
    "mb-2 block text-[0.6875rem] font-bold uppercase tracking-[0.12em]";
  const fieldInput =
    "w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-[0.9375rem] text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/15";

  return (
    <div className="font-sans flex min-h-svh w-full flex-col lg:flex-row">
      {/* Barra lateral — lavanda */}
      <aside
        className="flex w-full shrink-0 flex-col gap-10 border-b border-[#3E3B82]/10 px-8 py-10 sm:px-10 lg:w-[min(100%,280px)] lg:border-b-0 lg:border-r lg:border-[#3E3B82]/10 xl:w-[300px]"
        style={{ backgroundColor: C.sidebar }}
      >
        <div>
          <p
            className="font-['Playfair_Display',Georgia,serif] text-[1.85rem] font-semibold leading-none tracking-tight sm:text-[2rem]"
            style={{ color: C.primary }}
          >
            fitstock
          </p>
          <p
            className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em]"
            style={{ color: C.primary }}
          >
            Gestão de estoque
          </p>
        </div>

        <nav aria-label="Etapas do registo">
          <ol className="relative m-0 flex list-none flex-col gap-0 p-0">
            <span
              className="absolute start-[15px] top-4 bottom-4 w-px bg-[#3E3B82]/25"
              aria-hidden
            />
            {stepMeta.map((s) => {
              const onForm = !success;
              const step1DoneStyle = onForm && s.n <= 2;
              const step3Future = onForm && s.n === 3;
              const allDone = success;

              let circleClass: string;
              let circleContent: string | number = s.n;

              if (allDone) {
                circleClass =
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white";
                circleContent = "✓";
              } else if (step1DoneStyle && s.n <= 2) {
                circleClass =
                  "flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white";
              } else if (step3Future) {
                circleClass =
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-white text-xs font-bold text-neutral-400";
              } else {
                circleClass =
                  "flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-neutral-300 bg-white text-xs font-bold text-neutral-400";
              }

              const circleStyle =
                allDone || (step1DoneStyle && s.n <= 2)
                  ? { backgroundColor: C.primary, borderColor: C.primary }
                  : undefined;

              const titleMuted = step3Future && !allDone;

              return (
                <li key={s.n} className="relative flex gap-4 pb-9 last:pb-0">
                  <div className="relative z-[1] flex shrink-0 justify-center pt-0.5">
                    <span className={circleClass} style={circleStyle} aria-hidden>
                      {circleContent}
                    </span>
                  </div>
                  <div className="min-w-0 pt-0.5">
                    <p
                      className={
                        "m-0 text-[0.95rem] font-bold " +
                        (titleMuted ? "text-neutral-400" : "text-neutral-900")
                      }
                    >
                      {s.title}
                    </p>
                    <p
                      className={
                        "mt-1 m-0 text-xs leading-snug " +
                        (titleMuted ? "text-neutral-400" : "text-neutral-500")
                      }
                    >
                      {s.hint}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
      </aside>

      {/* Conteúdo principal — branco */}
      <section className="flex flex-1 flex-col justify-center bg-white px-6 py-10 sm:px-12 sm:py-12 lg:px-16 lg:py-14">
        {!success ? (
          <div className="mx-auto w-full max-w-2xl">
            <header className="mb-10 text-center lg:text-left">
              <h1
                className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.85rem,4vw,2.35rem)] font-semibold tracking-tight text-neutral-900"
              >
                Criar conta
              </h1>
              <p className="mt-2 m-0 text-[0.95rem] text-neutral-600">
                Preencha os dados para começar
              </p>
            </header>

            <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label
                    className={fieldLabel}
                    style={{ color: C.primary }}
                    htmlFor="firstName"
                  >
                    Nome
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    className={fieldInput}
                    autoComplete="given-name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div>
                  <label
                    className={fieldLabel}
                    style={{ color: C.primary }}
                    htmlFor="lastName"
                  >
                    Sobrenome
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    className={fieldInput}
                    autoComplete="family-name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

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
                  inputMode="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <label
                  className={fieldLabel}
                  style={{ color: C.primary }}
                  htmlFor="accessProfile"
                >
                  Perfil de acesso
                </label>
                <select
                  id="accessProfile"
                  name="accessProfile"
                  className={fieldInput}
                  value={accessProfile}
                  onChange={(e) => setAccessProfile(e.target.value)}
                >
                  {ROLES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 items-start gap-6 sm:grid-cols-2">
                <div>
                  <label
                    className={fieldLabel}
                    style={{ color: C.primary }}
                    htmlFor="password"
                  >
                    Senha
                  </label>
                  <PasswordInput
                    id="password"
                    name="password"
                    className={fieldInput}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <div className="mt-3" aria-live="polite">
                    <div className="h-1 overflow-hidden rounded-full bg-neutral-200">
                      <div
                        className="h-full rounded-full transition-[width] duration-200"
                        style={{
                          width: `${strengthBarPct}%`,
                          backgroundColor: C.gold,
                        }}
                      />
                    </div>
                    <p
                      className="mt-2 m-0 text-xs font-medium"
                      style={{ color: C.gold }}
                    >
                      Força: {strength.label}
                    </p>
                  </div>
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
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full rounded-lg py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ backgroundColor: C.primary }}
                  disabled={loading}
                >
                  {loading ? "A criar…" : "Criar conta"}
                </button>
              </div>
            </form>

            <footer className="mt-10 space-y-3 text-center text-xs leading-relaxed text-neutral-500">
              <p className="m-0">
                Ao criar uma conta você concorda com os{" "}
                <a
                  className="font-medium no-underline hover:underline"
                  style={{ color: C.primary }}
                  href="#termos"
                >
                  termos de uso
                </a>{" "}
                e a{" "}
                <a
                  className="font-medium no-underline hover:underline"
                  style={{ color: C.primary }}
                  href="#privacidade"
                >
                  política de privacidade
                </a>
                .
              </p>
              <p className="m-0">
                Já tem uma conta?{" "}
                <Link
                  className="font-semibold no-underline hover:underline"
                  style={{ color: C.primary }}
                  to={paths.login}
                >
                  Entrar
                </Link>
              </p>
            </footer>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-md text-center">
            <header className="mb-8">
              <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-3xl font-semibold text-neutral-900">
                Conta criada
              </h1>
              <p className="mt-3 m-0 text-sm text-neutral-600">
                {registeredEmail ? (
                  <>
                    A conta{" "}
                    <span className="font-medium text-neutral-900">
                      {registeredEmail}
                    </span>{" "}
                    está pronta. Pode iniciar sessão quando quiser.
                  </>
                ) : (
                  "Pode agora iniciar sessão com a sua conta."
                )}
              </p>
            </header>
            <Link
              className="inline-flex min-h-11 w-full max-w-xs items-center justify-center rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-95"
              style={{ backgroundColor: C.primary }}
              to={paths.login}
            >
              Ir para entrar
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
