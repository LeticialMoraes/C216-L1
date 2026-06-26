import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { theme } from "../constants/theme";
import { paths } from "../routes/paths";
import { clearAuthSession, getStoredUser } from "../utils/authStorage";

type NavItem = {
  label: string;
  path: string;
  icon: ReactNode;
  disabled?: boolean;
};

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: paths.dashboard,
    icon: (
      <path
        fill="currentColor"
        d="M2.5 4.75A1.75 1.75 0 0 1 4.25 3h7.5A1.75 1.75 0 0 1 13.5 4.75v6.5A1.75 1.75 0 0 1 11.75 13h-7.5A1.75 1.75 0 0 1 2.5 11.25v-6.5Z"
      />
    ),
  },
  {
    label: "Produtos",
    path: paths.products,
    icon: (
      <path
        fill="currentColor"
        d="M8 2.5a2.5 2.5 0 0 1 2.45 2h.8a1.75 1.75 0 0 1 1.75 1.75v1.5A1.75 1.75 0 0 1 11.25 9.5h-.8v5.25a2.5 2.5 0 0 1-5 0V9.5h-.8A1.75 1.75 0 0 1 2.75 7.75v-1.5A1.75 1.75 0 0 1 4.5 4.5h.8A2.5 2.5 0 0 1 8 2.5Z"
      />
    ),
  },
  {
    label: "Categorias",
    path: paths.categories,
    icon: (
      <path
        fill="currentColor"
        d="M3.5 3.75A1.75 1.75 0 0 1 5.25 2h5.5A1.75 1.75 0 0 1 12.5 3.75v8.5A1.75 1.75 0 0 1 10.75 14h-5.5A1.75 1.75 0 0 1 3.5 12.25v-8.5Z"
      />
    ),
  },
  {
    label: "Fornecedores",
    path: paths.suppliers,
    icon: (
      <path
        fill="currentColor"
        d="M1.5 11.25V8.5a.75.75 0 0 1 .75-.75h1.25V6.5A2.25 2.25 0 0 1 5.75 4.25h4.5A2.25 2.25 0 0 1 12.5 6.5v1.25h1.25a.75.75 0 0 1 .75.75v2.75a.75.75 0 0 1-.75.75h-1.25V12a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-.75H2.25a.75.75 0 0 1-.75-.75Z"
      />
    ),
  },
  {
    label: "Movimentações",
    path: paths.movements,
    icon: (
      <path
        fill="currentColor"
        d="M2.5 4.75A1.75 1.75 0 0 1 4.25 3h7.5A1.75 1.75 0 0 1 13.5 4.75v6.5A1.75 1.75 0 0 1 11.75 13h-7.5A1.75 1.75 0 0 1 2.5 11.25v-6.5Zm1.75-.25a.25.25 0 0 0-.25.25v6.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-6.5a.25.25 0 0 0-.25-.25h-7.5Z"
      />
    ),
  },
  {
    label: "Relatórios",
    path: paths.reports,
    icon: (
      <path
        fill="currentColor"
        d="M3.5 12.5V8.75h2.25V12.5H3.5Zm3.75-4v4h2.25v-4H7.25Zm3.75 2v2h2.25v-2H11Z"
      />
    ),
  },
];

export function SideBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = getStoredUser();
  const initial = user?.firstName?.charAt(0)?.toUpperCase() ?? "U";
  const displayName = user
    ? `${user.firstName} ${user.lastName}`
    : "Utilizador";
  const roleLabel =
    user?.accessProfile === "administrador"
      ? "Admin"
      : user?.accessProfile === "operador"
        ? "Operador"
        : "Visualizador";

  function handleLogout() {
    clearAuthSession();
    navigate(paths.login, { replace: true });
  }

  return (
    <aside
      className="flex w-64 shrink-0 flex-col border-r border-[#E8E6F2] px-4 py-6"
      style={{ backgroundColor: theme.sidebar }}
    >
      <div className="px-2">
        <p className="font-['Playfair_Display',Georgia,serif] text-2xl font-semibold leading-none tracking-tight">
          <span style={{ color: theme.primary }}>fit</span>
          <span style={{ color: theme.gold }}>stock</span>
        </p>
        <p
          className="mt-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em]"
          style={{ color: `${theme.primary}99` }}
        >
          Gestão de estoque
        </p>
      </div>

      <nav className="mt-8 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = !item.disabled && location.pathname === item.path;
          const className = [
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            item.disabled
              ? "cursor-not-allowed text-neutral-400"
              : active
                ? "text-white shadow-sm"
                : "text-neutral-600 hover:bg-white/70",
          ].join(" ");

          const content = (
            <>
              <svg
                className="size-4 shrink-0"
                viewBox="0 0 16 16"
                fill="none"
                aria-hidden
              >
                {item.icon}
              </svg>
              {item.label}
            </>
          );

          if (item.disabled) {
            return (
              <span key={item.label} className={className} aria-disabled>
                {content}
              </span>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.path}
              className={className}
              style={active ? { backgroundColor: theme.primary } : undefined}
            >
              {content}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2">
        <div className="flex items-center gap-3 rounded-xl bg-white/70 px-3 py-3">
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
            style={{ backgroundColor: theme.primary }}
          >
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold"
              style={{ color: theme.primary }}
            >
              {displayName}
            </p>
            <p className="truncate text-xs text-neutral-500">{roleLabel}</p>
          </div>
        </div>

        <Link
          to={paths.profile}
          className={[
            "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition",
            location.pathname === paths.profile
              ? "text-white shadow-sm"
              : "bg-white/70 text-neutral-600 hover:bg-white",
          ].join(" ")}
          style={
            location.pathname === paths.profile
              ? { backgroundColor: theme.primary }
              : undefined
          }
        >
          <svg className="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 13.25c0-2.21 2.46-4 5.5-4s5.5 1.79 5.5 4v.5a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75v-.5Z" />
          </svg>
          Editar perfil
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#E8E6F2] bg-white/70 px-3 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-white hover:text-[#B91C1C]"
        >
          <svg className="size-4" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M6 2.5a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75V4h1.25A1.75 1.75 0 0 1 14.75 5.75v4.5A1.75 1.75 0 0 1 13 12h-1.25v1.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75V12H4a1.75 1.75 0 0 1-1.75-1.75v-4.5A1.75 1.75 0 0 1 4 5.75h1.25V2.5Zm1.5.75V4h4.5V3.25a.25.25 0 0 0-.25-.25h-4a.25.25 0 0 0-.25.25ZM4 6.5a.25.25 0 0 0-.25.25v4.5c0 .138.112.25.25.25h8a.25.25 0 0 0 .25-.25v-4.5a.25.25 0 0 0-.25-.25H4Zm3 2.25a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5a.75.75 0 0 1 .75-.75Z" />
          </svg>
          Sair
        </button>
      </div>
    </aside>
  );
}
