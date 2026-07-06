/** @format */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "../../store/toastStore";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0">
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <Info className="h-5 w-5 text-blue-500" />;
          let bgColor = "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/40 text-blue-800 dark:text-blue-200";

          if (toast.type === "success") {
            icon = <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
            bgColor = "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/40 text-emerald-800 dark:text-emerald-200";
          } else if (toast.type === "error") {
            icon = <AlertCircle className="h-5 w-5 text-red-500" />;
            bgColor = "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900/40 text-red-800 dark:text-red-200";
          } else if (toast.type === "warning") {
            icon = <AlertTriangle className="h-5 w-5 text-amber-500" />;
            bgColor = "bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/40 text-amber-800 dark:text-amber-200";
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.9, x: 50 }}
              animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.9, x: 100, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 350, damping: 25 }}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-soft-md backdrop-blur-md ${bgColor}`}
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 text-xs font-bold leading-normal pr-4">{toast.message}</div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity p-0.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
