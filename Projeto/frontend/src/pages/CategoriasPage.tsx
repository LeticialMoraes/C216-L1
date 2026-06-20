import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AppShell } from "../components/AppShell";
import { categoryIconColors, theme } from "../constants/theme";
import {
  atualizarCategoria,
  criarCategoria,
  deletarCategoria,
  listarCategorias,
  type Categoria,
} from "../services/categoriaService";
import { messageToasts } from "../utils/messageToasts";
import { confirmDialog } from "../utils/confirmDialog";

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

export function CategoriasPage() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [novaCategoria, setNovaCategoria] = useState("");
  const [criando, setCriando] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNome, setEditingNome] = useState("");
  const [salvandoId, setSalvandoId] = useState<number | null>(null);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregarCategorias = useCallback(async () => {
    setLoading(true);
    try {
      const lista = await listarCategorias();
      setCategorias(lista);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao carregar categorias.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregarCategorias();
  }, [carregarCategorias]);

  async function handleCriar(e: FormEvent) {
    e.preventDefault();
    const nome = novaCategoria.trim();
    if (!nome) {
      messageToasts.error("Informe o nome da categoria.");
      return;
    }

    setCriando(true);
    try {
      await criarCategoria({ nome });
      setNovaCategoria("");
      await carregarCategorias();
      messageToasts.success("Categoria adicionada.");
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao criar categoria.",
      );
    } finally {
      setCriando(false);
    }
  }

  function iniciarEdicao(categoria: Categoria) {
    setEditingId(categoria.id);
    setEditingNome(categoria.nome);
  }

  function cancelarEdicao() {
    setEditingId(null);
    setEditingNome("");
  }

  async function salvarEdicao(id: number) {
    const nome = editingNome.trim();
    if (!nome) {
      messageToasts.error("O nome não pode ficar vazio.");
      return;
    }

    setSalvandoId(id);
    try {
      const categoria = categorias.find((item) => item.id === id);
      await atualizarCategoria(id, {
        nome,
        descricao: categoria?.descricao ?? null,
      });
      cancelarEdicao();
      await carregarCategorias();
      messageToasts.success("Categoria atualizada.");
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao atualizar categoria.",
      );
    } finally {
      setSalvandoId(null);
    }
  }

  async function handleExcluir(categoria: Categoria) {
    const confirmado = await confirmDialog.open({
      title: "Excluir categoria",
      message: `Excluir a categoria "${categoria.nome}"? Esta ação não pode ser desfeita.`,
      confirmLabel: "Excluir",
      cancelLabel: "Cancelar",
      variant: "danger",
    });
    if (!confirmado) {
      return;
    }

    setExcluindoId(categoria.id);
    try {
      await deletarCategoria(categoria.id);
      if (editingId === categoria.id) {
        cancelarEdicao();
      }
      await carregarCategorias();
      messageToasts.success("Categoria excluída.");
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao excluir categoria.",
      );
    } finally {
      setExcluindoId(null);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/10";

  return (
    <AppShell title="Categorias & Fornecedores">
      <div className="grid gap-6 xl:grid-cols-2">
        <section className="flex flex-col overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
          <div className="flex items-center justify-between border-b border-[#F0EEF8] px-5 py-4">
            <h2
              className="m-0 text-base font-semibold"
              style={{ color: theme.primary }}
            >
              Categorias
            </h2>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold"
              style={{
                backgroundColor: `${theme.primary}12`,
                color: theme.primary,
              }}
            >
              {categorias.length} cadastrada
              {categorias.length === 1 ? "" : "s"}
            </span>
          </div>

          <div className="min-h-[280px] flex-1">
            {loading ? (
              <p className="px-5 py-8 text-sm text-neutral-500">
                A carregar categorias…
              </p>
            ) : categorias.length === 0 ? (
              <p className="px-5 py-8 text-sm text-neutral-500">
                Nenhuma categoria cadastrada. Adicione a primeira abaixo.
              </p>
            ) : (
              <ul className="m-0 list-none divide-y divide-[#F0EEF8] p-0">
                {categorias.map((categoria, index) => {
                  const isEditing = editingId === categoria.id;
                  const iconColor =
                    categoryIconColors[index % categoryIconColors.length];

                  return (
                    <li
                      key={categoria.id}
                      className="flex items-center gap-4 px-5 py-4"
                    >
                      <span
                        className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: iconColor }}
                        aria-hidden
                      >
                        <span
                          className="size-3 rounded-sm"
                          style={{ backgroundColor: `${theme.primary}55` }}
                        />
                      </span>

                      <div className="min-w-0 flex-1">
                        {isEditing ? (
                          <input
                            className={inputClass}
                            value={editingNome}
                            onChange={(e) => setEditingNome(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                void salvarEdicao(categoria.id);
                              }
                              if (e.key === "Escape") {
                                cancelarEdicao();
                              }
                            }}
                          />
                        ) : (
                          <>
                            <p
                              className="m-0 truncate text-sm font-semibold"
                              style={{ color: theme.primary }}
                            >
                              {categoria.nome}
                            </p>
                            <p className="m-0 mt-0.5 text-xs text-neutral-500">
                              0 produtos
                            </p>
                          </>
                        )}
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        {isEditing ? (
                          <>
                            <button
                              type="button"
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                              style={{ backgroundColor: theme.primary }}
                              disabled={salvandoId === categoria.id}
                              onClick={() => void salvarEdicao(categoria.id)}
                            >
                              {salvandoId === categoria.id ? "…" : "Salvar"}
                            </button>
                            <button
                              type="button"
                              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                              onClick={cancelarEdicao}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                              aria-label={`Editar ${categoria.nome}`}
                              onClick={() => iniciarEdicao(categoria)}
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              aria-label={`Excluir ${categoria.nome}`}
                              disabled={excluindoId === categoria.id}
                              onClick={() => void handleExcluir(categoria)}
                            >
                              <DeleteIcon />
                            </button>
                          </>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form
            className="flex gap-2 border-t border-[#F0EEF8] bg-[#FAFAFE] px-5 py-4"
            onSubmit={handleCriar}
          >
            <input
              className={inputClass}
              placeholder="Nome da nova categoria"
              value={novaCategoria}
              onChange={(e) => setNovaCategoria(e.target.value)}
              disabled={criando}
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
              disabled={criando}
            >
              {criando ? "…" : "Adicionar"}
            </button>
          </form>
        </section>

        <section className="flex flex-col overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
          <div className="flex items-center justify-between border-b border-[#F0EEF8] px-5 py-4">
            <h2
              className="m-0 text-base font-semibold"
              style={{ color: theme.primary }}
            >
              Fornecedores
            </h2>
            <button
              type="button"
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-white opacity-60"
              style={{ backgroundColor: theme.primary }}
              disabled
            >
              Novo
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center">
            <p
              className="m-0 text-sm font-medium"
              style={{ color: theme.primary }}
            >
              Em breve
            </p>
            <p className="m-0 mt-2 max-w-xs text-sm text-neutral-500">
              A gestão de fornecedores será integrada neste painel na próxima
              etapa.
            </p>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
