/** @format */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirmStore } from "../../store/confirmStore";
import { Button } from "../ui/button";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";

/**
 * Swiss Style Confirm Modal
 * Rules: 2px solid #1e1e1e border, zero blur, zero rounded, sharp buttons
 */
export const ConfirmModal: React.FC = () => {
  const { isOpen, title, message, confirmLabel, cancelLabel, type, onConfirm, onCancel } = useConfirmStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 select-none">
          {/* Backdrop: semi-transparent, no blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50"
          />

          {/* Modal Container: Swiss 2px border, flat #fafafa */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: 10 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="relative w-full max-w-sm bg-[#fafafa] border-2 border-[#1e1e1e] z-10 overflow-hidden flex flex-col p-6 gap-5"
          >
            {/* Square Close Button */}
            <button
              onClick={onCancel}
              className="absolute right-4 top-4 h-7 w-7 border border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon & Title */}
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              <div
                className={`h-12 w-12 border border-[#1e1e1e] flex items-center justify-center ${
                  type === "danger"
                    ? "bg-[#ffffff] text-[#a53a2b]"
                    : type === "warning"
                    ? "bg-[#ffffff] text-[#9a5a21]"
                    : type === "success"
                    ? "bg-[#ffffff] text-[#356342]"
                    : "bg-[#ffffff] text-[#ff5722]"
                }`}
              >
                {type === "danger" || type === "warning" ? (
                  <AlertTriangle className="h-6 w-6 stroke-[2]" />
                ) : type === "success" ? (
                  <CheckCircle2 className="h-6 w-6 stroke-[2]" />
                ) : (
                  <Info className="h-6 w-6 stroke-[2]" />
                )}
              </div>
              <h3 className="text-base font-bold text-[#1e1e1e] leading-tight mt-1 tracking-tight">{title}</h3>
              <p className="text-xs text-[#555555] leading-relaxed px-2 font-medium">{message}</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-2.5">
              <Button variant="outline" onClick={onCancel} className="flex-1 h-10 font-bold text-xs">
                {cancelLabel}
              </Button>
              <Button
                onClick={onConfirm}
                className={`flex-1 h-10 font-bold text-xs ${
                  type === "danger"
                    ? "bg-[#a53a2b] hover:bg-[#1e1e1e] text-white border border-[#a53a2b]"
                    : type === "warning"
                    ? "bg-[#9a5a21] hover:bg-[#1e1e1e] text-white border border-[#9a5a21]"
                    : type === "success"
                    ? "bg-[#356342] hover:bg-[#1e1e1e] text-white border border-[#356342]"
                    : "bg-[#ff5722] hover:bg-[#1e1e1e] text-white border border-[#ff5722]"
                }`}
              >
                {confirmLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
