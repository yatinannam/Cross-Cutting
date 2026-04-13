"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export default function Dropdown({
  value,
  onChange,
  options,
  label,
  disabled = false,
  className = "",
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label || "Select an option";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [open]);

  const handleSelect = (optionValue: string) => {
    onChange(optionValue);
    setOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <label className="text-xs font-semibold uppercase text-slate-500 block mb-1.5">
          {label}
        </label>
      )}
      <button
        ref={buttonRef}
        onClick={() => !disabled && setOpen(!open)}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 text-left flex items-center justify-between transition-all focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        <span>{displayLabel}</span>
        <ChevronDown
          className={`w-4 h-4 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          <ul className="max-h-64 overflow-y-auto">
            {options.map((option) => (
              <li key={option.value}>
                <button
                  onClick={() => handleSelect(option.value)}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors ${
                    value === option.value
                      ? "bg-blue-50 text-primary font-medium"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {option.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
