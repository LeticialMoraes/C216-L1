export type ConfirmDialogOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "danger";
};

type ConfirmState = ConfirmDialogOptions & {
  id: string;
};

type Listener = (state: ConfirmState | null) => void;

let current: ConfirmState | null = null;
let resolvePending: ((value: boolean) => void) | null = null;
const listeners = new Set<Listener>();

function notify() {
  for (const listener of listeners) {
    listener(current);
  }
}

function close(result: boolean) {
  resolvePending?.(result);
  resolvePending = null;
  current = null;
  notify();
}

export const confirmDialog = {
  open(options: ConfirmDialogOptions): Promise<boolean> {
    return new Promise((resolve) => {
      resolvePending?.(false);
      current = {
        ...options,
        id: crypto.randomUUID(),
      };
      resolvePending = resolve;
      notify();
    });
  },
  confirm() {
    close(true);
  },
  cancel() {
    close(false);
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    listener(current);
    return () => {
      listeners.delete(listener);
    };
  },
};
