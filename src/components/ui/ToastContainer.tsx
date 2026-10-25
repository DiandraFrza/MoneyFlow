/** @format */

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useToastStore } from "../../store/toastStore";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";

/**
 * Swiss Style Toast Notification Container
 * Rules:
 * • 2px solid #1e1e1e border
 * • Zero border radius, zero backdrop-blur
 * • Space Grotesk typography, high-contrast black text
 * • Color status badge with Swiss border
 */
export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 w-full max-w-sm pointer-events-none px-4 sm:px-0 select-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          let icon = <Info className="h-4 w-4 text-[#ff5722]" />;
          let statusBadge = "INFO";
          let badgeBorder = "border-[#ff5722] text-[#ff5722]";

          if (toast.type === "success") {
            icon = <CheckCircle2 className="h-4 w-4 text-[#356342]" />;
            statusBadge = "SUKSES";
            badgeBorder = "border-[#356342] text-[#356342]";
          } else if (toast.type === "error") {
            icon = <AlertCircle className="h-4 w-4 text-[#a53a2b]" />;
            statusBadge = "GAGAL";
            badgeBorder = "border-[#a53a2b] text-[#a53a2b]";
          } else if (toast.type === "warning") {
            icon = <AlertTriangle className="h-4 w-4 text-[#9a5a21]" />;
            statusBadge = "PERINGATAN";
            badgeBorder = "border-[#9a5a21] text-[#9a5a21]";
          }

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -16, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, x: 50, transition: { duration: 0.15 } }}
              transition={{ duration: 0.18, ease: "easeOut" }}
              className="pointer-events-auto flex items-start gap-3 p-3.5 bg-[#fafafa] border-2 border-[#1e1e1e] text-[#1e1e1e]"
            >
              <div className="shrink-0 mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 border ${badgeBorder}`}>
                    {statusBadge}
                  </span>
                </div>
                <p className="text-xs font-bold leading-snug text-[#1e1e1e]">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="shrink-0 h-6 w-6 border border-[#1e1e1e] bg-[#ffffff] text-[#1e1e1e] hover:bg-[#1e1e1e] hover:text-white flex items-center justify-center transition-colors"
                aria-label="Tutup notifikasi"
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
