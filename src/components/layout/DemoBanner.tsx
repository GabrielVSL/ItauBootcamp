"use client";

import React from "react";
import { RefreshCw } from "lucide-react";
import { useAppStatus } from "@/context/AppStatusContext";

export function DemoBanner() {
  const {
    health,
    isChecking,
    isBudgetOnline,
    isCheckoutOnline,
    demoMode,
    setDemoMode,
    refreshHealth,
  } = useAppStatus();

  if (isChecking && !health) return null;
  if (isBudgetOnline && isCheckoutOnline && !demoMode) return null;

  if (demoMode) {
    return (
      <div className="border-b border-[#EAE9E4] bg-[#FAF9F7]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[12px] text-[#57554F] sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#FF6200]" />
            <span>
              <strong className="font-semibold text-[#141413]">Modo Demo</strong>{" "}
              — navegando com simulação local de pedidos, extrato e assistente.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setDemoMode(false);
              void refreshHealth();
            }}
            className="inline-flex items-center gap-1.5 font-medium text-[#141413] underline decoration-[#D4D2CC] underline-offset-4 transition hover:text-[#FF6200] hover:decoration-[#FF6200]"
          >
            <RefreshCw className="h-3 w-3" />
            Conectar APIs reais
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-[#EAE9E4] bg-[#FAF9F7]">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-[12px] text-[#57554F] sm:px-6 lg:px-8">
        <span>Backends Java offline no momento.</span>
        <button
          type="button"
          onClick={() => setDemoMode(true)}
          className="rounded-full bg-[#141413] px-3.5 py-1 text-[11.5px] font-semibold text-white transition hover:bg-[#FF6200]"
        >
          Ativar Modo Demo
        </button>
      </div>
    </div>
  );
}
