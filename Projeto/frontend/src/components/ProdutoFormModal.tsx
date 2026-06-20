import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { theme } from "../constants/theme";
import type { Categoria } from "../services/categoriaService";
import { listarFornecedores, type Fornecedor } from "../services/fornecedorService";
import {
  desvincularFornecedor,
  vincularFornecedor,
  type ProdutoDetalhe,
  type ProdutoFornecedorVinculo,
} from "../services/produtoService";
import { formatPreco } from "../utils/produtoStatus";
import { messageToasts } from "../utils/messageToasts";
import { confirmDialog } from "../utils/confirmDialog";

export type ProdutoFormValues = {
  nome: string;
  sku: string;
  descricao: string;
  preco: string;
  quantidade: string;
  quantidadeMinima: string;
  tamanhos: string;
  categoriaId: string;
  fornecedorId: string;
};

type ProdutoFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  produtoId?: number | null;
  categorias: Categoria[];
  initial?: ProdutoFormValues | null;
  fornecedoresVinculados?: ProdutoFornecedorVinculo[];
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: ProdutoFormValues) => void;
  onFornecedoresChange?: () => void;
};

const emptyForm: ProdutoFormValues = {
  nome: "",
  sku: "",
  descricao: "",
  preco: "0,00",
  quantidade: "0",
  quantidadeMinima: "10",
  tamanhos: "",
  categoriaId: "",
  fornecedorId: "",
};

const inputClass =
  "w-full rounded-xl border border-[#ECEAF5] bg-[#FAFAFE] px-4 py-3 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:bg-white focus:ring-2 focus:ring-[#3E3B82]/10";

const labelClass =
  "mb-2 block text-[0.6875rem] font-bold uppercase tracking-[0.12em]";

function CloseIcon() {
  return (
    <svg className="size-4" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        fill="currentColor"
        d="M4.28 4.22a.75.75 0 0 1 1.06 0L8 6.88l2.66-2.66a.75.75 0 1 1 1.06 1.06L9.06 8l2.66 2.66a.75.75 0 1 1-1.06 1.06L8 9.06l-2.66 2.66a.75.75 0 1 1-1.06-1.06L6.94 8 4.28 5.34a.75.75 0 0 1 0-1.06Z"
      />
    </svg>
  );
}

export function ProdutoFormModal({
  open,
  mode,
  produtoId,
  categorias,
  initial,
  fornecedoresVinculados = [],
  saving = false,
  onClose,
  onSubmit,
  onFornecedoresChange,
}: ProdutoFormModalProps) {
  const [form, setForm] = useState<ProdutoFormValues>(emptyForm);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [vinculos, setVinculos] = useState<ProdutoFornecedorVinculo[]>([]);
  const [novoFornecedorId, setNovoFornecedorId] = useState("");
  const [novoPrecoCusto, setNovoPrecoCusto] = useState("");
  const [novoPrazo, setNovoPrazo] = useState("");
  const [vinculando, setVinculando] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (initial) {
      setForm(initial);
    } else {
      setForm({
        ...emptyForm,
        categoriaId: categorias[0] ? String(categorias[0].id) : "",
      });
    }

    setVinculos(fornecedoresVinculados);
    setNovoFornecedorId("");
    setNovoPrecoCusto("");
    setNovoPrazo("");
  }, [open, initial, fornecedoresVinculados, categorias]);

  useEffect(() => {
    if (!open) {
      return;
    }

    void listarFornecedores()
      .then(setFornecedores)
      .catch(() => {
        messageToasts.error("Não foi possível carregar fornecedores.");
      });
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving && !vinculando) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, saving, vinculando, onClose]);

  const fornecedoresDisponiveis = useMemo(
    () =>
      fornecedores.filter(
        (item) => !vinculos.some((vinculo) => vinculo.id === item.id),
      ),
    [fornecedores, vinculos],
  );

  const fornecedoresAtivos = useMemo(
    () => fornecedores.filter((item) => item.ativo),
    [fornecedores],
  );

  if (!open) {
    return null;
  }

  const isCreate = mode === "create";
  const title = isCreate ? "Cadastrar produto" : "Editar produto";
  const submitLabel = isCreate ? "Salvar produto" : "Salvar alterações";

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(form);
  }

  async function handleVincular(e: FormEvent) {
    e.preventDefault();
    if (!produtoId || !novoFornecedorId) {
      messageToasts.error("Selecione um fornecedor.");
      return;
    }

    setVinculando(true);
    try {
      const vinculo = await vincularFornecedor(produtoId, {
        fornecedorId: Number(novoFornecedorId),
        precoCusto: novoPrecoCusto.trim()
          ? Number(novoPrecoCusto.replace(",", "."))
          : null,
        prazoEntregaDias: novoPrazo.trim() ? Number(novoPrazo) : null,
      });
      setVinculos((prev) => [...prev, vinculo]);
      setNovoFornecedorId("");
      setNovoPrecoCusto("");
      setNovoPrazo("");
      onFornecedoresChange?.();
      messageToasts.success("Fornecedor vinculado.");
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao vincular fornecedor.",
      );
    } finally {
      setVinculando(false);
    }
  }

  async function handleDesvincular(vinculo: ProdutoFornecedorVinculo) {
    if (!produtoId) {
      return;
    }

    const confirmado = await confirmDialog.open({
      title: "Desvincular fornecedor",
      message: `Remover o vínculo com "${vinculo.nome}"?`,
      confirmLabel: "Desvincular",
      variant: "danger",
    });
    if (!confirmado) {
      return;
    }

    setVinculando(true);
    try {
      await desvincularFornecedor(produtoId, vinculo.id);
      setVinculos((prev) => prev.filter((item) => item.id !== vinculo.id));
      onFornecedoresChange?.();
      messageToasts.success("Fornecedor desvinculado.");
    } catch (err) {
      messageToasts.error(
        err instanceof Error ? err.message : "Erro ao desvincular fornecedor.",
      );
    } finally {
      setVinculando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1B4B]/35 backdrop-blur-[2px]"
        aria-label="Fechar formulário"
        disabled={saving || vinculando}
        onClick={onClose}
      />

      <div
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-[#ECEAF5] bg-white p-6 shadow-[0_20px_60px_rgba(62,59,130,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="produto-form-title"
      >
        <div className="flex items-start justify-between gap-4">
          <h2
            id="produto-form-title"
            className="m-0 font-['Playfair_Display',Georgia,serif] text-xl font-semibold tracking-tight text-neutral-900"
          >
            {title}
          </h2>
          <button
            type="button"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-400 transition hover:bg-[#FAFAFE] hover:text-neutral-700"
            aria-label="Fechar"
            disabled={saving || vinculando}
            onClick={onClose}
          >
            <CloseIcon />
          </button>
        </div>

        <form className="mt-6 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <div className="sm:col-span-2">
            <label
              className={labelClass}
              style={{ color: theme.muted }}
              htmlFor="produto-nome"
            >
              Nome do produto
            </label>
            <input
              id="produto-nome"
              className={inputClass}
              placeholder="Ex: Legging Compressão Pro"
              value={form.nome}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nome: e.target.value }))
              }
              disabled={saving}
              required
            />
          </div>

          <div>
            <label
              className={labelClass}
              style={{ color: theme.muted }}
              htmlFor="produto-categoria"
            >
              Categoria
            </label>
            <select
              id="produto-categoria"
              className={inputClass}
              value={form.categoriaId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, categoriaId: e.target.value }))
              }
              disabled={saving || categorias.length === 0}
              required
            >
              <option value="" disabled>
                Selecione…
              </option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.id}>
                  {categoria.nome}
                </option>
              ))}
            </select>
          </div>

          {isCreate ? (
            <div>
              <label
                className={labelClass}
                style={{ color: theme.muted }}
                htmlFor="produto-fornecedor"
              >
                Fornecedor
              </label>
              <select
                id="produto-fornecedor"
                className={inputClass}
                value={form.fornecedorId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    fornecedorId: e.target.value,
                  }))
                }
                disabled={saving || fornecedoresAtivos.length === 0}
              >
                <option value="">Selecione…</option>
                {fornecedoresAtivos.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label
                className={labelClass}
                style={{ color: theme.muted }}
                htmlFor="produto-sku"
              >
                SKU
              </label>
              <input
                id="produto-sku"
                className={inputClass}
                placeholder="#0041"
                value={form.sku}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, sku: e.target.value }))
                }
                disabled={saving}
                required
              />
            </div>
          )}

          <div>
            <label
              className={labelClass}
              style={{ color: theme.muted }}
              htmlFor="produto-preco"
            >
              Preço (R$)
            </label>
            <input
              id="produto-preco"
              className={inputClass}
              inputMode="decimal"
              placeholder="0,00"
              value={form.preco}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, preco: e.target.value }))
              }
              disabled={saving}
              required
            />
          </div>

          <div>
            <label
              className={labelClass}
              style={{ color: theme.muted }}
              htmlFor="produto-quantidade"
            >
              Quantidade
            </label>
            <input
              id="produto-quantidade"
              className={inputClass}
              inputMode="numeric"
              value={form.quantidade}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, quantidade: e.target.value }))
              }
              disabled={saving}
              required
            />
          </div>

          {!isCreate ? (
            <div className="sm:col-span-2">
              <label
                className={labelClass}
                style={{ color: theme.muted }}
                htmlFor="produto-qtd-min"
              >
                Quantidade mínima
              </label>
              <input
                id="produto-qtd-min"
                className={inputClass}
                inputMode="numeric"
                value={form.quantidadeMinima}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    quantidadeMinima: e.target.value,
                  }))
                }
                disabled={saving}
                required
              />
            </div>
          ) : null}

          <div className="sm:col-span-2">
            <label
              className={labelClass}
              style={{ color: theme.muted }}
              htmlFor="produto-tamanhos"
            >
              Tamanhos disponíveis
            </label>
            <input
              id="produto-tamanhos"
              className={inputClass}
              placeholder="P, M, G, GG"
              value={form.tamanhos}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, tamanhos: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          {!isCreate ? (
            <div className="sm:col-span-2">
              <label
                className={labelClass}
                style={{ color: theme.muted }}
                htmlFor="produto-descricao"
              >
                Descrição
              </label>
              <textarea
                id="produto-descricao"
                className={`${inputClass} min-h-[88px] resize-y`}
                value={form.descricao}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, descricao: e.target.value }))
                }
                disabled={saving}
              />
            </div>
          ) : null}

          <div className="mt-2 flex flex-col-reverse gap-2 sm:col-span-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50"
              onClick={onClose}
              disabled={saving || vinculando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
              disabled={saving || vinculando}
            >
              {saving ? "A guardar…" : submitLabel}
            </button>
          </div>
        </form>

        {!isCreate && produtoId ? (
          <section className="mt-8 border-t border-[#F0EEF8] pt-6">
            <h3
              className="m-0 text-sm font-semibold"
              style={{ color: theme.primary }}
            >
              Fornecedores vinculados
            </h3>

            {vinculos.length === 0 ? (
              <p className="mt-3 text-sm text-neutral-500">
                Nenhum fornecedor vinculado a este produto.
              </p>
            ) : (
              <ul className="mt-3 m-0 list-none divide-y divide-[#F0EEF8] p-0">
                {vinculos.map((vinculo) => (
                  <li
                    key={vinculo.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-semibold text-neutral-800">
                        {vinculo.nome}
                      </p>
                      <p className="m-0 mt-0.5 text-xs text-neutral-500">
                        {vinculo.precoCusto !== null
                          ? `Custo ${formatPreco(vinculo.precoCusto)}`
                          : "Sem preço de custo"}
                        {vinculo.prazoEntregaDias !== null
                          ? ` · ${vinculo.prazoEntregaDias} dias`
                          : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 disabled:opacity-50"
                      disabled={vinculando}
                      onClick={() => void handleDesvincular(vinculo)}
                    >
                      Remover
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <form
              className="mt-4 grid gap-3 rounded-xl border border-[#F0EEF8] bg-[#FAFAFE] p-4 sm:grid-cols-2"
              onSubmit={handleVincular}
            >
              <div className="sm:col-span-2">
                <label
                  className={labelClass}
                  style={{ color: theme.muted }}
                  htmlFor="vinculo-fornecedor"
                >
                  Adicionar fornecedor
                </label>
                <select
                  id="vinculo-fornecedor"
                  className={inputClass}
                  value={novoFornecedorId}
                  onChange={(e) => setNovoFornecedorId(e.target.value)}
                  disabled={vinculando || fornecedoresDisponiveis.length === 0}
                >
                  <option value="">
                    {fornecedoresDisponiveis.length === 0
                      ? "Nenhum fornecedor disponível"
                      : "Selecione…"}
                  </option>
                  {fornecedoresDisponiveis.map((fornecedor) => (
                    <option key={fornecedor.id} value={fornecedor.id}>
                      {fornecedor.nome}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className={labelClass}
                  style={{ color: theme.muted }}
                  htmlFor="vinculo-custo"
                >
                  Preço de custo
                </label>
                <input
                  id="vinculo-custo"
                  className={inputClass}
                  inputMode="decimal"
                  value={novoPrecoCusto}
                  onChange={(e) => setNovoPrecoCusto(e.target.value)}
                  disabled={vinculando}
                />
              </div>
              <div>
                <label
                  className={labelClass}
                  style={{ color: theme.muted }}
                  htmlFor="vinculo-prazo"
                >
                  Prazo (dias)
                </label>
                <input
                  id="vinculo-prazo"
                  className={inputClass}
                  inputMode="numeric"
                  value={novoPrazo}
                  onChange={(e) => setNovoPrazo(e.target.value)}
                  disabled={vinculando}
                />
              </div>
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ backgroundColor: theme.primary }}
                  disabled={vinculando || !novoFornecedorId}
                >
                  {vinculando ? "…" : "Vincular fornecedor"}
                </button>
              </div>
            </form>
          </section>
        ) : null}
      </div>
    </div>
  );
}

export function produtoToFormValues(
  produto: ProdutoDetalhe | import("../services/produtoService").Produto,
): ProdutoFormValues {
  const primeiroFornecedor = "fornecedores" in produto ? produto.fornecedores[0] : undefined;

  return {
    nome: produto.nome,
    sku: produto.sku,
    descricao: produto.descricao ?? "",
    preco: produto.preco.toFixed(2).replace(".", ","),
    quantidade: String(produto.quantidade),
    quantidadeMinima: String(produto.quantidadeMinima),
    tamanhos: produto.tamanhos ?? "",
    categoriaId: String(produto.categoriaId),
    fornecedorId: primeiroFornecedor ? String(primeiroFornecedor.id) : "",
  };
}
