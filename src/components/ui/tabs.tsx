import React from 'react';
import { cn } from '../../lib/utils';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  return (
    <div className={cn('w-full flex flex-col gap-4', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const typedChild = child as React.ReactElement<any>;
          return React.cloneElement(typedChild, {
            value: typedChild.props.value !== undefined ? typedChild.props.value : value,
            activeValue: value,
            onValueChange
          });
        }
        return child;
      })}
    </div>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export const TabsList: React.FC<TabsListProps> = ({ children, className, value, onValueChange }) => {
  return (
    <div className={cn('flex rounded-xl bg-slate-100 p-1 dark:bg-slate-800', className)}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement<{ value: string; active?: boolean; onClick?: () => void }>(child)) {
          return React.cloneElement(child, {
            active: child.props.value === value,
            onClick: () => onValueChange?.(child.props.value)
          });
        }
        return child;
      })}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  onClick?: () => void;
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({ children, className, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 inline-flex items-center justify-center rounded-lg py-2 px-3 text-xs font-semibold transition-all duration-200 text-text-mutedLight dark:text-text-mutedDark select-none btn-pressable',
        active && 'bg-white text-text-light shadow-soft-sm dark:bg-slate-900 dark:text-text-dark',
        className
      )}
    >
      {children}
    </button>
  );
};

interface TabsContentProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  activeValue?: string; // injected
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className, activeValue }) => {
  if (value !== activeValue) return null;
  return <div className={cn('w-full animate-fade-in', className)}>{children}</div>;
};
