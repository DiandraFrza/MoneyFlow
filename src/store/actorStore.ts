/** @format */

import { create } from "zustand";

interface ActorState {
  isOpen: boolean;
  resolveRef: ((value: "user-1" | "user-2" | null) => void) | null;
  prompt: () => Promise<"user-1" | "user-2" | null>;
  selectActor: (actor: "user-1" | "user-2" | null) => void;
}

export const useActorStore = create<ActorState>((set, get) => ({
  isOpen: false,
  resolveRef: null,
  
  prompt: () => {
    return new Promise((resolve) => {
      set({ isOpen: true, resolveRef: resolve });
    });
  },
  
  selectActor: (actor) => {
    const resolve = get().resolveRef;
    if (resolve) resolve(actor);
    set({ isOpen: false, resolveRef: null });
  },
}));

export const usePromptActor = () => {
  const prompt = useActorStore((state) => state.prompt);
  return prompt;
};
