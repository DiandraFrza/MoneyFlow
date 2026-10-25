/** @format */

import React from "react";
import { cn } from "../../lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "success" | "danger" | "warning" | "outline" | "ghost";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
}

/**
 * Swiss Style Button
 * Rules: NO border-radius, NO box-shadow, color-inversion on hover
 * Primary  → #ff5722 solid → hover: #1e1e1e (full inversion)
 * Outline  → transparent + black border → hover: #1e1e1e bg, white text
 * Danger   → #a53a2b solid → hover: #1e1e1e
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", size = "md", loading, children, disabled, ...props }, ref) => {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        // Swiss base - sharp corners, no shadow, font weight
        "inline-flex items-center justify-center font-bold tracking-tight",
        "transition-colors duration-100",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1e1e1e] focus-visible:outline-offset-2",
        "disabled:opacity-40 disabled:pointer-events-none",
        "active:scale-[0.98]",

        // --- Variants ---
        variant === "primary" && ["bg-[#ff5722] text-white border border-[#ff5722]", "hover:bg-[#1e1e1e] hover:border-[#1e1e1e]"],
        variant === "secondary" && ["bg-[#fafafa] text-[#1e1e1e] border border-[#1e1e1e]", "hover:bg-[#1e1e1e] hover:text-white"],
        variant === "success" && ["bg-[#356342] text-white border border-[#356342]", "hover:bg-[#1e1e1e] hover:border-[#1e1e1e]"],
        variant === "danger" && ["bg-[#a53a2b] text-white border border-[#a53a2b]", "hover:bg-[#1e1e1e] hover:border-[#1e1e1e]"],
        variant === "warning" && ["bg-[#9a5a21] text-white border border-[#9a5a21]", "hover:bg-[#1e1e1e] hover:border-[#1e1e1e]"],
        variant === "outline" && ["bg-transparent text-[#1e1e1e] border border-[#1e1e1e]", "hover:bg-[#1e1e1e] hover:text-white"],
        variant === "ghost" && ["bg-transparent text-[#1e1e1e] border border-transparent", "hover:bg-[#f4f4f4] hover:border-[#1e1e1e]"],

        // --- Sizes ---
        size === "sm" && "h-9 px-4 text-xs",
        size === "md" && "h-11 px-5 text-sm",
        size === "lg" && "h-13 px-7 text-base",
        size === "icon" && "h-11 w-11 p-0",

        className,
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
});

Button.displayName = "Button";
