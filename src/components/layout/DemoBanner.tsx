"use client";

import React from "react";
import { CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { useAppStatus } from "@/context/AppStatusContext";

export function DemoBanner() {
  const {
    allServicesOnline,
    isWakingUp,
    wakeElapsedSeconds,
    demoMode,
    setDemoMode,
    restartWakeup,
  } = useAppStatus();

  if (!demoMode) return null;

  return (
    <div className="border-b border-[#EAE9E4] bg-[#FAF9F7]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[12px] text-[#57554F] sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              allServicesOnline ? "bg-emerald-500" : "bg-[#FF6200]"
            }`}
          />
          <span>
            <strong className="font-semibold text-[#141413]">Modo Demo</strong>{" "}
            — simulação local ativa.
          </span>

          {allServicesOnline ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
              <CheckCircle2 className="h-3 w-3" />
              Servidores reais prontos
            </span>
          ) : isWakingUp ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-0.5 text-[11px] font-medium text-amber-900">
              <Loader2 className="h-3 w-3 animate-spin" />
              Servidores reais iniciando em segundo plano ({wakeElapsedSeconds}s)
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={() => {
            setDemoMode(false);
            if (!allServicesOnline) {
              restartWakeup();
            }
          }}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11.5px] font-semibold transition ${
            allServicesOnline
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "font-medium text-[#141413] underline decoration-[#D4D2CC] underline-offset-4 hover:text-[#FF6200] hover:decoration-[#FF6200]"
          }`}
        >
          <RefreshCw className="h-3 w-3" />
          {allServicesOnline
            ? "Conectar às APIs reais agora"
            : "Acompanhar inicialização"}
        </button>
      </div>
    </div>
  );
}
