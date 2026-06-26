import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { theme } from "../constants/theme";
import type { Produto } from "../services/produtoService";
import type { MovimentacaoTipo } from "../services/movimentacaoService";

export type MovimentacaoFormValues = {
  produtoId: string;
  tipo: MovimentacaoTipo | "";
  quantidade: string;
  observacao: string;
};

type MovimentacaoFormModalProps = {
  open: boolean;
  produtos: Produto[];
  loadingProdutos?: boolean;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: MovimentacaoFormValues) => void;
};

const emptyForm: MovimentacaoFormValues = {
  produtoId: "",
  tipo: "",
  quantidade: "",
  observacao: "",
};

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/10";

const labelClass =
  "mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-neutral-500";

export function MovimentacaoFormModal({
  open,
  produtos,
  loadingProdutos = false,
  saving = false,
  onClose,
  onSubmit,
}: MovimentacaoFormModalProps) {
  const [form, setForm] = useState<MovimentacaoFormValues>(emptyForm);

  useEffect(() => {
    if (!open) {
      return;
    }
    setForm(emptyForm);
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !saving) {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, saving, onClose]);

  if (!open) {
    return null;
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit(form);
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
        disabled={saving}
        onClick={onClose}
      />

      <div
        className="relative w-full max-w-lg rounded-2xl border border-[#ECEAF5] bg-white p-6 shadow-[0_20px_60px_rgba(62,59,130,0.18)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="movimentacao-form-title"
      >
        <h2
          id="movimentacao-form-title"
          className="m-0 font-['Playfair_Display',Georgia,serif] text-xl font-semibold tracking-tight text-neutral-900"
        >
          Registrar movimentação
        </h2>

        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass} htmlFor="movimentacao-produto">
              Produto
            </label>
            <select
              id="movimentacao-produto"
              className={inputClass}
              value={form.produtoId}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, produtoId: e.target.value }))
              }
              disabled={saving || loadingProdutos}
              required
            >
              <option value="">
                {loadingProdutos
                  ? "A carregar produtos…"
                  : "Selecione um produto"}
              </option>
              {produtos.map((produto) => (
                <option key={produto.id} value={String(produto.id)}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="movimentacao-tipo">
              Tipo
            </label>
            <select
              id="movimentacao-tipo"
              className={inputClass}
              value={form.tipo}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  tipo: e.target.value as MovimentacaoTipo | "",
                }))
              }
              disabled={saving}
              required
            >
              <option value="">Selecione o tipo</option>
              <option value="entrada">Entrada</option>
              <option value="saida">Saída</option>
            </select>
          </div>

          <div>
            <label className={labelClass} htmlFor="movimentacao-quantidade">
              Quantidade
            </label>
            <input
              id="movimentacao-quantidade"
              type="number"
              min={1}
              className={inputClass}
              placeholder="Ex.: 10"
              value={form.quantidade}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, quantidade: e.target.value }))
              }
              disabled={saving}
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="movimentacao-observacao">
              Observação
            </label>
            <input
              id="movimentacao-observacao"
              type="text"
              className={inputClass}
              placeholder="Opcional"
              value={form.observacao}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, observacao: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div className="mt-2 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 disabled:opacity-50"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
              style={{ backgroundColor: theme.primary }}
              disabled={saving || loadingProdutos}
            >
              {saving ? "A guardar…" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
