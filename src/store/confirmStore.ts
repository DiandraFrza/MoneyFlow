/** @format */

import { create } from "zustand";

interface ConfirmOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: "danger" | "warning" | "info" | "success";
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  type: "danger" | "warning" | "info" | "success";
  resolveRef: ((value: boolean) => void) | null;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
  onConfirm: () => void;
  onCancel: () => void;
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  isOpen: false,
  title: "",
  message: "",
  confirmLabel: "Ya",
  cancelLabel: "Batal",
  type: "danger",
  resolveRef: null,

  confirm: (options) => {
    return new Promise<boolean>((resolve) => {
      set({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmLabel: options.confirmLabel || "Ya, Lanjutkan",
        cancelLabel: options.cancelLabel || "Batal",
        type: options.type || "danger",
        resolveRef: resolve,
      });
    });
  },

  onConfirm: () => {
    const resolve = get().resolveRef;
    if (resolve) resolve(true);
    set({ isOpen: false, resolveRef: null });
  },

  onCancel: () => {
    const resolve = get().resolveRef;
    if (resolve) resolve(false);
    set({ isOpen: false, resolveRef: null });
  },
}));

// Reusable hook helper
export const useConfirm = () => {
  const confirm = useConfirmStore((state) => state.confirm);
  return confirm;
};
