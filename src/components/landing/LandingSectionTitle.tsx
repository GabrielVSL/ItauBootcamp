import React from "react";

interface LandingSectionTitleProps {
  highlightItems: string[];
  titleLine1: React.ReactNode;
  titleLine2?: React.ReactNode;
  subtitle?: string;
}

/**
 * Título de seção padronizado inspirado na faixa grifada + título centralizado
 * da referência Goobly, adaptado à paleta Itaú.
 */
export function LandingSectionTitle({
  highlightItems,
  titleLine1,
  titleLine2,
  subtitle,
}: LandingSectionTitleProps) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      {/* Faixa marca-texto (highlight strip) */}
      <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 rounded-[6px] bg-[#FFD9BD] px-3 py-1 text-[11.5px] font-medium tracking-[-0.01em] text-[#141413] sm:text-[12px]">
        {highlightItems.map((item, index) => (
          <React.Fragment key={item}>
            <span>{item}</span>
            {index < highlightItems.length - 1 && (
              <span aria-hidden="true" className="text-[#141413]/40">
                •
              </span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Título forte centralizado em preto sólido */}
      <h2 className="mt-4 text-[2rem] font-semibold leading-[1.1] tracking-[-0.04em] text-[#141413] sm:text-[2.65rem] lg:text-[2.95rem]">
        {titleLine1}
        {titleLine2 && (
          <>
            <br />
            {titleLine2}
          </>
        )}
      </h2>

      {subtitle && (
        <p className="mx-auto mt-4 max-w-xl text-[14.5px] leading-[1.65] text-[#66645E] sm:text-[15.5px]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
