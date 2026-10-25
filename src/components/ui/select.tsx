/** @format */

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, Check, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface SelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  onChange?: (e: React.ChangeEvent<HTMLSelectElement> | { target: { value: string; name?: string } }) => void;
  searchable?: boolean;
  placeholder?: string;
}

/**
 * Swiss Style Select (custom searchable dropdown)
 * Rules: NO border-radius, NO shadow, NO backdrop-blur
 * Trigger: 1px solid #1e1e1e border, flat #fafafa
 * Dropdown: 2px solid #1e1e1e border, sharp edges
 * Selected: color-inversion (#1e1e1e bg, white text)
 * Focus: border-color #ff5722
 */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className, label, error, options = [], value, defaultValue, onChange, name, disabled, placeholder = "Pilih...", searchable = true, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const currentValue = value !== undefined ? String(value) : defaultValue !== undefined ? String(defaultValue) : "";
  const selectedOption = useMemo(() => options.find((opt) => opt.value === currentValue), [options, currentValue]);

  // Smart Prefix-Priority Search Ranking
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.trim().toLowerCase();

    return [...options]
      .map((opt) => {
        const text = opt.label.toLowerCase();
        let score = 0;

        if (text === q) score = 100;
        else if (text.startsWith(q)) score = 80;
        else {
          const words = text.split(/[\s()_/-]+/);
          if (words.some((w) => w.startsWith(q))) score = 60;
          else if (text.includes(q)) score = 35;
          else if (opt.value.toLowerCase().includes(q)) score = 15;
        }

        const isAlphaQuery = /^[a-zA-Z]/.test(q);
        const isAlphaText = /^[a-zA-Z]/.test(text);
        if (isAlphaQuery && isAlphaText) score += 5;

        return { opt, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.opt.label.localeCompare(b.opt.label, "id-ID");
      })
      .map((item) => item.opt);
  }, [options, searchQuery]);

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
        setHighlightedIndex(-1);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Auto-focus search when opening
  useEffect(() => {
    if (isOpen && searchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 60);
    }
  }, [isOpen, searchable]);

  const handleSelect = (val: string) => {
    if (disabled) return;
    if (onChange) {
      const syntheticEvent = { target: { value: val, name: name || "" } } as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
    setIsOpen(false);
    setSearchQuery("");
    setHighlightedIndex(-1);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setSearchQuery("");
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].value);
      } else if (filteredOptions.length === 1) {
        handleSelect(filteredOptions[0].value);
      }
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const itemElement = listRef.current.children[highlightedIndex] as HTMLElement;
      if (itemElement) itemElement.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  return (
    <div className="w-full flex flex-col gap-1.5" ref={containerRef} onKeyDown={handleKeyDown}>
      {label && <label className="text-xs font-bold text-[#555555] tracking-[0.08em] uppercase select-none">{label}</label>}

      <div className="relative w-full">
        {/* Swiss Select Trigger - flat, hard border */}
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            if (!disabled) setIsOpen(!isOpen);
          }}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className={cn("group flex h-11 w-full items-center justify-between", "border border-[#1e1e1e] bg-[#fafafa] px-4 py-2 text-sm text-[#1e1e1e]", "font-medium transition-[border-color,background] duration-100", "focus:outline-none focus:border-[#ff5722]", "disabled:cursor-not-allowed disabled:opacity-40 select-none", isOpen && "border-[#ff5722]", error && "border-[#a53a2b]", className)}
        >
          <span className={cn("truncate text-left flex-1", !selectedOption && "text-[#888888] font-normal")}>{selectedOption ? selectedOption.label : placeholder}</span>
          <ChevronDown className={cn("ml-2 h-4 w-4 flex-shrink-0 text-[#555555] transition-transform duration-150", isOpen && "rotate-180 text-[#ff5722]")} />
        </button>

        {/* Hidden select for form compatibility */}
        <select ref={ref} name={name} value={currentValue} onChange={(e) => handleSelect(e.target.value)} disabled={disabled} className="sr-only pointer-events-none" tabIndex={-1} {...props}>
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Swiss Dropdown - sharp 2px border, flat surface, no blur */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-0 z-50 flex flex-col border-2 border-[#1e1e1e] bg-[#fafafa] overflow-hidden animate-in fade-in duration-100">
            {/* Search box */}
            {searchable && options.length > 3 && (
              <div className="p-2 border-b border-[#1e1e1e]">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 h-3.5 w-3.5 text-[#555555] pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setHighlightedIndex(0);
                    }}
                    placeholder="Cari..."
                    className={["h-9 w-full bg-[#f4f4f4] border border-[#1e1e1e] pl-9 pr-8 text-xs text-[#1e1e1e]", "placeholder:text-[#888888] focus:outline-none focus:border-[#ff5722]", "font-medium transition-[border-color] duration-100"].join(" ")}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery("");
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 p-0.5 text-[#555555] hover:text-[#1e1e1e] transition-colors"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Options List */}
            <div ref={listRef} role="listbox" className="max-h-56 overflow-y-auto flex flex-col">
              {filteredOptions.length === 0 ? (
                <div className="py-6 px-4 text-center">
                  <p className="text-xs font-medium text-[#555555]">Tidak ada opsi cocok dengan "{searchQuery}"</p>
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === currentValue;
                  const isHighlighted = idx === highlightedIndex;

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      className={cn(
                        "flex items-center justify-between px-4 py-2.5 text-xs sm:text-sm",
                        "cursor-pointer transition-colors duration-100 select-none border-b border-[#e8e8e8] last:border-b-0",
                        // Selected: full inversion
                        isSelected ? "bg-[#1e1e1e] text-white font-bold" : "text-[#1e1e1e] font-medium",
                        // Hover/highlighted (not selected)
                        isHighlighted && !isSelected && "bg-[#f0f0f0]",
                      )}
                    >
                      <div className="flex items-center gap-2 truncate">
                        {opt.icon && <span className="flex-shrink-0">{opt.icon}</span>}
                        <span className="truncate">{opt.label}</span>
                      </div>
                      {isSelected && <Check className="h-3.5 w-3.5 flex-shrink-0 text-white ml-2" />}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {error && <span className="text-xs font-semibold text-[#a53a2b] mt-0.5 uppercase tracking-wider">{error}</span>}
    </div>
  );
});

Select.displayName = "Select";
export default Select;
