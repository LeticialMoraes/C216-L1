import { useCallback, useEffect, useMemo, useState } from "react";
import { SideBar } from "../components/SideBar";
import {
  MovimentacaoFormModal,
  type MovimentacaoFormValues,
} from "../components/MovimentacaoFormModal";
import { theme } from "../constants/theme";
import {
  listarMovimentacoes,
  registrarMovimentacao,
  type Movimentacao,
  type MovimentacaoTipo,
} from "../services/movimentacaoService";
import { listarProdutos } from "../services/produtoService";
import { messageToasts } from "../utils/messageToasts";

type FiltrosState = {
  tipo: "" | MovimentacaoTipo;
  data_inicio: string;
  data_fim: string;
};

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/10";

function formatDataHora(iso: string): string {
  const d = new Date(iso);
  const data = d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const hora = d.toLocaleTimeString("pt-PT", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${data} às ${hora}`;
}

function abbreviarNome(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  if (partes.length <= 1) {
    return nome;
  }
  return `${partes[0]} ${partes[partes.length - 1].charAt(0)}.`;
}

function tipoBadge(tipo: MovimentacaoTipo) {
  if (tipo === "entrada") {
    return {
      label: "Entrada",
      bg: "#DCFCE7",
      text: "#166534",
    };
  }
  return {
    label: "Saída",
    bg: "#FEE2E2",
    text: "#B91C1C",
  };
}

function formatQuantidade(tipo: MovimentacaoTipo, quantidade: number): string {
  const prefix = tipo === "entrada" ? "+" : "−";
  return `${prefix} ${quantidade}`;
}

function validateForm(values: MovimentacaoFormValues): string | null {
  if (!values.produtoId) {
    return "Selecione um produto.";
  }
  if (values.tipo !== "entrada" && values.tipo !== "saida") {
    return "Selecione o tipo da movimentação.";
  }
  const quantidade = Number.parseInt(values.quantidade, 10);
  if (!Number.isInteger(quantidade) || quantidade < 1) {
    return "Informe uma quantidade válida.";
  }
  return null;
}

export function MovimentacoesPage() {
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([]);
  const [filtros, setFiltros] = useState<FiltrosState>({
    tipo: "",
    data_inicio: "",
    data_fim: "",
  });
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtos, setProdutos] = useState<Awaited<
    ReturnType<typeof listarProdutos>
  >>([]);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [saving, setSaving] = useState(false);

  const carregarMovimentacoes = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await listarMovimentacoes({
        tipo: filtros.tipo || undefined,
        data_inicio: filtros.data_inicio || undefined,
        data_fim: filtros.data_fim || undefined,
      });
      setMovimentacoes(lista);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao carregar movimentações.",
      );
    } finally {
      setLoading(false);
    }
  }, [filtros]);

  useEffect(() => {
    void carregarMovimentacoes();
  }, [carregarMovimentacoes]);

  const movimentacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) {
      return movimentacoes;
    }
    return movimentacoes.filter((mov) =>
      mov.produtoNome.toLowerCase().includes(termo),
    );
  }, [movimentacoes, busca]);

  async function abrirModal() {
    setModalAberto(true);
    setLoadingProdutos(true);
    try {
      const lista = await listarProdutos();
      setProdutos(lista);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao carregar produtos.",
      );
      setModalAberto(false);
    } finally {
      setLoadingProdutos(false);
    }
  }

  function fecharModal() {
    if (saving) {
      return;
    }
    setModalAberto(false);
  }

  async function handleSubmit(values: MovimentacaoFormValues) {
    const validationError = validateForm(values);
    if (validationError) {
      messageToasts.error(validationError);
      return;
    }

    setSaving(true);
    try {
      await registrarMovimentacao({
        produtoId: Number.parseInt(values.produtoId, 10),
        tipo: values.tipo as MovimentacaoTipo,
        quantidade: Number.parseInt(values.quantidade, 10),
        observacao: values.observacao.trim() || null,
      });
      messageToasts.success("Movimentação registrada.");
      fecharModal();
      await carregarMovimentacoes();
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao registrar movimentação.",
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
        <header className="mb-6 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p
              className="m-0 mb-1 text-xs font-semibold uppercase tracking-[0.18em]"
              style={{ color: theme.muted }}
            >
              Histórico de estoque
            </p>
            <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-neutral-900">
              Movimentações
            </h1>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            style={{ backgroundColor: theme.primary }}
            onClick={() => void abrirModal()}
          >
            Registrar movimentação
          </button>
        </header>

        <div className="mb-4 grid shrink-0 gap-3 lg:grid-cols-[1fr_180px_160px_160px]">
          <input
            className={inputClass}
            placeholder="Buscar por produto…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select
            className={inputClass}
            value={filtros.tipo}
            onChange={(e) =>
              setFiltros((prev) => ({
                ...prev,
                tipo: e.target.value as FiltrosState["tipo"],
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

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
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
                      A carregar movimentações…
                    </td>
                  </tr>
                ) : movimentacoes.length === 0 ? (
                  <tr>
                    <td className="px-5 py-10 text-neutral-500" colSpan={6}>
                      Nenhuma movimentação registrada.
                    </td>
                  </tr>
                ) : movimentacoesFiltradas.length === 0 ? (
                  <tr>
                    <td className="px-5 py-10 text-neutral-500" colSpan={6}>
                      {busca.trim()
                        ? `Nenhuma movimentação encontrada para "${busca.trim()}".`
                        : "Nenhuma movimentação encontrada com os filtros selecionados."}
                    </td>
                  </tr>
                ) : (
                  movimentacoesFiltradas.map((mov) => {
                    const badge = tipoBadge(mov.tipo);

                    return (
                      <tr
                        key={mov.id}
                        className="border-b border-[#F0EEF8] last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <p
                            className="m-0 font-semibold"
                            style={{ color: theme.primary }}
                          >
                            {mov.produtoNome}
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
                              mov.tipo === "entrada" ? "#166534" : "#B91C1C",
                          }}
                        >
                          {formatQuantidade(mov.tipo, mov.quantidade)}
                        </td>
                        <td className="px-5 py-4 text-neutral-700">
                          {abbreviarNome(mov.usuarioNome)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-neutral-600">
                          {formatDataHora(mov.createdAt)}
                        </td>
                        <td className="px-5 py-4 text-neutral-500 italic">
                          {mov.observacao ? (
                            `"${mov.observacao}"`
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
          </div>
        </section>
      </main>

      <MovimentacaoFormModal
        open={modalAberto}
        produtos={produtos}
        loadingProdutos={loadingProdutos}
        saving={saving}
        onClose={fecharModal}
        onSubmit={(values) => void handleSubmit(values)}
      />
    </div>
  );
}
