import React from "react";
import Image from "next/image";

interface ItauBootcampLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  darkSurface?: boolean;
}

/**
 * Símbolo oficial do Itaú (public/images/itau-logo.png) reutilizado
 * no cabeçalho, rodapé e cards do portal.
 */
export function PedraMark({
  className = "h-10 w-10",
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <Image
      src="/images/itau-logo.png"
      alt="Logo Itaú"
      width={80}
      height={80}
      className={`${className} object-contain`}
    />
  );
}

export function ItauBootcampLogo({
  size = "md",
  showSubtitle = true,
  darkSurface = false,
}: ItauBootcampLogoProps) {
  const iconSize =
    size === "sm" ? "h-9 w-9" : size === "lg" ? "h-12 w-12" : "h-10 w-10";

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0 drop-shadow-sm">
        <PedraMark className={iconSize} />
      </div>

      <div className="leading-none">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-display text-base font-extrabold tracking-tight sm:text-[17px] ${
              darkSurface ? "text-white" : "text-[#101828]"
            }`}
          >
            Super-App
          </span>
          <span className="inline-flex items-center rounded-full bg-[#FF6200]/12 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#E05200]">
            Bootcamp • DIO
          </span>
        </div>
        {showSubtitle && (
          <span
            className={`mt-1 block text-[11px] font-medium ${
              darkSurface ? "text-slate-300" : "text-[#667085]"
            }`}
          >
            Shop GoF &amp; Smart Budget AI
          </span>
        )}
      </div>
    </div>
  );
}
