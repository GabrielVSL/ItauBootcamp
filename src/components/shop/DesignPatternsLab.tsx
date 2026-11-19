"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  FlaskConical,
  Loader2,
  Play,
  Terminal,
} from "lucide-react";
import {
  DESIGN_PATTERN_SCENARIOS,
  type DesignPatternScenario,
} from "@/lib/catalog";
import { useAppStatus } from "@/context/AppStatusContext";
import { executeDemoCheckout } from "@/lib/demo-store";

interface LabExecutionResult {
  scenario: DesignPatternScenario;
  status: number;
  responseJson: unknown;
  executedAt: string;
}

export function DesignPatternsLab() {
  const { demoMode } = useAppStatus();
  const [open, setOpen] = useState(false);
  const [runningId, setRunningId] = useState<string | null>(null);
  const [result, setResult] = useState<LabExecutionResult | null>(null);

  async function runScenario(scenario: DesignPatternScenario) {
    setRunningId(scenario.id);
    try {
      if (demoMode) {
        const simulated = executeDemoCheckout(scenario.payload);
        setResult({
          scenario,
          status: simulated.ok ? 201 : simulated.error.status,
          responseJson: simulated.ok ? simulated.data : simulated.error,
          executedAt: new Date().toLocaleTimeString("pt-BR"),
        });
        return;
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scenario.payload),
      });
      const json = await res.json();
      setResult({
        scenario,
        status: res.status,
        responseJson: json,
        executedAt: new Date().toLocaleTimeString("pt-BR"),
      });
    } catch (err) {
      setResult({
        scenario,
        status: 503,
        responseJson: {
          error: "Falha de rede",
          message: err instanceof Error ? err.message : "Erro desconhecido",
        },
        executedAt: new Date().toLocaleTimeString("pt-BR"),
      });
    } finally {
      setRunningId(null);
    }
  }

  return (
    <section className="overflow-hidden rounded-[28px] border border-[#EAE3DB] bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 bg-[#0D1528] px-6 py-5 text-left text-white transition hover:brightness-110"
      >
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#FF6200] text-white shadow-md shadow-[#FF6200]/30">
            <FlaskConical className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-sm font-extrabold sm:text-base">
                Laboratório de Design Patterns (GoF)
              </h2>
              <span className="rounded-full bg-[#FF6200]/20 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-[#FF9A44]">
                Cenários 422 Reais
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-300">
              Dispare validações reais de Strategy e Chain of Responsibility com
              1 clique e inspecione o JSON normalizado pelo BFF.
            </p>
          </div>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
          {open ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </span>
      </button>

      {open && (
        <div className="space-y-5 p-6">
          <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2 lg:grid-cols-3">
            {DESIGN_PATTERN_SCENARIOS.map((scenario) => {
              const isRunning = runningId === scenario.id;
              return (
                <div
                  key={scenario.id}
                  className="flex flex-col justify-between rounded-2xl border border-[#EAE3DB] bg-[#FBF9F6] p-4"
                >
                  <div>
                    <span className="inline-block rounded-full bg-[#FFF4EC] px-2.5 py-0.5 text-[10px] font-extrabold text-[#E05200]">
                      {scenario.pattern}
                    </span>
                    <h3 className="mt-2 font-display text-xs font-extrabold text-[#101828]">
                      {scenario.title}
                    </h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#525D73]">
                      {scenario.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={runningId !== null}
                    onClick={() => void runScenario(scenario)}
                    className="mt-3.5 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#101828] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#FF6200] disabled:opacity-60"
                  >
                    {isRunning ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    Disparar POST (HTTP {scenario.expectedStatus})
                  </button>
                </div>
              );
            })}
          </div>

          {result && (
            <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0A101E] text-slate-100">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 bg-[#101828] px-4 py-3 text-xs">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-[#FF6200]" />
                  <span className="font-bold">{result.scenario.title}</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-orange-200">
                    {result.scenario.pattern}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold ${
                      result.status === 422
                        ? "bg-amber-500/20 text-amber-300"
                        : result.status >= 200 && result.status < 300
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-rose-500/20 text-rose-300"
                    }`}
                  >
                    HTTP {result.status}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {result.executedAt}
                  </span>
                </div>
              </div>
              <pre className="max-h-72 overflow-auto p-4 font-mono text-xs leading-relaxed text-emerald-200">
                {JSON.stringify(result.responseJson, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
