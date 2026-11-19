import React from "react";

interface ItauBootcampLogoProps {
  size?: "sm" | "md" | "lg";
  showSubtitle?: boolean;
  darkSurface?: boolean;
}

/**
 * Símbolo "Pedra" (superelipse orgânica inspirada no rebranding de 100 anos do Itaú)
 * criado especialmente para o projeto de portfólio do Bootcamp Itaú + DIO.
 */
export function PedraMark({
  className = "h-10 w-10",
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Superelipse orgânica ("A Pedra") */}
      <path
        d="M32 3C50.8 3 61 11.4 61 32C61 52.6 50.8 61 32 61C13.2 61 3 52.6 3 32C3 11.4 13.2 3 32 3Z"
        fill={inverted ? "#FFFFFF" : "url(#itauPedraGrad)"}
      />
      <defs>
        <linearGradient
          id="itauPedraGrad"
          x1="8"
          y1="6"
          x2="58"
          y2="60"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#FF7214" />
          <stop offset="0.55" stopColor="#FF6200" />
          <stop offset="1" stopColor="#EC5200" />
        </linearGradient>
      </defs>
      {/* Tipografia geométrica humanista dentro da pedra */}
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fill={inverted ? "#FF6200" : "#FFFFFF"}
        fontFamily="var(--font-jakarta), system-ui, sans-serif"
        fontWeight="800"
        fontSize="21"
        letterSpacing="-0.8"
      >
        itaú
      </text>
      {/* Pequeno ponto/acento editorial no canto inferior */}
      <circle
        cx="49"
        cy="17"
        r="3"
        fill={inverted ? "#001E62" : "#FFF3E8"}
        fillOpacity="0.9"
      />
    </svg>
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
