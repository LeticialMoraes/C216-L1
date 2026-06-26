import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SideBar } from "../components/SideBar";
import { categoryIconColors, theme } from "../constants/theme";
import { paths } from "../routes/paths";
import {
  getDadosDashboard,
  type DashboardDados,
  type MovimentacaoRecente,
  type ProdutoCritico,
} from "../services/dashboardService";
import { getStoredUser } from "../utils/authStorage";
import { messageToasts } from "../utils/messageToasts";
import { statusPillStyles } from "../utils/produtoStatus";

function saudacao(): string {
  const hora = new Date().getHours();
  if (hora < 12) {
    return "Bom dia";
  }
  if (hora < 18) {
    return "Boa tarde";
  }
  return "Boa noite";
}

function formatNumero(valor: number): string {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

function formatDataHora(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function categoriaColor(indice: number): string {
  return categoryIconColors[indice % categoryIconColors.length];
}

function calcProgresso(quantidade: number, quantidadeMinima: number): number {
  if (quantidadeMinima <= 0) {
    return quantidade > 0 ? 100 : 0;
  }
  return Math.min(100, (quantidade / quantidadeMinima) * 100);
}

function statusCritico(produto: ProdutoCritico) {
  return produto.quantidade === 0 ? "esgotado" : "baixo";
}

function tipoBadge(tipo: MovimentacaoRecente["tipo"]) {
  if (tipo === "entrada") {
    return { label: "Entrada", bg: "#DCFCE7", text: "#166534" };
  }
  return { label: "Saída", bg: "#FEE2E2", text: "#B91C1C" };
}

type MetricCardProps = {
  titulo: string;
  valor: number;
  subtexto: string;
  iconBg: string;
  iconColor: string;
  destaque?: "warning" | "danger";
};

function MetricCard({
  titulo,
  valor,
  subtexto,
  iconBg,
  iconColor,
  destaque,
}: MetricCardProps) {
  const valorColor =
    destaque === "danger"
      ? "#B91C1C"
      : destaque === "warning"
        ? "#C2410C"
        : theme.primary;

  return (
    <article className="rounded-2xl border border-[#ECEAF5] bg-white p-5 shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">
            {titulo}
          </p>
          <p
            className="m-0 mt-2 font-['Playfair_Display',Georgia,serif] text-3xl font-semibold tabular-nums"
            style={{ color: valorColor }}
          >
            {formatNumero(valor)}
          </p>
          <p className="m-0 mt-1 text-xs text-neutral-500">{subtexto}</p>
        </div>
        <span
          className="flex size-10 shrink-0 items-center justify-center rounded-xl"
          style={{ backgroundColor: iconBg, color: iconColor }}
          aria-hidden
        >
          <svg className="size-5" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 2.5a2.5 2.5 0 0 1 2.45 2h.8a1.75 1.75 0 0 1 1.75 1.75v1.5A1.75 1.75 0 0 1 11.25 9.5h-.8v5.25a2.5 2.5 0 0 1-5 0V9.5h-.8A1.75 1.75 0 0 1 2.75 7.75v-1.5A1.75 1.75 0 0 1 4.5 4.5h.8A2.5 2.5 0 0 1 8 2.5Z" />
          </svg>
        </span>
      </div>
    </article>
  );
}

export function DashboardPage() {
  const [dados, setDados] = useState<DashboardDados | null>(null);
  const [loading, setLoading] = useState(true);
  const user = getStoredUser();
  const primeiroNome = user?.firstName ?? "Utilizador";

  useEffect(() => {
    getDadosDashboard()
      .then(setDados)
      .catch((err) => {
        messageToasts.error(
          err instanceof Error ? err.message : "Erro ao carregar dashboard.",
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      className="font-sans flex min-h-svh w-full"
      style={{ backgroundColor: theme.panel }}
    >
      <SideBar />

      <main className="flex min-h-0 min-w-0 flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
        <header className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="m-0 mb-1 text-sm font-medium"
              style={{ color: theme.muted }}
            >
              {saudacao()}, {primeiroNome}
            </p>
            <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-neutral-900">
              Visão geral
            </h1>
          </div>
          <Link
            to={paths.products}
            className="shrink-0 rounded-lg border border-[#ECEAF5] bg-white px-4 py-2.5 text-center text-sm font-semibold text-neutral-800 transition hover:bg-[#FAFAFE]"
          >
            Novo produto
          </Link>
        </header>

        {loading ? (
          <p className="text-neutral-500">A carregar dashboard…</p>
        ) : !dados ? (
          <p className="text-neutral-500">
            Não foi possível carregar os dados do dashboard.
          </p>
        ) : (
          <>
            <section className="mb-6 grid shrink-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                titulo="Produtos cadastrados"
                valor={dados.total_produtos}
                subtexto="Total na base de dados"
                iconBg={`${theme.primary}14`}
                iconColor={theme.primary}
              />
              <MetricCard
                titulo="Itens em estoque"
                valor={dados.total_itens_estoque}
                subtexto="Soma de todas as unidades"
                iconBg="#DCFCE7"
                iconColor="#166534"
              />
              <MetricCard
                titulo="Estoque baixo"
                valor={dados.produtos_estoque_baixo}
                subtexto="Reposição necessária"
                iconBg="#FFEDD5"
                iconColor={theme.gold}
                destaque="warning"
              />
              <MetricCard
                titulo="Esgotados"
                valor={dados.produtos_esgotados}
                subtexto="Ação necessária"
                iconBg="#FEE2E2"
                iconColor="#B91C1C"
                destaque="danger"
              />
            </section>

            <div className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
              <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
                <div className="flex items-center justify-between border-b border-[#F0EEF8] px-5 py-4">
                  <h2 className="m-0 text-sm font-semibold text-neutral-900">
                    Produtos críticos
                  </h2>
                  <Link
                    to={paths.products}
                    className="text-xs font-semibold transition hover:opacity-80"
                    style={{ color: theme.primary }}
                  >
                    Ver todos
                  </Link>
                </div>

                <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-[#F0EEF8] bg-[#FAFAFE] text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-neutral-500">
                        <th className="px-5 py-3">Produto</th>
                        <th className="px-5 py-3">Categoria</th>
                        <th className="px-5 py-3">Estoque</th>
                        <th className="px-5 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dados.produtos_criticos.length === 0 ? (
                        <tr>
                          <td
                            className="px-5 py-10 text-neutral-500"
                            colSpan={4}
                          >
                            Nenhum produto com estoque crítico.
                          </td>
                        </tr>
                      ) : (
                        dados.produtos_criticos.map((produto, index) => {
                          const status = statusCritico(produto);
                          const pill = statusPillStyles[status];
                          const progresso = calcProgresso(
                            produto.quantidade,
                            produto.quantidade_minima,
                          );
                          const barColor =
                            status === "esgotado" ? "#B91C1C" : theme.gold;

                          return (
                            <tr
                              key={`${produto.nome}-${index}`}
                              className="border-b border-[#F0EEF8] last:border-b-0"
                            >
                              <td className="px-5 py-4">
                                <p
                                  className="m-0 font-semibold"
                                  style={{ color: theme.primary }}
                                >
                                  {produto.nome}
                                </p>
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-neutral-800"
                                  style={{
                                    backgroundColor: categoriaColor(index),
                                  }}
                                >
                                  {produto.categoria_nome}
                                </span>
                              </td>
                              <td className="px-5 py-4">
                                <div className="flex min-w-[140px] items-center gap-3">
                                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#F0EEF8]">
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${progresso}%`,
                                        backgroundColor: barColor,
                                      }}
                                    />
                                  </div>
                                  <span className="shrink-0 tabular-nums text-xs text-neutral-600">
                                    {produto.quantidade_minima > 0
                                      ? `${produto.quantidade}/${produto.quantidade_minima}`
                                      : String(produto.quantidade)}
                                  </span>
                                </div>
                              </td>
                              <td className="px-5 py-4">
                                <span
                                  className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                                  style={{
                                    backgroundColor: pill.bg,
                                    color: pill.text,
                                  }}
                                >
                                  {pill.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="flex min-h-0 flex-col overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
                <div className="flex items-center justify-between border-b border-[#F0EEF8] px-5 py-4">
                  <h2 className="m-0 text-sm font-semibold text-neutral-900">
                    Movimentações recentes
                  </h2>
                  <Link
                    to={paths.movements}
                    className="text-xs font-semibold transition hover:opacity-80"
                    style={{ color: theme.primary }}
                  >
                    Ver todas
                  </Link>
                </div>

                <ul className="m-0 flex-1 list-none divide-y divide-[#F0EEF8] overflow-y-auto p-0">
                  {dados.movimentacoes_recentes.length === 0 ? (
                    <li className="px-5 py-10 text-sm text-neutral-500">
                      Nenhuma movimentação registrada.
                    </li>
                  ) : (
                    dados.movimentacoes_recentes.map((mov, index) => {
                      const badge = tipoBadge(mov.tipo);

                      return (
                        <li
                          key={`${mov.produto_nome}-${mov.created_at}-${index}`}
                          className="px-5 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p
                                className="m-0 truncate font-semibold"
                                style={{ color: theme.primary }}
                              >
                                {mov.produto_nome}
                              </p>
                              <p className="m-0 mt-1 text-xs text-neutral-500">
                                {formatDataHora(mov.created_at)}
                              </p>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1">
                              <span
                                className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                                style={{
                                  backgroundColor: badge.bg,
                                  color: badge.text,
                                }}
                              >
                                {badge.label}
                              </span>
                              <span className="text-xs font-semibold tabular-nums text-neutral-600">
                                {mov.tipo === "entrada" ? "+" : "−"}
                                {mov.quantidade}
                              </span>
                            </div>
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
