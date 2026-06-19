import { useEffect, useState } from "react";
import {
  messageToasts,
  type MessageToast,
  type MessageToastType,
} from "../utils/messageToasts";

const toastStyles: Record<
  MessageToastType,
  { border: string; bg: string; text: string; icon: string }
> = {
  success: {
    border: "border-emerald-200",
    bg: "bg-emerald-50",
    text: "text-emerald-900",
    icon: "✓",
  },
  error: {
    border: "border-red-200",
    bg: "bg-red-50",
    text: "text-red-800",
    icon: "!",
  },
  info: {
    border: "border-[#3E3B82]/20",
    bg: "bg-[#F5F5FF]",
    text: "text-[#3E3B82]",
    icon: "i",
  },
};

export function MessageToastContainer() {
  const [items, setItems] = useState<MessageToast[]>([]);

  useEffect(() => messageToasts.subscribe(setItems), []);

  if (items.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:end-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      {items.map((toast) => {
        const style = toastStyles[toast.type];

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_8px_24px_rgba(62,59,130,0.12)] ${style.border} ${style.bg} ${style.text}`}
            role={toast.type === "error" ? "alert" : "status"}
          >
            <span
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-white/80 text-xs font-bold"
              aria-hidden
            >
              {style.icon}
            </span>
            <p className="m-0 flex-1 text-sm leading-snug">{toast.message}</p>
            <button
              type="button"
              className="shrink-0 rounded-md px-1 text-lg leading-none opacity-60 transition hover:opacity-100"
              aria-label="Fechar notificação"
              onClick={() => messageToasts.dismiss(toast.id)}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
