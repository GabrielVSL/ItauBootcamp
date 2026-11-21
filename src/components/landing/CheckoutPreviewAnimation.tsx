"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Laptop, PackageCheck, Tag, Truck } from "lucide-react";

const STEPS = [
  { id: 0, label: "Carrinho", durationMs: 3000 },
  { id: 1, label: "Cupom & Frete", durationMs: 3600 },
  { id: 2, label: "Validação GoF", durationMs: 3600 },
  { id: 3, label: "Confirmado", durationMs: 4400 },
];

export function CheckoutPreviewAnimation() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(0);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries.some((e) => e.isIntersecting)),
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const reduce = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce || !inView) return undefined;

    const timeout = window.setTimeout(() => {
      setStep((prev) => (prev + 1) % STEPS.length);
    }, STEPS[step].durationMs);

    return () => window.clearTimeout(timeout);
  }, [inView, step]);

  const couponApplied = step >= 1;
  const validating = step >= 2;
  const confirmed = step === 3;

  return (
    <div ref={containerRef} className="p-5 sm:p-6">
      {/* Item do carrinho */}
      <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.08] bg-white/[0.04] p-3.5 transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FF6200]/15 text-[#FF8A3D]">
            <Laptop className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[13px] font-semibold text-white">
              Notebook Dev Pro 16&quot;
            </p>
            <p className="text-[11px] text-white/50">1 un. · Em estoque</p>
          </div>
        </div>
        <div className="shrink-0 text-right">
          <p
            className={`text-[13.5px] font-semibold tabular-nums transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              couponApplied ? "text-emerald-300" : "text-white"
            }`}
          >
            {couponApplied ? "R$ 4.401,00" : "R$ 4.890,00"}
          </p>
          <p
            className={`text-[10.5px] tabular-nums transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              couponApplied
                ? "translate-y-0 text-white/40 line-through opacity-100"
                : "translate-y-1 opacity-0"
            }`}
          >
            R$ 4.890,00
          </p>
        </div>
      </div>

      {/* Barra dinâmica de Frete PAC Grátis (Strategy) */}
      <div className="mt-3.5 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
        <div className="flex items-center justify-between text-[11.5px]">
          <span className="inline-flex items-center gap-1.5 text-white/75">
            <Truck className="h-3.5 w-3.5 text-[#FF8A3D]" />
            Frete PAC (Strategy)
          </span>
          <span
            className={`font-medium transition-colors duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              couponApplied ? "text-emerald-400" : "text-white/60"
            }`}
          >
            {couponApplied ? "Grátis · R$ 0,00" : "Calculando..."}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] ${
              couponApplied
                ? "w-full bg-gradient-to-r from-[#FF6200] to-emerald-400"
                : "w-1/3 bg-[#FF6200]"
            }`}
          />
        </div>
      </div>

      {/* Cupom + Cadeia de validação (Chain of Responsibility) */}
      <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-[0.78fr_1.22fr]">
        {/* Cupom animado */}
        <div
          className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            couponApplied
              ? "border-[#FF6200]/40 bg-[#FF6200]/12 text-white"
              : "border-white/[0.07] bg-white/[0.02] text-white/45"
          }`}
        >
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-medium">
            <Tag className="h-3.5 w-3.5 shrink-0 text-[#FFA066]" />
            ITAU10
          </span>
          <span className="shrink-0 font-mono text-[11px] font-semibold text-[#FFA066]">
            {couponApplied ? "-10% ✓" : "—"}
          </span>
        </div>

        {/* Validadores Chain of Responsibility em cascata suave */}
        <div className="flex items-center justify-between gap-1 rounded-xl border border-white/[0.07] bg-white/[0.02] px-2.5 py-2.5">
          {["Estoque", "Limite", "Cupom"].map((rule, idx) => {
            const passed = confirmed || validating;
            return (
              <span
                key={rule}
                style={{ transitionDelay: passed ? `${idx * 240}ms` : "0ms" }}
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  passed
                    ? "bg-emerald-500/15 text-emerald-300"
                    : "bg-white/[0.04] text-white/40"
                }`}
              >
                <Check
                  style={{ transitionDelay: passed ? `${idx * 240}ms` : "0ms" }}
                  className={`h-2.5 w-2.5 shrink-0 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    passed ? "scale-100" : "scale-0"
                  }`}
                />
                {rule}
              </span>
            );
          })}
        </div>
      </div>

      {/* Botão / Estado final confirmado */}
      <div className="mt-4">
        <div
          className={`flex items-center justify-between rounded-xl border px-4 py-3 text-[12.5px] font-semibold transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            confirmed
              ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
              : validating
                ? "border-transparent bg-[#FF6200] text-white shadow-[0_10px_28px_-8px_rgba(255,98,0,0.65)]"
                : "border-transparent bg-white/10 text-white/80"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            {confirmed ? (
              <>
                <PackageCheck className="h-4 w-4 text-emerald-400" />
                Pedido #1042 confirmado
              </>
            ) : validating ? (
              <>Executando CheckoutFacade...</>
            ) : (
              <>Finalizar pedido</>
            )}
          </span>
          <span className="font-mono text-[11px] opacity-85">
            {confirmed ? "201 Created" : "R$ 4.401,00"}
          </span>
        </div>
      </div>

      {/* Indicador discreto e clicável das 4 etapas */}
      <div className="mt-4 flex items-center justify-between border-t border-white/[0.06] pt-3">
        <div className="flex items-center gap-1.5">
          {STEPS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setStep(s.id)}
              aria-label={`Etapa ${s.label}`}
              className={`h-1.5 rounded-full transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                step === s.id
                  ? "w-6 bg-[#FF6200]"
                  : "w-1.5 bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
        <span className="font-mono text-[10.5px] text-white/45 transition-opacity duration-500">
          {STEPS[step].label}
        </span>
      </div>
    </div>
  );
}
