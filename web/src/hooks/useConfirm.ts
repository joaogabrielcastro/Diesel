import { create } from "zustand";

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
}

interface ConfirmStore extends ConfirmState {
  showConfirm: (config: Omit<ConfirmState, "isOpen">) => void;
  hideConfirm: () => void;
  confirm: () => void;
  cancel: () => void;
}

const defaultState: ConfirmState = {
  isOpen: false,
  title: "",
  message: "",
  onConfirm: () => {},
  onCancel: undefined,
  confirmText: "Confirmar",
  cancelText: "Cancelar",
  variant: "info",
};

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  ...defaultState,

  showConfirm: (config) => {
    set({
      isOpen: true,
      ...config,
    });
  },

  hideConfirm: () => {
    set(defaultState);
  },

  confirm: async () => {
    const { onConfirm, hideConfirm } = get();
    await onConfirm();
    hideConfirm();
  },

  cancel: () => {
    const { onCancel, hideConfirm } = get();
    if (onCancel) onCancel();
    hideConfirm();
  },
}));

export const useConfirm = () => {
  const showConfirm = useConfirmStore((state) => state.showConfirm);

  return {
    confirm: (config: Omit<ConfirmState, "isOpen">) =>
      new Promise<boolean>((resolve) => {
        showConfirm({
          ...config,
          onConfirm: async () => {
            await config.onConfirm();
            resolve(true);
          },
          onCancel: () => {
            config.onCancel?.();
            resolve(false);
          },
        });
      }),
  };
};
