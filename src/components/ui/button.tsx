import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:pointer-events-none btn-pressable',
          // Variants
          variant === 'primary' && 'bg-primary text-white hover:bg-primary-dark shadow-soft-sm',
          variant === 'secondary' && 'bg-slate-100 text-slate-800 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700',
          variant === 'success' && 'bg-success text-white hover:bg-success-dark shadow-soft-sm',
          variant === 'danger' && 'bg-danger text-white hover:bg-danger-dark shadow-soft-sm',
          variant === 'warning' && 'bg-warning text-white hover:bg-warning-dark shadow-soft-sm',
          variant === 'outline' && 'border border-slate-200 bg-transparent hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800 dark:text-slate-200',
          variant === 'ghost' && 'bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-200',
          // Sizes
          size === 'sm' && 'h-9 px-3 text-xs',
          size === 'md' && 'h-11 px-5 text-sm',
          size === 'lg' && 'h-13 px-7 text-base',
          size === 'icon' && 'h-11 w-11 p-0',
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24">
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
  }
);

Button.displayName = 'Button';
