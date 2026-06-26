import { useCallback, useEffect, useMemo, useState } from "react";
import { SideBar } from "../components/SideBar";
import { categoryIconColors, theme } from "../constants/theme";
import {
  getRelatorioEstoque,
  getRelatorioMovimentacoes,
  type RelatorioEstoque,
  type RelatorioMovimentacoes,
} from "../services/relatorioService";
import { exportCsv } from "../utils/exportCsv";
import { messageToasts } from "../utils/messageToasts";
import {
  formatPreco,
  statusPillStyles,
  type ProdutoStatus,
} from "../utils/produtoStatus";

type AbaRelatorio = "estoque" | "movimentacoes";

type FiltrosMovimentacoes = {
  tipo: "" | "entrada" | "saida";
  data_inicio: string;
  data_fim: string;
};

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/10";

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

function tipoBadge(tipo: "entrada" | "saida") {
  if (tipo === "entrada") {
    return { label: "Entrada", bg: "#DCFCE7", text: "#166534" };
  }
  return { label: "Saída", bg: "#FEE2E2", text: "#B91C1C" };
}

function abbreviarNome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length <= 1) {
    return nome;
  }
  return `${partes[0]} ${partes[partes.length - 1].charAt(0)}.`;
}

export function RelatoriosPage() {
  const [aba, setAba] = useState<AbaRelatorio>("estoque");
  const [estoque, setEstoque] = useState<RelatorioEstoque | null>(null);
  const [movimentacoes, setMovimentacoes] =
    useState<RelatorioMovimentacoes | null>(null);
  const [filtros, setFiltros] = useState<FiltrosMovimentacoes>({
    tipo: "",
    data_inicio: "",
    data_fim: "",
  });
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const carregarEstoque = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await getRelatorioEstoque();
      setEstoque(dados);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao carregar relatório.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarMovimentacoes = useCallback(async () => {
    setLoading(true);
    try {
      const dados = await getRelatorioMovimentacoes({
        tipo: filtros.tipo || undefined,
        data_inicio: filtros.data_inicio || undefined,
        data_fim: filtros.data_fim || undefined,
      });
      setMovimentacoes(dados);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao carregar relatório.",
      );
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    if (aba === "estoque") {
      void carregarEstoque();
      return;
    }
    void carregarMovimentacoes();
  }, [aba, carregarEstoque, carregarMovimentacoes]);

  const itensEstoqueFiltrados = useMemo(() => {
    if (!estoque) {
      return [];
    }
    const termo = busca.trim().toLowerCase();
    if (!termo) {
      return estoque.itens;
    }
    return estoque.itens.filter(
      (item) =>
        item.nome.toLowerCase().includes(termo) ||
        item.categoriaNome.toLowerCase().includes(termo),
    );
  }, [estoque, busca]);

  const itensMovimentacoesFiltrados = useMemo(() => {
    if (!movimentacoes) {
      return [];
    }
    const termo = busca.trim().toLowerCase();
    if (!termo) {
      return movimentacoes.itens;
    }
    return movimentacoes.itens.filter((item) =>
      item.produtoNome.toLowerCase().includes(termo),
    );
  }, [movimentacoes, busca]);

  function exportarEstoqueCsv() {
    if (!estoque) {
      messageToasts.error("Aguarde o relatório carregar antes de exportar.");
      return;
    }
    const rows = itensEstoqueFiltrados.map((item) => [
      item.nome,
      item.categoriaNome,
      String(item.quantidade),
      String(item.quantidadeMinima),
      formatPreco(item.preco),
      formatPreco(item.valorEstoque),
      statusPillStyles[item.status].label,
    ]);
    const ok = exportCsv(
      "relatorio-estoque.csv",
      [
        "Produto",
        "Categoria",
        "Quantidade",
        "Mínimo",
        "Preço",
        "Valor em estoque",
        "Status",
      ],
      rows,
    );
    if (!ok) {
      messageToasts.error("Nenhum produto para exportar com os filtros atuais.");
      return;
    }
    messageToasts.success("Relatório exportado.");
  }

  function exportarMovimentacoesCsv() {
    if (!movimentacoes) {
      messageToasts.error("Aguarde o relatório carregar antes de exportar.");
      return;
    }
    const rows = itensMovimentacoesFiltrados.map((item) => [
      item.produtoNome,
      item.tipo === "entrada" ? "Entrada" : "Saída",
      String(item.quantidade),
      abbreviarNome(item.usuarioNome),
      formatDataHora(item.createdAt),
      item.observacao ?? "",
    ]);
    const ok = exportCsv(
      "relatorio-movimentacoes.csv",
      [
        "Produto",
        "Tipo",
        "Quantidade",
        "Responsável",
        "Data",
        "Observação",
      ],
      rows,
    );
    if (!ok) {
      messageToasts.error(
        "Nenhuma movimentação para exportar com os filtros atuais.",
      );
      return;
    }
    messageToasts.success("Relatório exportado.");
  }

  function renderAbaButton(id: AbaRelatorio, label: string) {
    const active = aba === id;
    return (
      <button
        type="button"
        className={[
          "rounded-lg px-4 py-2 text-sm font-semibold transition",
          active ? "text-white shadow-sm" : "text-neutral-600 hover:bg-white/80",
        ].join(" ")}
        style={active ? { backgroundColor: theme.primary } : undefined}
        onClick={() => {
          setBusca("");
          setAba(id);
        }}
      >
        {label}
      </button>
    );
  }

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
              className="m-0 mb-1 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: theme.muted }}
            >
              Análises e exportação
            </p>
            <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-neutral-900">
              Relatórios
            </h1>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
            style={{ backgroundColor: theme.primary }}
            disabled={loading || (aba === "estoque" ? !estoque : !movimentacoes)}
            onClick={() =>
              aba === "estoque"
                ? exportarEstoqueCsv()
                : exportarMovimentacoesCsv()
            }
          >
            Exportar CSV
          </button>
        </header>

        <div className="mb-4 flex flex-wrap gap-2">
          {renderAbaButton("estoque", "Posição de estoque")}
          {renderAbaButton("movimentacoes", "Movimentações")}
        </div>

        {aba === "movimentacoes" ? (
          <div className="mb-4 grid shrink-0 gap-3 lg:grid-cols-[180px_160px_160px]">
            <select
              className={inputClass}
              value={filtros.tipo}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  tipo: e.target.value as FiltrosMovimentacoes["tipo"],
                }))
              }
            >
              <option value="">Todos os tipos</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
            <input
              type="date"
              className={inputClass}
              value={filtros.data_inicio}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  data_inicio: e.target.value,
                }))
              }
              aria-label="Data início"
            />
            <input
              type="date"
              className={inputClass}
              value={filtros.data_fim}
              onChange={(e) =>
                setFiltros((prev) => ({
                  ...prev,
                  data_fim: e.target.value,
                }))
              }
              aria-label="Data fim"
            />
          </div>
        ) : null}

        {aba === "estoque" && estoque ? (
          <div className="mb-4 grid shrink-0 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#ECEAF5] bg-white px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Produtos
              </p>
              <p
                className="m-0 mt-1 text-2xl font-semibold tabular-nums"
                style={{ color: theme.primary }}
              >
                {formatNumero(estoque.resumo.totalProdutos)}
              </p>
            </div>
            <div className="rounded-xl border border-[#ECEAF5] bg-white px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Itens em estoque
              </p>
              <p
                className="m-0 mt-1 text-2xl font-semibold tabular-nums"
                style={{ color: theme.primary }}
              >
                {formatNumero(estoque.resumo.totalItens)}
              </p>
            </div>
            <div className="rounded-xl border border-[#ECEAF5] bg-white px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Valor total
              </p>
              <p
                className="m-0 mt-1 text-2xl font-semibold tabular-nums"
                style={{ color: theme.primary }}
              >
                {formatPreco(estoque.resumo.valorTotalEstoque)}
              </p>
            </div>
          </div>
        ) : null}

        {aba === "movimentacoes" && movimentacoes ? (
          <div className="mb-4 grid shrink-0 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#ECEAF5] bg-white px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Movimentações
              </p>
              <p
                className="m-0 mt-1 text-2xl font-semibold tabular-nums"
                style={{ color: theme.primary }}
              >
                {formatNumero(movimentacoes.totais.totalMovimentacoes)}
              </p>
            </div>
            <div className="rounded-xl border border-[#ECEAF5] bg-white px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Entradas
              </p>
              <p className="m-0 mt-1 text-2xl font-semibold tabular-nums text-[#166534]">
                +{formatNumero(movimentacoes.totais.totalEntradas)}
              </p>
            </div>
            <div className="rounded-xl border border-[#ECEAF5] bg-white px-4 py-3">
              <p className="m-0 text-xs font-semibold uppercase tracking-wide text-neutral-500">
                Saídas
              </p>
              <p className="m-0 mt-1 text-2xl font-semibold tabular-nums text-[#B91C1C]">
                −{formatNumero(movimentacoes.totais.totalSaidas)}
              </p>
            </div>
          </div>
        ) : null}

        <div className="mb-4 shrink-0">
          <input
            className={inputClass}
            placeholder={
              aba === "estoque"
                ? "Buscar por produto ou categoria…"
                : "Buscar por produto…"
            }
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
            {aba === "estoque" ? (
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#F0EEF8] bg-[#FAFAFE] text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    <th className="px-5 py-3">Produto</th>
                    <th className="px-5 py-3">Categoria</th>
                    <th className="px-5 py-3">Qtd.</th>
                    <th className="px-5 py-3">Mín.</th>
                    <th className="px-5 py-3">Preço</th>
                    <th className="px-5 py-3">Valor</th>
                    <th className="px-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-5 py-10 text-neutral-500" colSpan={7}>
                        A carregar relatório…
                      </td>
                    </tr>
                  ) : itensEstoqueFiltrados.length === 0 ? (
                    <tr>
                      <td className="px-5 py-10 text-neutral-500" colSpan={7}>
                        Nenhum produto encontrado.
                      </td>
                    </tr>
                  ) : (
                    itensEstoqueFiltrados.map((item, index) => {
                      const pill = statusPillStyles[item.status as ProdutoStatus];
                      return (
                        <tr
                          key={`${item.nome}-${index}`}
                          className="border-b border-[#F0EEF8] last:border-b-0"
                        >
                          <td className="px-5 py-4">
                            <p
                              className="m-0 font-semibold"
                              style={{ color: theme.primary }}
                            >
                              {item.nome}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-neutral-800"
                              style={{
                                backgroundColor: categoriaColor(index),
                              }}
                            >
                              {item.categoriaNome}
                            </span>
                          </td>
                          <td className="px-5 py-4 tabular-nums text-neutral-700">
                            {item.quantidade}
                          </td>
                          <td className="px-5 py-4 tabular-nums text-neutral-500">
                            {item.quantidadeMinima}
                          </td>
                          <td className="px-5 py-4 text-neutral-700">
                            {formatPreco(item.preco)}
                          </td>
                          <td className="px-5 py-4 font-medium text-neutral-800">
                            {formatPreco(item.valorEstoque)}
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
            ) : (
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#F0EEF8] bg-[#FAFAFE] text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-neutral-500">
                    <th className="px-5 py-3">Produto</th>
                    <th className="px-5 py-3">Tipo</th>
                    <th className="px-5 py-3">Quantidade</th>
                    <th className="px-5 py-3">Responsável</th>
                    <th className="px-5 py-3">Data</th>
                    <th className="px-5 py-3">Observação</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="px-5 py-10 text-neutral-500" colSpan={6}>
                        A carregar relatório…
                      </td>
                    </tr>
                  ) : itensMovimentacoesFiltrados.length === 0 ? (
                    <tr>
                      <td className="px-5 py-10 text-neutral-500" colSpan={6}>
                        Nenhuma movimentação encontrada.
                      </td>
                    </tr>
                  ) : (
                    itensMovimentacoesFiltrados.map((item) => {
                      const badge = tipoBadge(item.tipo);
                      return (
                        <tr
                          key={item.id}
                          className="border-b border-[#F0EEF8] last:border-b-0"
                        >
                          <td className="px-5 py-4">
                            <p
                              className="m-0 font-semibold"
                              style={{ color: theme.primary }}
                            >
                              {item.produtoNome}
                            </p>
                          </td>
                          <td className="px-5 py-4">
                            <span
                              className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                              style={{
                                backgroundColor: badge.bg,
                                color: badge.text,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td
                            className="px-5 py-4 font-semibold tabular-nums"
                            style={{
                              color:
                                item.tipo === "entrada" ? "#166534" : "#B91C1C",
                            }}
                          >
                            {item.tipo === "entrada" ? "+" : "−"}
                            {item.quantidade}
                          </td>
                          <td className="px-5 py-4 text-neutral-700">
                            {abbreviarNome(item.usuarioNome)}
                          </td>
                          <td className="px-5 py-4 whitespace-nowrap text-neutral-600">
                            {formatDataHora(item.createdAt)}
                          </td>
                          <td className="px-5 py-4 text-neutral-500 italic">
                            {item.observacao ? (
                              `"${item.observacao}"`
                            ) : (
                              <span className="text-neutral-400 not-italic">
                                —
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
