import { useEffect, useState } from "react";
import { theme } from "../constants/theme";
import { confirmDialog, type ConfirmDialogOptions } from "../utils/confirmDialog";

type DialogState = ConfirmDialogOptions & { id: string };

export function ConfirmDialogContainer() {
  const [dialog, setDialog] = useState<DialogState | null>(null);

  useEffect(() => confirmDialog.subscribe(setDialog), []);

  useEffect(() => {
    if (!dialog) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        confirmDialog.cancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [dialog]);

  if (!dialog) {
    return null;
  }

  const isDanger = dialog.variant === "danger";
  const confirmLabel = dialog.confirmLabel ?? (isDanger ? "Excluir" : "Confirmar");
  const cancelLabel = dialog.cancelLabel ?? "Cancelar";
  const title = dialog.title ?? "Confirmar ação";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="presentation"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#1E1B4B]/35 backdrop-blur-[2px]"
        aria-label="Fechar diálogo"
        onClick={() => confirmDialog.cancel()}
      />

      <div
        className="relative w-full max-w-md rounded-2xl border border-[#ECEAF5] bg-white p-6 shadow-[0_20px_60px_rgba(62,59,130,0.18)]"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
      >
        <h2
          id="confirm-dialog-title"
          className="m-0 font-['Playfair_Display',Georgia,serif] text-xl font-semibold tracking-tight text-neutral-900"
        >
          {title}
        </h2>
        <p
          id="confirm-dialog-message"
          className="mt-3 m-0 text-sm leading-relaxed text-neutral-600"
        >
          {dialog.message}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
            onClick={() => confirmDialog.cancel()}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            autoFocus
            className="rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-95"
            style={{
              backgroundColor: isDanger ? "#DC2626" : theme.primary,
            }}
            onClick={() => confirmDialog.confirm()}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
