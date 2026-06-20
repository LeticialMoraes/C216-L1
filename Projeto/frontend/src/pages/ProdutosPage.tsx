import { useCallback, useEffect, useMemo, useState } from "react";
import { SideBar } from "../components/SideBar";
import {
  ProdutoFormModal,
  produtoToFormValues,
  type ProdutoFormValues,
} from "../components/ProdutoFormModal";
import { categoryIconColors, theme } from "../constants/theme";
import { listarCategorias, type Categoria } from "../services/categoriaService";
import {
  atualizarProduto,
  buscarProdutoPorId,
  criarProduto,
  deletarProduto,
  listarProdutos,
  vincularFornecedor,
  type Produto,
  type ProdutoDetalhe,
  type ProdutoInput,
  type ProdutoStatus,
} from "../services/produtoService";
import { confirmDialog } from "../utils/confirmDialog";
import {
  calcularStatusProduto,
  formatPreco,
  statusPillStyles,
} from "../utils/produtoStatus";
import { messageToasts } from "../utils/messageToasts";

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

function categoriaColor(categoriaId: number): string {
  return categoryIconColors[categoriaId % categoryIconColors.length];
}

function gerarSku(nome: string): string {
  const base = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toUpperCase()
    .slice(0, 22);
  const suffix = Date.now().toString(36).slice(-4).toUpperCase();
  return `${base || "PROD"}-${suffix}`.slice(0, 30);
}

function parseProdutoPayload(
  values: ProdutoFormValues,
  mode: "create" | "edit",
):
  | { data: ProdutoInput }
  | { error: string } {
  const nome = values.nome.trim();
  const sku = values.sku.trim() || (mode === "create" ? gerarSku(nome) : "");
  const preco = Number(values.preco.replace(",", "."));
  const quantidade = Number.parseInt(values.quantidade, 10);
  const quantidadeMinima =
    mode === "create"
      ? 10
      : Number.parseInt(values.quantidadeMinima, 10);
  const categoriaId = Number.parseInt(values.categoriaId, 10);

  if (!nome) {
    return { error: "Informe o nome do produto." };
  }
  if (!sku) {
    return { error: "Informe o SKU." };
  }
  if (!Number.isFinite(preco) || preco <= 0) {
    return { error: "Informe um preço válido maior que zero." };
  }
  if (!Number.isInteger(quantidade) || quantidade < 0) {
    return { error: "Informe uma quantidade válida." };
  }
  if (!Number.isInteger(quantidadeMinima) || quantidadeMinima < 0) {
    return { error: "Informe uma quantidade mínima válida." };
  }
  if (!Number.isInteger(categoriaId) || categoriaId < 1) {
    return { error: "Selecione uma categoria." };
  }

  return {
    data: {
      nome,
      sku,
      descricao: values.descricao.trim() || null,
      preco,
      quantidade,
      quantidadeMinima,
      tamanhos: values.tamanhos.trim() || null,
      categoriaId,
    },
  };
}

export function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<"" | ProdutoStatus>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingProduto, setEditingProduto] = useState<ProdutoDetalhe | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [excluindoId, setExcluindoId] = useState<number | null>(null);

  const carregarProdutos = useCallback(async () => {
    setLoading(true);
    try {
      const filtros: { categoria_id?: number; status?: ProdutoStatus } = {};
      if (filtroCategoria) {
        filtros.categoria_id = Number(filtroCategoria);
      }
      if (filtroStatus) {
        filtros.status = filtroStatus;
      }
      const lista = await listarProdutos(filtros);
      setProdutos(lista);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao carregar produtos.",
      );
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria, filtroStatus]);

  useEffect(() => {
    void carregarProdutos();
  }, [carregarProdutos]);

  useEffect(() => {
    void listarCategorias()
      .then(setCategorias)
      .catch(() => {
        messageToasts.error("Não foi possível carregar categorias.");
      });
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) {
      return produtos;
    }
    return produtos.filter(
      (produto) =>
        produto.nome.toLowerCase().includes(termo) ||
        produto.sku.toLowerCase().includes(termo),
    );
  }, [produtos, busca]);

  function abrirCadastro() {
    setModalMode("create");
    setEditingProduto(null);
    setModalOpen(true);
  }

  async function abrirEdicao(produto: Produto) {
    try {
      const detalhe = await buscarProdutoPorId(produto.id);
      setModalMode("edit");
      setEditingProduto(detalhe);
      setModalOpen(true);
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao carregar produto.",
      );
    }
  }

  function fecharModal() {
    if (saving) {
      return;
    }
    setModalOpen(false);
    setEditingProduto(null);
  }

  async function handleSubmit(values: ProdutoFormValues) {
    const parsed = parseProdutoPayload(values, modalMode);
    if ("error" in parsed) {
      messageToasts.error(parsed.error);
      return;
    }

    setSaving(true);
    try {
      if (modalMode === "create") {
        const criado = await criarProduto(parsed.data);
        if (values.fornecedorId) {
          await vincularFornecedor(criado.id, {
            fornecedorId: Number(values.fornecedorId),
          });
        }
        messageToasts.success("Produto cadastrado.");
      } else if (editingProduto) {
        await atualizarProduto(editingProduto.id, parsed.data);
        messageToasts.success("Produto atualizado.");
      }
      fecharModal();
      await carregarProdutos();
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao guardar produto.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleExcluir(produto: Produto) {
    const confirmado = await confirmDialog.open({
      title: "Excluir produto",
      message: `Excluir "${produto.nome}"? Os vínculos com fornecedores também serão removidos.`,
      confirmLabel: "Excluir",
      variant: "danger",
    });
    if (!confirmado) {
      return;
    }

    setExcluindoId(produto.id);
    try {
      await deletarProduto(produto.id);
      await carregarProdutos();
      messageToasts.success("Produto excluído.");
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao excluir produto.",
      );
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <>
      <div
        className="font-sans flex min-h-svh w-full"
        style={{ backgroundColor: theme.panel }}
      >
        <SideBar />

        <main className="flex min-w-0 flex-1 flex-col px-6 py-8 sm:px-10 lg:px-12">
          <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p
                className="m-0 mb-1 text-xs font-semibold uppercase tracking-[0.18em]"
                style={{ color: theme.muted }}
              >
                Catálogo completo
              </p>
              <h1 className="m-0 font-['Playfair_Display',Georgia,serif] text-[clamp(1.75rem,3vw,2.25rem)] font-semibold tracking-tight text-neutral-900">
                Produtos
              </h1>
            </div>
            <div className="shrink-0">
              <button
                type="button"
                className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
                style={{ backgroundColor: theme.primary }}
                onClick={abrirCadastro}
              >
                Cadastrar produto
              </button>
            </div>
          </header>

        <section className="overflow-hidden rounded-2xl border border-[#ECEAF5] bg-white shadow-[0_8px_30px_rgba(62,59,130,0.06)]">
          <div className="grid gap-3 border-b border-[#F0EEF8] p-4 lg:grid-cols-[1fr_180px_180px]">
            <input
              className={inputClass}
              placeholder="Buscar por nome ou SKU…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select
              className={inputClass}
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="">Todas categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
            <select
              className={inputClass}
              value={filtroStatus}
              onChange={(e) =>
                setFiltroStatus(e.target.value as "" | ProdutoStatus)
              }
            >
              <option value="">Todos status</option>
              <option value="ok">OK</option>
              <option value="baixo">Baixo</option>
              <option value="esgotado">Esgotado</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-[#F0EEF8] bg-[#FAFAFE] text-[0.6875rem] font-bold uppercase tracking-[0.12em] text-neutral-500">
                  <th className="px-5 py-3">Produto</th>
                  <th className="px-5 py-3">Categoria</th>
                  <th className="px-5 py-3">Qtd.</th>
                  <th className="px-5 py-3">Preço</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Fornecedor</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td
                      className="px-5 py-10 text-neutral-500"
                      colSpan={7}
                    >
                      A carregar produtos…
                    </td>
                  </tr>
                ) : produtosFiltrados.length === 0 ? (
                  <tr>
                    <td
                      className="px-5 py-10 text-neutral-500"
                      colSpan={7}
                    >
                      Nenhum produto encontrado.
                    </td>
                  </tr>
                ) : (
                  produtosFiltrados.map((produto) => {
                    const status = calcularStatusProduto(
                      produto.quantidade,
                      produto.quantidadeMinima,
                    );
                    const pill = statusPillStyles[status];

                    return (
                      <tr
                        key={produto.id}
                        className="border-b border-[#F0EEF8] last:border-b-0"
                      >
                        <td className="px-5 py-4">
                          <p
                            className="m-0 font-semibold"
                            style={{ color: theme.primary }}
                          >
                            {produto.nome}
                          </p>
                          <p className="m-0 mt-0.5 text-xs text-neutral-500">
                            {produto.sku.startsWith("#")
                              ? produto.sku
                              : `#${produto.sku}`}
                            {produto.tamanhos
                              ? ` · ${produto.tamanhos}`
                              : ""}
                          </p>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold"
                            style={{
                              backgroundColor: categoriaColor(produto.categoriaId),
                              color: theme.primary,
                            }}
                          >
                            {produto.categoriaNome ?? "—"}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-neutral-800">
                          {produto.quantidade}
                        </td>
                        <td className="px-5 py-4 font-medium text-neutral-800">
                          {formatPreco(produto.preco)}
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
                        <td className="px-5 py-4 text-neutral-700">
                          {produto.fornecedorNome ?? "—"}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              className="rounded-lg p-2 text-neutral-400 transition hover:bg-neutral-100 hover:text-neutral-700"
                              aria-label={`Editar ${produto.nome}`}
                              onClick={() => void abrirEdicao(produto)}
                            >
                              <EditIcon />
                            </button>
                            <button
                              type="button"
                              className="rounded-lg p-2 text-neutral-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                              aria-label={`Excluir ${produto.nome}`}
                              disabled={excluindoId === produto.id}
                              onClick={() => void handleExcluir(produto)}
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
      </div>

      <ProdutoFormModal
        open={modalOpen}
        mode={modalMode}
        produtoId={editingProduto?.id ?? null}
        categorias={categorias}
        initial={
          editingProduto ? produtoToFormValues(editingProduto) : null
        }
        fornecedoresVinculados={editingProduto?.fornecedores ?? []}
        saving={saving}
        onClose={fecharModal}
        onSubmit={(values) => void handleSubmit(values)}
        onFornecedoresChange={() => void carregarProdutos()}
      />
    </>
  );
}
