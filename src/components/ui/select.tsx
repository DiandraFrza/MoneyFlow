import React from 'react';
import { cn } from '../../lib/utils';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-text-mutedLight dark:text-text-mutedDark tracking-wide">
            {label}
          </label>
        )}
        <div className="relative w-full">
          <select
            ref={ref}
            className={cn(
              'flex h-11 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-2 pr-10 text-sm text-text-light transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-slate-900/60 dark:text-text-dark dark:focus:ring-primary/10',
              error && 'border-danger focus:ring-danger/20 focus:border-danger dark:border-danger',
              className
            )}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-mutedLight dark:text-text-mutedDark">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {error && <span className="text-xs text-danger font-medium mt-0.5">{error}</span>}
      </div>
    );
  }
);
Select.displayName = 'Select';
export default Select;
