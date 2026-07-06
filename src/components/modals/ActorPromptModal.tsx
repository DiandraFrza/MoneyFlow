/** @format */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useActorStore } from "../../store/actorStore";
import { User, X } from "lucide-react";
import { Button } from "../ui/button";

export const ActorPromptModal: React.FC = () => {
  const { isOpen, selectActor } = useActorStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => selectActor(null)}
            className="fixed inset-0 bg-slate-950/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 350, damping: 26 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft-xl z-10 overflow-hidden flex flex-col p-6 gap-5"
          >
            {/* Close Button */}
            <button
              onClick={() => selectActor(null)}
              className="absolute right-4 top-4 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-text-mutedLight dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-text-mutedDark flex items-center justify-center transition-colors btn-pressable"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Title & Description */}
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-soft-sm">
                <User className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-text-light dark:text-text-dark leading-tight mt-1">Konfirmasi Akun Pelaku</h3>
              <p className="text-xs text-text-mutedLight dark:text-text-mutedDark leading-normal px-2">
                Anda sedang login di <strong>Akun Bersama</strong>. Pilih akun mana yang akan melakukan transaksi/perubahan ini:
              </p>
            </div>

            {/* Account Options */}
            <div className="flex flex-col gap-2.5">
              <button
                onClick={() => selectActor("user-1")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-primary bg-slate-50/50 hover:bg-primary/5 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-primary/10 text-left transition-all btn-pressable group"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-light dark:text-text-dark group-hover:text-primary transition-colors">Akun 1 (Budi)</span>
                  <span className="text-[10px] text-text-mutedLight dark:text-text-mutedDark">Saldo dompet Budi akan disesuaikan</span>
                </div>
                <div className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-[10px] font-bold">A1</div>
              </button>

              <button
                onClick={() => selectActor("user-2")}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:border-primary bg-slate-50/50 hover:bg-primary/5 dark:border-slate-800 dark:bg-slate-800/40 dark:hover:bg-primary/10 text-left transition-all btn-pressable group"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-text-light dark:text-text-dark group-hover:text-primary transition-colors">Akun 2 (Siti)</span>
                  <span className="text-[10px] text-text-mutedLight dark:text-text-mutedDark">Saldo dompet Siti akan disesuaikan</span>
                </div>
                <div className="h-6 w-6 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center text-[10px] font-bold">A2</div>
              </button>
            </div>

            {/* Cancel Button */}
            <Button variant="outline" onClick={() => selectActor(null)} className="h-11 font-bold text-xs rounded-2xl w-full">
              Batal
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
