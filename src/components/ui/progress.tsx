import React from 'react';
import { cn } from '../../lib/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  indicatorClassName?: string;
  colorVariant?: 'default' | 'success' | 'warning' | 'danger';
}

export const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value, indicatorClassName, colorVariant = 'default', ...props }, ref) => {
    const clampedValue = Math.min(100, Math.max(0, value));
    
    return (
      <div
        ref={ref}
        className={cn(
          'relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full w-full flex-1 transition-all duration-300 ease-in-out rounded-full',
            colorVariant === 'default' && 'bg-primary',
            colorVariant === 'success' && 'bg-success',
            colorVariant === 'warning' && 'bg-warning',
            colorVariant === 'danger' && 'bg-danger',
            indicatorClassName
          )}
          style={{ transform: `translateX(-${100 - clampedValue}%)` }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';
export default Progress;
