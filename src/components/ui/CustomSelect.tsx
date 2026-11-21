"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
}

interface CustomSelectProps<T extends string = string> {
  value: T;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  ariaLabel?: string;
  placeholder?: string;
  className?: string;
  size?: "sm" | "md";
}

export function CustomSelect<T extends string = string>({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "Selecionar",
  className = "",
  size = "md",
}: CustomSelectProps<T>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = options.find((opt) => opt.value === value);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const buttonSizing =
    size === "sm"
      ? "rounded-full px-3.5 py-1.5 text-[12px]"
      : "rounded-xl px-3.5 py-2.5 text-[13px]";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between gap-2.5 border border-[#E5E3DD] bg-white font-medium text-[#141413] transition hover:border-[#C8C5BD] focus:border-[#141413] focus:outline-none ${buttonSizing}`}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-[#7A7872] transition-transform duration-200 ${
            open ? "rotate-180 text-[#141413]" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={ariaLabel}
          className="absolute left-0 z-50 mt-1.5 max-h-60 w-full min-w-[180px] overflow-y-auto rounded-2xl border border-[#EAE9E4] bg-white p-1.5 shadow-[0_18px_44px_-14px_rgba(20,20,19,0.18)]"
        >
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-[12.5px] transition ${
                    active
                      ? "bg-[#FFF3EB] font-semibold text-[#C85A17]"
                      : "font-medium text-[#3F3E3A] hover:bg-[#F5F4F1] hover:text-[#141413]"
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {active && (
                    <Check className="h-3.5 w-3.5 shrink-0 text-[#FF6200]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
