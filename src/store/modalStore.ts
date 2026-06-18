/** @format */

import { create } from "zustand";

export type ModalMode = "add" | "edit" | "delete" | "view";
export type ModalType = "wallet" | "budget" | "debt" | "recurring" | "profile" | null;

interface ModalState {
  activeModal: ModalType;
  mode: ModalMode;
  selectedId?: string;

  openWalletModal: (mode: ModalMode, id?: string) => void;
  openBudgetModal: (mode: ModalMode, id?: string) => void;
  openDebtModal: (mode: ModalMode, id?: string) => void;
  openRecurringModal: (mode: ModalMode, id?: string) => void;
  openProfileModal: () => void;

  closeModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  activeModal: null,
  mode: "add",
  selectedId: undefined,

  openWalletModal: (mode, id) => set({ activeModal: "wallet", mode, selectedId: id }),
  openBudgetModal: (mode, id) => set({ activeModal: "budget", mode, selectedId: id }),
  openDebtModal: (mode, id) => set({ activeModal: "debt", mode, selectedId: id }),
  openRecurringModal: (mode, id) => set({ activeModal: "recurring", mode, selectedId: id }),
  openProfileModal: () => set({ activeModal: "profile", mode: "edit" }),

  closeModal: () => set({ activeModal: null, selectedId: undefined }),
}));
