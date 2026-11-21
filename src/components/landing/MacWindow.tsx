"use client";

import React from "react";

interface MacWindowProps {
  backdropVariant?: "ember" | "dusk";
  children: React.ReactNode;
}

export function MacWindow({
  backdropVariant = "ember",
  children,
}: MacWindowProps) {
  const backdropStyle =
    backdropVariant === "ember"
      ? "bg-[radial-gradient(circle_at_85%_18%,#FED7AA_0%,#F97316_28%,#9A3412_58%,#2A0F0A_82%,#120F17_100%)]"
      : "bg-[radial-gradient(circle_at_15%_18%,#FED7AA_0%,#EA580C_26%,#7C2D12_56%,#1E1419_84%,#120F17_100%)]";

  return (
    /* Palco externo em degradê quente alinhado à Hero */
    <div
      className={`group relative overflow-hidden rounded-[24px] p-4 shadow-[0_24px_60px_-28px_rgba(18,15,23,0.35)] sm:p-7 ${backdropStyle}`}
    >
      {/* Vinheta sutil de profundidade */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(12,10,16,0.35)_100%)]"
      />

      {/* Janela macOS em vidro fosco escuro */}
      <div className="relative overflow-hidden rounded-[14px] border border-white/[0.16] bg-[#0D0D11]/82 text-white shadow-[0_28px_64px_-16px_rgba(0,0,0,0.72),inset_0_1px_0_rgba(255,255,255,0.2)] backdrop-blur-2xl transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-0.5">
        {/* Barra superior minimalista macOS (apenas semáforo) */}
        <div className="flex h-10 items-center border-b border-white/[0.08] bg-white/[0.03] px-4">
          <div className="flex items-center gap-2" aria-hidden="true">
            <span className="h-3 w-3 rounded-full bg-[#FF5F56] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.25)]" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.25)]" />
            <span className="h-3 w-3 rounded-full bg-[#27C93F] shadow-[inset_0_0_0_0.5px_rgba(0,0,0,0.25)]" />
          </div>
        </div>

        {/* Palco animado do produto */}
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
