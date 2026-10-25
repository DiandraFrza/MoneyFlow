import React, { createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

interface TabsContextType {
  value: string;
  onValueChange: (value: string) => void;
}

const TabsContext = createContext<TabsContextType>({
  value: '',
  onValueChange: () => {},
});

export const useTabsContext = () => useContext(TabsContext);

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <div className={cn('w-full flex flex-col gap-4', className)}>
        {children}
      </div>
    </TabsContext.Provider>
  );
};

interface TabsListProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Swiss Style TabsList
 * Rules: 1px solid #1e1e1e border, flat #f4f4f4, zero rounded, zero blur
 */
export const TabsList: React.FC<TabsListProps> = ({ children, className }) => {
  return (
    <div
      className={cn(
        'flex items-stretch border border-[#1e1e1e] bg-[#f4f4f4] p-0 overflow-x-auto select-none',
        className
      )}
    >
      {children}
    </div>
  );
};

interface TabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Swiss Style TabsTrigger
 * Rules: sharp corners, color-inversion active state (black bg, white text, orange accent border)
 */
export const TabsTrigger: React.FC<TabsTriggerProps> = ({ value, children, className }) => {
  const { value: activeValue, onValueChange } = useTabsContext();
  const active = activeValue === value;

  return (
    <button
      type="button"
      onClick={() => onValueChange(value)}
      className={cn(
        'flex-1 relative inline-flex items-center justify-center gap-2 py-3 px-4 text-xs font-bold uppercase tracking-wider transition-colors duration-100 border-r border-[#1e1e1e] last:border-r-0 cursor-pointer',
        active
          ? 'bg-[#1e1e1e] text-white border-b-2 border-b-[#ff5722]'
          : 'bg-[#f4f4f4] text-[#555555] hover:bg-[#ebebeb] hover:text-[#1e1e1e]',
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
}

export const TabsContent: React.FC<TabsContentProps> = ({ value, children, className }) => {
  const { value: activeValue } = useTabsContext();
  if (value !== activeValue) return null;
  return <div className={cn('w-full animate-fade-in', className)}>{children}</div>;
};
