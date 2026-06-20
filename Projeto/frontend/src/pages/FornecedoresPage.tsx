import { SideBar } from "../components/SideBar";
import { FornecedoresPanel } from "../components/FornecedoresPanel";
import { theme } from "../constants/theme";

export function FornecedoresPage() {
  return (
    <div
      className="font-sans flex min-h-svh w-full"
      style={{ backgroundColor: theme.panel }}
    >
      <SideBar />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="mb-8 shrink-0">
          <p
            className="m-0 mb-1 text-xs font-semibold uppercase tracking-[0.18em]"
            style={{ color: theme.muted }}
          >
            Parceiros comerciais
          </p>
          <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-neutral-900">
            Fornecedores
          </h1>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <FornecedoresPanel />
        </div>
      </main>
    </div>
  );
}
