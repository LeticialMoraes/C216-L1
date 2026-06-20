import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { paths } from "../routes/paths";
import { PasswordInput } from "../components/PasswordInput";
import { loginUser } from "../services/authService";
import { messageToasts } from "../utils/messageToasts";

/** Paleta alinhada ao mock (roxo profundo + ouro). */
const C = {
  sidebar: "#F2F0F7",
  panel: "#F9F8FD",
  primary: "#3E3B82",
  gold: "#B5A642",
} as const;

const features = [
  {
    label: "Controle de produtos e tamanhos",
    icon: (
      <path
        fill="currentColor"
        d="M8 2.5a2.5 2.5 0 0 1 2.45 2h.8a1.75 1.75 0 0 1 1.75 1.75v1.5A1.75 1.75 0 0 1 11.25 9.5h-.8v5.25a2.5 2.5 0 0 1-5 0V9.5h-.8A1.75 1.75 0 0 1 2.75 7.75v-1.5A1.75 1.75 0 0 1 4.5 4.5h.8A2.5 2.5 0 0 1 8 2.5Zm0 1.5A1 1 0 0 0 7 5v4.25a1 1 0 0 0 2 0V5a1 1 0 0 0-1-1Zm-3.5 1h7a.25.25 0 0 0 .25-.25v-1.5a.25.25 0 0 0-.25-.25h-7a.25.25 0 0 0-.25.25v1.5c0 .138.112.25.25.25Z"
      />
    ),
  },
  {
    label: "Monitoramento de estoque em tempo real",
    icon: (
      <path
        fill="currentColor"
        d="M2.5 4.75A1.75 1.75 0 0 1 4.25 3h7.5A1.75 1.75 0 0 1 13.5 4.75v6.5A1.75 1.75 0 0 1 11.75 13h-7.5A1.75 1.75 0 0 1 2.5 11.25v-6.5Zm1.75-.25a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-6.5a.25.25 0 0 0-.25-.25h-7.5ZM5 6.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 0 1.5h-4.5A.75.75 0 0 1 5 6.5Zm0 2.75a.75.75 0 0 1 .75-.75h2.5a.75.75 0 0 1 0 1.5h-2.5A.75.75 0 0 1 5 9.25Z"
      />
    ),
  },
  {
    label: "Gestão de fornecedores",
    icon: (
      <path
        fill="currentColor"
        d="M1.5 11.25V8.5a.75.75 0 0 1 .75-.75h1.25V6.5A2.25 2.25 0 0 1 5.75 4.25h4.5A2.25 2.25 0 0 1 12.5 6.5v1.25h1.25a.75.75 0 0 1 .75.75v2.75a.75.75 0 0 1-.75.75h-1.25V12a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-.75H2.25a.75.75 0 0 1-.75-.75Zm3.25-5a.75.75 0 0 0-.75.75v1.25h7.5V7a.75.75 0 0 0-.75-.75h-6Zm-1.5 3.5v2.25h9V9.75h-9Zm8.25 3v.75H3.5V12.75h8Z"
      />
    ),
  },
  {
    label: "Relatórios e análises",
    icon: (
      <path
        fill="currentColor"
        d="M3.5 12.5V8.75h2.25V12.5H3.5Zm3.75-4v4h2.25v-4H7.25Zm3.75 2v2h2.25v-2H11Z"
      />
    ),
  },
] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

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
    if (password.length < 1) {
      messageToasts.error("Introduza a sua senha.");
      return;
    }

    setLoading(true);
    try {
      const user = await loginUser({ email: email.trim(), password });
      messageToasts.success(
        `Sessão iniciada como ${user.firstName} ${user.lastName}.`,
      );
      navigate(paths.products);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao iniciar sessão.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="font-sans flex min-h-svh w-full flex-col lg:flex-row">
      <aside
        className="flex w-full shrink-0 flex-col justify-center px-8 py-12 sm:px-12 lg:w-[42%] lg:px-14 xl:px-16"
        style={{ backgroundColor: C.sidebar }}
      >
        <div className="mx-auto w-full max-w-sm">
          <p className="font-['Playfair_Display',Georgia,serif] text-[clamp(2rem,5vw,2.75rem)] font-semibold leading-none tracking-tight">
            <span style={{ color: C.primary }}>fit</span>
            <span style={{ color: C.gold }}>stock</span>
          </p>
          <p
            className="mt-3 text-[0.65rem] font-semibold uppercase tracking-[0.22em]"
            style={{ color: `${C.primary}99` }}
          >
            Gestão de estoque
          </p>
          <hr
            className="my-8 border-0 border-t"
            style={{ borderColor: `${C.primary}22` }}
          />

          <ul className="m-0 flex list-none flex-col gap-6 p-0">
            {features.map((feature) => (
              <li key={feature.label} className="flex items-center gap-4">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_2px_8px_rgba(62,59,130,0.08)]"
                  aria-hidden
                >
                  <svg
                    className="size-5"
                    style={{ color: C.gold }}
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {feature.icon}
                  </svg>
                </span>
                <span
                  className="text-[0.9375rem] font-medium leading-snug"
                  style={{ color: C.primary }}
                >
                  {feature.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section
        className="flex flex-1 flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-20"
        style={{ backgroundColor: C.panel }}
      >
        <div className="mx-auto w-full max-w-md">
          <header className="mb-10 text-center">
            <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.85rem,4vw,2.35rem)] font-semibold tracking-tight text-neutral-900">
              Bem-vinda de volta
            </h1>
            <p className="mt-2 m-0 text-[0.95rem] text-neutral-600">
              Entre com sua conta para continuar
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
                inputMode="email"
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
                Senha
              </label>
              <PasswordInput
                id="password"
                name="password"
                className={fieldInput}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div className="mt-2 text-end">
                <a
                  className="text-xs font-semibold no-underline hover:underline"
                  style={{ color: C.gold }}
                  href="#recuperar-senha"
                >
                  Esqueci minha senha
                </a>
              </div>
            </div>

            <button
              type="submit"
              className="mt-1 w-full rounded-lg py-3.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: C.primary }}
              disabled={loading}
            >
              {loading ? "A entrar…" : "Entrar"}
            </button>
          </form>

          <div className="relative my-8">
            <hr className="border-0 border-t border-neutral-300/80" />
            <span className="absolute start-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#F9F8FD] px-3 text-xs font-medium text-neutral-500">
              ou
            </span>
          </div>

          <p className="m-0 text-center text-sm text-neutral-600">
            Não tem uma conta?{" "}
            <Link
              className="font-semibold no-underline hover:underline"
              style={{ color: C.gold }}
              to={paths.register}
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
