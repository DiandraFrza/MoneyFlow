/** @format */

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../../lib/utils";
import { X } from "lucide-react";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Swiss Style Dialog / Modal
 * Rules:
 * • NO border-radius, NO backdrop-blur, NO shadow
 * • Thick 2px black border outline
 * • Dominant title typography at top
 * • Overlay: semi-transparent black (no blur)
 * • Square close button
 */
export const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children, className }) => {
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

  // Close on Escape press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
          {/* Swiss Backdrop - semi-transparent black, NO blur */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} onClick={onClose} className="fixed inset-0 bg-black/50" />

          {/* Modal Content - sharp borders, flat surface */}
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              // Swiss modal: 2px border, no radius, no shadow, white surface
              "relative w-full sm:max-w-lg bg-[#fafafa]",
              "border-2 border-[#1e1e1e]",
              "z-10 flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden",
              className,
            )}
          >
            {/* Modal Header - dominant title + square close */}
            <div className="flex items-start justify-between px-6 py-5 border-b border-[#1e1e1e] bg-[#f4f4f4]">
              {/* Dominant title - Swiss editorial style */}
              <div>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.12em] text-[#555555] mb-1">MoneyFlow</p>
                <h2 className="text-xl font-bold text-[#1e1e1e] leading-tight tracking-tight">{title}</h2>
              </div>
              {/* Square close button - color inversion on hover */}
              <button onClick={onClose} className={["h-9 w-9 flex items-center justify-center flex-shrink-0 ml-4 mt-0.5", "border border-[#1e1e1e] bg-transparent text-[#1e1e1e]", "hover:bg-[#1e1e1e] hover:text-white", "transition-colors duration-100", "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e1e1e]"].join(" ")} aria-label="Tutup">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default Dialog;
