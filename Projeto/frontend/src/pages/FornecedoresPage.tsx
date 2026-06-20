import { useCallback, useEffect, useMemo, useState } from "react";
import { SideBar } from "../components/SideBar";
import {
  FornecedorFormModal,
  type FornecedorFormValues,
} from "../components/FornecedorFormModal";
import { theme } from "../constants/theme";
import {
  atualizarFornecedor,
  criarFornecedor,
  deletarFornecedor,
  listarFornecedores,
  type Fornecedor,
} from "../services/fornecedorService";
import { messageToasts } from "../utils/messageToasts";
import { confirmDialog } from "../utils/confirmDialog";
import { isValidPhone, maskPhone } from "../utils/phoneMask";

type FiltroStatus = "" | "ativo" | "inativo";

function EditIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M11.13 2.87a1.25 1.25 0 0 1 1.77 0l.23.23a1.25 1.25 0 0 1 0 1.77l-7.1 7.1-2.53.42a.75.75 0 0 1-.86-.86l.42-2.53 7.1-7.1Z"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M6 2.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V3h2.25a.75.75 0 0 1 0 1.5H3.75a.75.75 0 0 1 0-1.5H6V2.5Zm-1.5 4.5a.75.75 0 0 1 .75.75v5a1 1 0 0 0 1 1h4.5a1 1 0 0 0 1-1v-5a.75.75 0 0 1 1.5 0v5a2.5 2.5 0 0 1-2.5 2.5h-4.5A2.5 2.5 0 0 1 3.5 12.75v-5a.75.75 0 0 1 .75-.75Z"
      />
    </svg>
  );
}

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/10";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateForm(values: FornecedorFormValues): string | null {
  if (!values.nome.trim()) {
    return "Informe o nome do fornecedor.";
  }
  if (values.nome.trim().length > 150) {
    return "O nome deve ter no máximo 150 caracteres.";
  }
  const email = values.email.trim();
  if (email && !EMAIL_REGEX.test(email)) {
    return "Introduza um e-mail válido.";
  }
  const telefone = values.telefone.trim();
  if (telefone && !isValidPhone(telefone)) {
    return "Introduza um telefone válido com DDD.";
  }
  if (telefone.length > 20) {
    return "O telefone deve ter no máximo 20 caracteres.";
  }
  return null;
}

function formatProdutosVinculados(count: number): string {
  if (count === 1) {
    return "1 produto";
  }
  return `${count} produtos`;
}

function statusBadge(ativo: boolean) {
  if (ativo) {
    return {
      label: "Ativo",
      bg: "#DCFCE7",
      text: "#166534",
    };
  }
  return {
    label: "Inativo",
    bg: `${theme.primary}14`,
    text: theme.muted,
  };
}

export function FornecedoresPage() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregarFornecedores = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await listarFornecedores();
      setFornecedores(lista);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao carregar fornecedores.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarFornecedores();
  }, [carregarFornecedores]);

  const fornecedoresFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return fornecedores.filter((fornecedor) => {
      if (filtroStatus === "ativo" && !fornecedor.ativo) {
        return false;
      }
      if (filtroStatus === "inativo" && fornecedor.ativo) {
        return false;
      }
      if (!termo) {
        return true;
      }
      return (
        fornecedor.nome.toLowerCase().includes(termo) ||
        (fornecedor.email?.toLowerCase().includes(termo) ?? false)
      );
    });
  }, [fornecedores, busca, filtroStatus]);

  function abrirCriacao() {
    setModalMode("create");
    setEditingFornecedor(null);
    setModalOpen(true);
  }

  function abrirEdicao(fornecedor: Fornecedor) {
    setModalMode("edit");
    setEditingFornecedor(fornecedor);
    setModalOpen(true);
  }

  function fecharModal() {
    if (saving) {
      return;
    }
    setModalOpen(false);
    setEditingFornecedor(null);
  }

  async function handleSubmit(values: FornecedorFormValues) {
    const validationError = validateForm(values);
    if (validationError) {
      messageToasts.error(validationError);
      return;
    }

    const payload = {
      nome: values.nome.trim(),
      email: values.email.trim() || null,
      telefone: values.telefone.trim() || null,
    };

    setSaving(true);
    try {
      if (modalMode === "create") {
        await criarFornecedor(payload);
        messageToasts.success("Fornecedor cadastrado.");
      } else if (editingFornecedor) {
        await atualizarFornecedor(editingFornecedor.id, {
          ...payload,
          ativo: values.ativo,
        });
        messageToasts.success("Fornecedor atualizado.");
      }

      fecharModal();
      await carregarFornecedores();
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao guardar fornecedor.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(fornecedor: Fornecedor) {
    const confirmado = await confirmDialog.open({
      title: "Excluir fornecedor",
      message: `Excluir "${fornecedor.nome}"? Esta ação remove o registo da base de dados.`,
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      variant: "danger",
    });
    if (!confirmado) {
      return;
    }

    setExcluindoId(fornecedor.id);
    try {
      await deletarFornecedor(fornecedor.id);
      if (editingFornecedor?.id === fornecedor.id) {
        fecharModal();
      }
      await carregarFornecedores();
      messageToasts.success("Fornecedor excluído.");
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao excluir fornecedor.",
      );
    } finally {
      setExcluindoId(null);
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
              Parceiros comerciais
            </p>
            <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-neutral-900">
              Fornecedores
            </h1>
          </div>
          <button
            type="button"
            className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            style={{ backgroundColor: theme.primary }}
            onClick={abrirCriacao}
          >
            Cadastrar fornecedor
          </button>
        </header>

        <div className="mb-4 grid shrink-0 gap-3 lg:grid-cols-[1fr_180px]">
          <input
            className={inputClass}
            placeholder="Buscar por nome ou e-mail…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select
            className={inputClass}
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as FiltroStatus)}
          >
            <option value="">Todos status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
          <div className="min-h-0 flex-1 overflow-x-auto overflow-y-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#F0EEF8] bg-[#FAFAFE] text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-neutral-500">
                  <th className="px-5 py-3">Fornecedor</th>
                  <th className="px-5 py-3">Contato</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Produtos vinculados</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className="px-5 py-10 text-neutral-500" colSpan={5}>
                      A carregar fornecedores…
                    </td>
                  </tr>
                ) : fornecedores.length === 0 ? (
                  <tr>
                    <td className="px-5 py-10 text-neutral-500" colSpan={5}>
                      Nenhum fornecedor cadastrado.
                    </td>
                  </tr>
                ) : fornecedoresFiltrados.length === 0 ? (
                  <tr>
                    <td className="px-5 py-10 text-neutral-500" colSpan={5}>
                      {busca.trim()
                        ? `Nenhum fornecedor encontrado para "${busca.trim()}".`
                        : "Nenhum fornecedor encontrado com os filtros selecionados."}
                    </td>
                  </tr>
                ) : (
                  fornecedoresFiltrados.map((fornecedor) => {
                    const badge = statusBadge(fornecedor.ativo);

                    return (
                      <tr
                        key={fornecedor.id}
                        className="border-b border-[#F0EEF8] last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <p
                            className="m-0 font-semibold"
                            style={{ color: theme.primary }}
                          >
                            {fornecedor.nome}
                          </p>
                        </td>
                        <td className="px-5 py-4 text-neutral-600">
                          {fornecedor.email ? (
                            <p className="m-0">{fornecedor.email}</p>
                          ) : (
                            <p className="m-0 text-neutral-400">—</p>
                          )}
                          {fornecedor.telefone ? (
                            <p className="m-0 mt-0.5 text-xs text-neutral-500">
                              {maskPhone(fornecedor.telefone)}
                            </p>
                          ) : null}
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
                        <td className="px-5 py-4 text-neutral-700">
                          {formatProdutosVinculados(
                            fornecedor.produtosVinculados,
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                              aria-label={`Editar ${fornecedor.nome}`}
                              onClick={() => abrirEdicao(fornecedor)}
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              aria-label={`Excluir ${fornecedor.nome}`}
                              disabled={excluindoId === fornecedor.id}
                              onClick={() => void handleExcluir(fornecedor)}
                            >
                              <DeleteIcon />
                            </button>
                          </div>
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

      <FornecedorFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingFornecedor}
        saving={saving}
        onClose={fecharModal}
        onSubmit={(values) => void handleSubmit(values)}
      />
    </div>
  );
}
