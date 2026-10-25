import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * Swiss Style Input
 * Rules: NO border-radius, NO shadow, NO ring
 * Border: 1px solid #1e1e1e
 * Focus: border-color → #ff5722 (accent)
 * Error: border-color → #a53a2b
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-bold text-[#555555] tracking-[0.08em] uppercase">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            // Swiss: sharp border, flat background, no radius, no shadow/ring
            'flex h-11 w-full px-4 py-2 text-sm',
            'border border-[#1e1e1e] bg-[#fafafa] text-[#1e1e1e]',
            'font-medium placeholder:text-[#888888] placeholder:font-normal',
            'transition-[border-color] duration-100',
            'focus:outline-none focus:border-[#ff5722]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            error && 'border-[#a53a2b] focus:border-[#a53a2b]',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs font-semibold text-[#a53a2b] mt-0.5 uppercase tracking-wider">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-bold text-[#555555] tracking-[0.08em] uppercase">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full px-4 py-3 text-sm',
            'border border-[#1e1e1e] bg-[#fafafa] text-[#1e1e1e]',
            'font-medium placeholder:text-[#888888] placeholder:font-normal',
            'transition-[border-color] duration-100',
            'focus:outline-none focus:border-[#ff5722]',
            'disabled:cursor-not-allowed disabled:opacity-40',
            'resize-y',
            error && 'border-[#a53a2b] focus:border-[#a53a2b]',
            className
          )}
          {...props}
        />
        {error && (
          <span className="text-xs font-semibold text-[#a53a2b] mt-0.5 uppercase tracking-wider">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
