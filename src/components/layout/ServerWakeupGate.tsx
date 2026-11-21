"use client";

import React from "react";
import {
  CheckCircle2,
  Clock,
  Loader2,
  RefreshCw,
  Server,
  Sparkles,
} from "lucide-react";
import { useAppStatus } from "@/context/AppStatusContext";

interface ServerWakeupGateProps {
  children: React.ReactNode;
}

/**
 * Exibe um painel transparente e profissional de inicialização sob demanda
 * enquanto os microsserviços Java no plano gratuito (Render Free) acordam do cold start.
 * Assim que ambos ficam online (ou se o visitante escolher o Modo Demo), libera o app automaticamente.
 */
export function ServerWakeupGate({ children }: ServerWakeupGateProps) {
  const {
    health,
    hasCheckedOnce,
    isChecking,
    wakeTimedOut,
    wakeElapsedSeconds,
    demoMode,
    setDemoMode,
    restartWakeup,
    isBudgetOnline,
    isCheckoutOnline,
    allServicesOnline,
  } = useAppStatus();

  // Se ambos os serviços estão online ou o usuário optou pelo Modo Demo, renderiza o app normalmente
  if (allServicesOnline || demoMode) {
    return <>{children}</>;
  }

  const onlineCount = (isBudgetOnline ? 1 : 0) + (isCheckoutOnline ? 1 : 0);
  // Progresso visual suave: avança gradualmente com o tempo e salta ao detectar cada serviço pronto
  const timeProgress = Math.min(82, Math.round((wakeElapsedSeconds / 50) * 82));
  const serviceFloor = onlineCount === 1 ? 55 : 12;
  const progressPercent = wakeTimedOut
    ? 100
    : Math.max(serviceFloor, timeProgress);

  const services = [
    {
      key: "budget",
      name: "Smart Budget AI",
      subtitle: "Finanças, PostgreSQL (Neon) e Consultor IA",
      online: isBudgetOnline,
      latencyMs: health?.budget.latencyMs ?? null,
    },
    {
      key: "checkout",
      name: "Checkout API",
      subtitle: "Pedidos, Frete (Strategy) e Validações (Chain)",
      online: isCheckoutOnline,
      latencyMs: health?.checkout.latencyMs ?? null,
    },
  ];

  return (
    <div className="mx-auto flex min-h-[calc(100svh-14rem)] max-w-2xl items-center justify-center py-8">
      <div className="w-full overflow-hidden rounded-[26px] border border-[#EAE9E4] bg-white shadow-[0_24px_70px_-28px_rgba(18,15,23,0.18)]">
        {/* Topo Obsidian */}
        <div className="relative overflow-hidden bg-[#120F17] px-6 py-6 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#FF6200]/25 blur-3xl" />
          <div className="relative flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1 text-[11px] font-semibold tracking-wide text-[#FFA066]">
              {wakeTimedOut ? (
                <Clock className="h-3.5 w-3.5" />
              ) : (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              )}
              {wakeTimedOut
                ? "Demorando mais que o previsto"
                : "Inicializando servidores sob demanda"}
            </span>

            <span className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-white/65">
              <Server className="h-3.5 w-3.5 text-white/50" />
              {onlineCount}/2 online · {wakeElapsedSeconds}s
            </span>
          </div>

          <h1 className="relative mt-4 text-xl font-semibold tracking-[-0.025em] text-white sm:text-2xl">
            {wakeTimedOut
              ? "Os microsserviços ainda estão acordando"
              : "Preparando o ambiente para você..."}
          </h1>

          <p className="relative mt-2 text-[13px] leading-relaxed text-white/75">
            Este é um projeto de portfólio hospedado em{" "}
            <strong className="font-semibold text-white">
              infraestrutura gratuita sob demanda
            </strong>{" "}
            (Render Free + Neon). Por conta das restrições de uso contínuo em
            servidores gratuitos — adotadas pelos provedores para prevenir abuso
            e mineração — não é viável manter múltiplos projetos ativos 24/7. Os
            serviços hibernam quando ociosos e levam cerca de{" "}
            <strong className="font-semibold text-white">
              30 a 50 segundos
            </strong>{" "}
            para iniciar automaticamente.
          </p>
        </div>

        {/* Corpo com status ao vivo de cada microsserviço */}
        <div className="space-y-5 p-6 sm:p-8">
          {/* Barra de progresso */}
          <div>
            <div className="mb-2 flex items-center justify-between text-[11.5px] font-medium text-[#6E6C66]">
              <span>
                {!hasCheckedOnce
                  ? "Enviando sinal de ativação aos containers..."
                  : onlineCount === 1
                    ? "1 microsserviço online — aguardando o segundo finalizar o boot..."
                    : wakeTimedOut
                      ? "Tempo limite de espera atingido — você pode tentar novamente ou usar o Modo Demo."
                      : "Aguardando Spring Boot finalizar a inicialização..."}
              </span>
              <span className="tabular-nums font-semibold text-[#141413]">
                {wakeTimedOut ? "—" : `${progressPercent}%`}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-[#F2F0EC]">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  wakeTimedOut
                    ? "bg-amber-500"
                    : "bg-gradient-to-r from-[#FF6200] to-[#FF8A3D]"
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cards de status por serviço */}
          <div className="grid gap-3 sm:grid-cols-2">
            {services.map((svc) => (
              <div
                key={svc.key}
                className={`flex items-start justify-between gap-3 rounded-2xl border p-4 transition ${
                  svc.online
                    ? "border-emerald-200 bg-emerald-50/50"
                    : "border-[#EAE9E4] bg-[#FAF9F7]"
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-[#141413]">
                    {svc.name}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[#6E6C66]">
                    {svc.subtitle}
                  </p>
                </div>

                {svc.online ? (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-800">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Online
                    {svc.latencyMs !== null ? ` · ${svc.latencyMs}ms` : ""}
                  </span>
                ) : (
                  <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-100/80 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#FF6200]" />
                    Iniciando
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Ações */}
          <div className="flex flex-col-reverse items-stretch justify-between gap-2.5 border-t border-[#F0EFEA] pt-5 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={restartWakeup}
              disabled={isChecking}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#E5E3DD] bg-white px-4 py-2.5 text-xs font-semibold text-[#141413] transition hover:border-[#141413] disabled:opacity-50"
            >
              <RefreshCw
                className={`h-3.5 w-3.5 ${isChecking ? "animate-spin" : ""}`}
              />
              Verificar agora
            </button>

            <button
              type="button"
              onClick={() => setDemoMode(true)}
              className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#141413] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#FF6200]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Explorar em Modo Demo enquanto inicia
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
