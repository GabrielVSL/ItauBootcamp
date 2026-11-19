"use client";

import React from "react";
import Link from "next/link";
import { FlaskConical, Radio, RefreshCw, Sparkles } from "lucide-react";
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
      <div className="border-b border-[#F5D6BE] bg-[#FFF4EC]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2 text-xs sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 text-[#6B2D00]">
            <FlaskConical className="h-4 w-4 shrink-0 text-[#FF6200]" />
            <span>
              <strong>Modo Demo Interativo:</strong> explorando o Super-App com
              simulação local de pedidos GoF (422), extrato e Consultor IA.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setDemoMode(false);
              void refreshHealth();
            }}
            className="rounded-full border border-[#F0C4A3] bg-white px-3.5 py-1 text-[11px] font-bold text-[#9A3D00] transition hover:bg-[#FFEAD9]"
          >
            Reconectar APIs reais
          </button>
        </div>
      </div>
    );
  }

  const offlineList: string[] = [];
  if (!isBudgetOnline) offlineList.push("Smart Budget AI (:8080)");
  if (!isCheckoutOnline) offlineList.push("Checkout API (:8081)");

  return (
    <div className="border-b border-[#EAE3DB] bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 text-xs sm:px-6 lg:px-8">
        <div className="flex items-start gap-2.5 text-[#344054] sm:items-center">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FFF4EC] text-[#FF6200] sm:mt-0">
            <Radio className="h-3.5 w-3.5" />
          </span>
          <span>
            <strong className="text-[#101828]">Backends Java offline:</strong>{" "}
            {offlineList.join(" e ")}. Suba os serviços ou ative o{" "}
            <strong className="text-[#101828]">Modo Demo</strong> para navegar
            agora mesmo.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setDemoMode(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6200] px-3.5 py-1.5 text-[11px] font-bold text-white shadow-xs transition hover:bg-[#E05200]"
          >
            <Sparkles className="h-3 w-3" />
            Ativar Modo Demo
          </button>
          <button
            type="button"
            onClick={() => void refreshHealth()}
            disabled={isChecking}
            className="inline-flex items-center gap-1 rounded-full border border-[#EAE3DB] bg-[#FBF9F6] px-3 py-1.5 text-[11px] font-bold text-[#344054] transition hover:bg-[#F4EFE9]"
          >
            <RefreshCw
              className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`}
            />
            Revalidar
          </button>
          <Link
            href="/architecture"
            className="px-1 text-[11px] font-bold text-[#001E62] hover:underline"
          >
            Configuração →
          </Link>
        </div>
      </div>
    </div>
  );
}
