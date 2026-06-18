import React from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-text-mutedLight dark:text-text-mutedDark tracking-wide">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-text-light transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-text-dark dark:focus:ring-primary/10',
            error && 'border-danger focus:ring-danger/20 focus:border-danger dark:border-danger',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger font-medium mt-0.5">{error}</span>}
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
          <label className="text-xs font-semibold text-text-mutedLight dark:text-text-mutedDark tracking-wide">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[80px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-text-light transition-all placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-text-dark dark:focus:ring-primary/10',
            error && 'border-danger focus:ring-danger/20 focus:border-danger dark:border-danger',
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-danger font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
