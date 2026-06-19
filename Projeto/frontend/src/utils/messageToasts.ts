export type MessageToastType = "success" | "error" | "info";

export type MessageToast = {
  id: string;
  type: MessageToastType;
  message: string;
};

type Listener = (toasts: MessageToast[]) => void;

const AUTO_DISMISS_MS = 4500;

let toasts: MessageToast[] = [];
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener([...toasts]);
  }
}

function dismiss(id: string) {
  toasts = toasts.filter((toast) => toast.id !== id);
  notify();
}

function push(type: MessageToastType, message: string) {
  const id = crypto.randomUUID();
  toasts = [...toasts, { id, type, message }];
  notify();
  window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
  return id;
}

export const messageToasts = {
  success: (message: string) => push("success", message),
  error: (message: string) => push("error", message),
  info: (message: string) => push("info", message),
  dismiss,
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener([...toasts]);
    return () => {
      listeners.delete(listener);
    };
  },
};
