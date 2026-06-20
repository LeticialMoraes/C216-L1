import { useCallback, useEffect, useMemo, useState } from "react";
import { theme } from "../constants/theme";
import {
  FornecedorFormModal,
  type FornecedorFormValues,
} from "./FornecedorFormModal";
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

function formatContacto(fornecedor: Fornecedor): string {
  const email = fornecedor.email ?? "";
  const telefone = fornecedor.telefone ? maskPhone(fornecedor.telefone) : "";
  const partes = [email, telefone].filter(Boolean);
  return partes.length > 0 ? partes.join(" · ") : "Sem contacto";
}

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

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/10";

export function FornecedoresPanel() {
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
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
    if (!termo) {
      return fornecedores;
    }
    return fornecedores.filter((fornecedor) => {
      const telefone = fornecedor.telefone?.replace(/\D/g, "") ?? "";
      const termoNumeros = termo.replace(/\D/g, "");
      return (
        fornecedor.nome.toLowerCase().includes(termo) ||
        (fornecedor.email?.toLowerCase().includes(termo) ?? false) ||
        (termoNumeros.length > 0 && telefone.includes(termoNumeros))
      );
    });
  }, [fornecedores, busca]);

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
    <>
      <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
        <div className="flex items-center justify-between border-b border-[#F0EEF8] px-5 py-4">
          <h2
            className="m-0 text-base font-semibold"
            style={{ color: theme.primary }}
          >
            Fornecedores
          </h2>
          <button
            type="button"
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition hover:opacity-95"
            style={{ backgroundColor: theme.primary }}
            onClick={abrirCriacao}
          >
            + Novo
          </button>
        </div>

        <div className="border-b border-[#F0EEF8] p-4">
          <input
            className={inputClass}
            placeholder="Buscar por nome, e-mail ou telefone…"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {loading ? (
            <p className="px-5 py-8 text-sm text-neutral-500">
              A carregar fornecedores…
            </p>
          ) : fornecedores.length === 0 ? (
            <p className="px-5 py-8 text-sm text-neutral-500">
              Nenhum fornecedor cadastrado. Clique em &quot;+ Novo&quot; para
              adicionar.
            </p>
          ) : fornecedoresFiltrados.length === 0 ? (
            <p className="px-5 py-8 text-sm text-neutral-500">
              Nenhum fornecedor encontrado para &quot;{busca.trim()}&quot;.
            </p>
          ) : (
            <ul className="m-0 list-none divide-y divide-[#F0EEF8] p-0">
              {fornecedoresFiltrados.map((fornecedor) => (
                <li
                  key={fornecedor.id}
                  className="flex items-center gap-3 px-5 py-4"
                >
                  <div className="min-w-0 flex-1">
                    <p
                      className="m-0 truncate text-sm font-semibold"
                      style={{ color: theme.primary }}
                    >
                      {fornecedor.nome}
                    </p>
                    <p className="m-0 mt-0.5 truncate text-xs text-neutral-500">
                      {formatContacto(fornecedor)}
                    </p>
                  </div>

                  <span
                    className="shrink-0 rounded-full px-2.5 py-1 text-[0.6875rem] font-semibold"
                    style={{
                      backgroundColor: fornecedor.ativo ? "#DCFCE7" : "#FFEDD5",
                      color: fornecedor.ativo ? "#166534" : "#C2410C",
                    }}
                  >
                    {fornecedor.ativo ? "Ativo" : "Inativo"}
                  </span>

                  <div className="flex shrink-0 items-center gap-1">
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
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <FornecedorFormModal
        open={modalOpen}
        mode={modalMode}
        initial={editingFornecedor}
        saving={saving}
        onClose={fecharModal}
        onSubmit={(values) => void handleSubmit(values)}
      />
    </>
  );
}
