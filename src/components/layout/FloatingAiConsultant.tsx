"use client";

import React, { useEffect } from "react";
import { MessageSquare, Mic } from "lucide-react";
import { useAppStatus } from "@/context/AppStatusContext";
import { AiConsultantPanel } from "@/components/budget/AiConsultantPanel";

export function FloatingAiConsultant() {
  const { aiConsultantOpen, openAiConsultant, closeAiConsultant } =
    useAppStatus();

  useEffect(() => {
    if (!aiConsultantOpen) return undefined;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeAiConsultant();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aiConsultantOpen, closeAiConsultant]);

  return (
    <>
      {/* Painel flutuante do Consultor IA */}
      {aiConsultantOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[calc(100vw-2rem)] max-w-[400px] shadow-[0_28px_80px_-20px_rgba(18,15,23,0.45)] md:bottom-6 md:right-6">
          <AiConsultantPanel compact onClose={closeAiConsultant} />
        </div>
      )}

      {/* CTA flutuante sempre disponível no canto inferior direito */}
      {!aiConsultantOpen && (
        <div className="fixed bottom-20 right-4 z-40 md:bottom-6 md:right-6">
          <button
            type="button"
            onClick={openAiConsultant}
            aria-label="Abrir Consultor IA"
            className="group flex items-center gap-3 rounded-full border border-white/15 bg-[#120F17] py-2 pl-2.5 pr-4 text-left text-white shadow-[0_18px_44px_-12px_rgba(18,15,23,0.55)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1B1722]"
          >
            <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#FF6200] text-white shadow-[0_0_20px_-4px_rgba(255,98,0,0.85)]">
              <Mic className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            </span>
            <div className="leading-tight">
              <p className="flex items-center gap-1.5 text-[13px] font-semibold tracking-[-0.01em] text-white">
                Consultor IA
                <MessageSquare className="h-3 w-3 text-[#FFA066]" />
              </p>
              <p className="text-[11px] text-white/60">Abrir chat ou voz</p>
            </div>
          </button>
        </div>
      )}
    </>
  );
}
