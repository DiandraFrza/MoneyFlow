/** @format */

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirmStore } from "../../store/confirmStore";
import { AlertTriangle, Info, CheckCircle2, X } from "lucide-react";
import { Button } from "../ui/button";

export const ConfirmModal: React.FC = () => {
  const { isOpen, title, message, confirmLabel, cancelLabel, type, onConfirm, onCancel } = useConfirmStore();

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop with premium blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
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
              onClick={onCancel}
              className="absolute right-4 top-4 h-8 w-8 rounded-full bg-slate-50 hover:bg-slate-100 text-text-mutedLight dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-text-mutedDark flex items-center justify-center transition-colors btn-pressable"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Icon & Title */}
            <div className="flex flex-col items-center text-center gap-3 pt-2">
              <div
                className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-soft-sm ${
                  type === "danger"
                    ? "bg-red-50 text-danger dark:bg-red-950/20"
                    : type === "warning"
                    ? "bg-amber-50 text-warning dark:bg-amber-950/20"
                    : type === "success"
                    ? "bg-emerald-50 text-success dark:bg-emerald-950/20"
                    : "bg-blue-50 text-primary dark:bg-blue-950/20"
                }`}
              >
                {type === "danger" || type === "warning" ? (
                  <AlertTriangle className="h-6 w-6" />
                ) : type === "success" ? (
                  <CheckCircle2 className="h-6 w-6" />
                ) : (
                  <Info className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-base font-black text-text-light dark:text-text-dark leading-tight mt-1">{title}</h3>
              <p className="text-xs text-text-mutedLight dark:text-text-mutedDark leading-normal px-2">{message}</p>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <Button variant="outline" onClick={onCancel} className="flex-1 h-11 font-bold text-xs rounded-2xl">
                {cancelLabel}
              </Button>
              <Button
                onClick={onConfirm}
                className={`flex-1 h-11 font-bold text-xs rounded-2xl ${
                  type === "danger"
                    ? "bg-danger hover:bg-danger-hover text-white"
                    : type === "warning"
                    ? "bg-warning hover:bg-warning/90 text-white"
                    : type === "success"
                    ? "bg-success hover:bg-success/90 text-white"
                    : "bg-primary hover:bg-primary-hover text-white"
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
