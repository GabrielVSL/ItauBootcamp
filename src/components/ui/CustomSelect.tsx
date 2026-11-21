"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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

interface MenuPosition {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
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
  const [menuPos, setMenuPos] = useState<MenuPosition | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLUListElement | null>(null);

  const selected = options.find((opt) => opt.value === value);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const gap = 6;
    const desiredHeight = Math.min(248, options.length * 38 + 16);
    const spaceBelow = window.innerHeight - rect.bottom - gap - 12;
    const spaceAbove = rect.top - gap - 12;
    const openUpward = spaceBelow < desiredHeight && spaceAbove > spaceBelow;

    const maxHeight = Math.max(
      120,
      Math.min(248, openUpward ? spaceAbove : spaceBelow),
    );
    const width = Math.max(rect.width, 180);
    const left = Math.min(
      Math.max(8, rect.left),
      window.innerWidth - width - 8,
    );
    const top = openUpward
      ? Math.max(8, rect.top - gap - Math.min(desiredHeight, maxHeight))
      : rect.bottom + gap;

    setMenuPos({ top, left, width, maxHeight });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;

    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handleReposition = () => updatePosition();

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("resize", handleReposition);
    window.addEventListener("scroll", handleReposition, true);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("resize", handleReposition);
      window.removeEventListener("scroll", handleReposition, true);
    };
  }, [open, updatePosition]);

  const buttonSizing =
    size === "sm"
      ? "rounded-full px-3.5 py-1.5 text-[12px]"
      : "rounded-xl px-3.5 py-2.5 text-[13px]";

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
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

      {open &&
        menuPos &&
        typeof document !== "undefined" &&
        createPortal(
          <ul
            ref={menuRef}
            role="listbox"
            aria-label={ariaLabel}
            style={{
              position: "fixed",
              top: `${menuPos.top}px`,
              left: `${menuPos.left}px`,
              width: `${menuPos.width}px`,
              maxHeight: `${menuPos.maxHeight}px`,
            }}
            className="z-[90] overflow-y-auto rounded-2xl border border-[#EAE9E4] bg-white p-1.5 shadow-[0_18px_44px_-14px_rgba(20,20,19,0.22)]"
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
          </ul>,
          document.body,
        )}
    </div>
  );
}
