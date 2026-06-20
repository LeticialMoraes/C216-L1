import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { theme } from "../constants/theme";
import type { Fornecedor } from "../services/fornecedorService";
import { maskPhone } from "../utils/phoneMask";

export type FornecedorFormValues = {
  nome: string;
  email: string;
  telefone: string;
  ativo: boolean;
};

type FornecedorFormModalProps = {
  open: boolean;
  mode: "create" | "edit";
  initial?: Fornecedor | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (values: FornecedorFormValues) => void;
};

const emptyForm: FornecedorFormValues = {
  nome: "",
  email: "",
  telefone: "",
  ativo: true,
};

const inputClass =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-[#3E3B82] focus:ring-2 focus:ring-[#3E3B82]/10";

const labelClass =
  "mb-1.5 block text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-neutral-500";

export function FornecedorFormModal({
  open,
  mode,
  initial,
  saving = false,
  onClose,
  onSubmit,
}: FornecedorFormModalProps) {
  const [form, setForm] = useState<FornecedorFormValues>(emptyForm);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (mode === "edit" && initial) {
      setForm({
        nome: initial.nome,
        email: initial.email ?? "",
        telefone: maskPhone(initial.telefone ?? ""),
        ativo: initial.ativo,
      });
      return;
    }

    setForm(emptyForm);
  }, [open, mode, initial]);

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

  const title =
    mode === "create" ? "Novo fornecedor" : "Editar fornecedor";
  const submitLabel = mode === "create" ? "Cadastrar" : "Salvar";

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
        aria-labelledby="fornecedor-form-title"
      >
        <h2
          id="fornecedor-form-title"
          className="m-0 font-['Playfair_Display',Georgia,serif] text-xl font-semibold tracking-tight text-neutral-900"
        >
          {title}
        </h2>

        <form className="mt-5 flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <label className={labelClass} htmlFor="fornecedor-nome">
              Nome
            </label>
            <input
              id="fornecedor-nome"
              className={inputClass}
              placeholder="Ex.: FitWear Brasil"
              value={form.nome}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, nome: e.target.value }))
              }
              disabled={saving}
              required
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="fornecedor-email">
              E-mail
            </label>
            <input
              id="fornecedor-email"
              type="email"
              className={inputClass}
              placeholder="contato@empresa.com"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              disabled={saving}
            />
          </div>

          <div>
            <label className={labelClass} htmlFor="fornecedor-telefone">
              Telefone
            </label>
            <input
              id="fornecedor-telefone"
              type="tel"
              className={inputClass}
              placeholder="(11) 99999-8888"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={15}
              value={form.telefone}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  telefone: maskPhone(e.target.value),
                }))
              }
              disabled={saving}
            />
          </div>

          {mode === "edit" && (
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#F0EEF8] bg-[#FAFAFE] px-4 py-3">
              <div>
                <span
                  className="block text-sm font-semibold"
                  style={{ color: theme.primary }}
                >
                  Fornecedor ativo
                </span>
                <span className="mt-0.5 block text-xs text-neutral-500">
                  Inativar em vez de excluir quando houver vínculos
                </span>
              </div>
              <input
                type="checkbox"
                className="size-5 accent-[#3E3B82]"
                checked={form.ativo}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, ativo: e.target.checked }))
                }
                disabled={saving}
              />
            </label>
          )}

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
              disabled={saving}
            >
              {saving ? "A guardar…" : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
