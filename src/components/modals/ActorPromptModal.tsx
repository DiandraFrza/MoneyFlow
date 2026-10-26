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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => selectActor(null)} className="fixed inset-0 bg-black/60 backdrop-blur-xs" />

          {/* Modal Container */}
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }} transition={{ type: "spring", stiffness: 350, damping: 26 }} className="relative w-full max-w-sm bg-white border border-[#1e1e1e] shadow-xs z-10 overflow-hidden flex flex-col p-6 gap-5">
            {/* Close Button */}
            <button onClick={() => selectActor(null)} className="absolute right-4 top-4 h-8 w-8 border border-[#1e1e1e] bg-white hover:bg-[#f0f0f0] text-[#1e1e1e] flex items-center justify-center transition-colors cursor-pointer">
              <X className="h-4 w-4" />
            </button>

            {/* Title & Description */}
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              <div className="h-12 w-12 border border-[#1e1e1e] bg-[#f4f4f4] flex items-center justify-center text-[#ff5722]">
                <User className="h-6 w-6" />
              </div>
              <h3 className="text-base font-black text-[#1e1e1e] leading-tight mt-1">Konfirmasi Akun Pelaku</h3>
              <p className="text-xs text-[#555555] leading-normal px-2">
                Anda sedang login di <strong>Akun Bersama</strong>. Pilih akun mana yang akan melakukan transaksi/perubahan ini:
              </p>
            </div>

            {/* Account Options */}
            <div className="flex flex-col gap-2.5">
              <button onClick={() => selectActor("user-1")} className="w-full flex items-center justify-between p-3.5 border border-[#1e1e1e] hover:border-[#ff5722] bg-[#fafafa] hover:bg-[#fff7f5] text-left transition-all cursor-pointer group">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-[#1e1e1e] group-hover:text-[#ff5722] transition-colors">Akun 1 (Budi)</span>
                  <span className="text-[10px] text-[#555555]">Saldo dompet Budi akan disesuaikan</span>
                </div>
                <div className="h-6 w-6 border border-[#1e1e1e] bg-[#f4f4f4] text-[#1e1e1e] flex items-center justify-center text-[10px] font-black">A1</div>
              </button>

              <button onClick={() => selectActor("user-2")} className="w-full flex items-center justify-between p-3.5 border border-[#1e1e1e] hover:border-[#ff5722] bg-[#fafafa] hover:bg-[#fff7f5] text-left transition-all cursor-pointer group">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-bold text-[#1e1e1e] group-hover:text-[#ff5722] transition-colors">Akun 2 (Siti)</span>
                  <span className="text-[10px] text-[#555555]">Saldo dompet Siti akan disesuaikan</span>
                </div>
                <div className="h-6 w-6 border border-[#1e1e1e] bg-[#f4f4f4] text-[#1e1e1e] flex items-center justify-center text-[10px] font-black">A2</div>
              </button>
            </div>

            {/* Cancel Button */}
            <Button variant="outline" onClick={() => selectActor(null)} className="h-11 font-bold text-xs w-full">
              Batal
            </Button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
