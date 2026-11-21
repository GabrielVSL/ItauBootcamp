"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, Mic, Volume2 } from "lucide-react";

const TOTAL_STEPS = 3;

const WAVE_BARS = [
  { height: 14, delay: "0ms" },
  { height: 26, delay: "110ms" },
  { height: 38, delay: "220ms" },
  { height: 22, delay: "70ms" },
  { height: 44, delay: "180ms" },
  { height: 30, delay: "300ms" },
  { height: 48, delay: "140ms" },
  { height: 24, delay: "260ms" },
  { height: 40, delay: "90ms" },
  { height: 28, delay: "210ms" },
  { height: 18, delay: "330ms" },
];

export function FinanceAiPreviewAnimation() {
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

    const timer = window.setInterval(() => {
      setStep((prev) => (prev + 1) % TOTAL_STEPS);
    }, 3400);

    return () => window.clearInterval(timer);
  }, [inView]);

  const listening = step === 0;
  const updated = step >= 1;
  const replying = step === 2;

  return (
    <div
      ref={containerRef}
      className="relative flex h-[288px] flex-col items-center justify-between px-6 py-7 sm:px-8"
    >
      {/* Glow ambiental */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute left-1/2 top-1/2 h-44 w-44 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl transition-colors duration-700 ${
          replying ? "bg-emerald-500/18" : "bg-[#FF6200]/22"
        }`}
      />

      {/* Saldo grande e limpo no topo */}
      <div className="relative text-center">
        <p className="text-[11px] font-medium tracking-wide text-white/45">
          Saldo
        </p>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-white transition-all duration-500 sm:text-[34px]">
            {updated ? "R$ 3.420" : "R$ 3.488"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-semibold transition-all duration-500 ${
              updated
                ? "translate-y-0 bg-[#FF6200]/20 text-[#FFA066] opacity-100"
                : "translate-y-1 opacity-0"
            }`}
          >
            -R$ 68
          </span>
        </div>
      </div>

      {/* Palco visual central: Orbe de voz + Waveform -> Lançamento -> Áudio */}
      <div className="relative flex flex-col items-center justify-center">
        <div className="flex items-center gap-5">
          {/* Orbe central */}
          <div className="relative flex h-14 w-14 items-center justify-center">
            {(listening || replying) && (
              <span
                aria-hidden="true"
                className={`animate-landing-ripple absolute inset-0 rounded-full ${
                  replying ? "bg-emerald-400/40" : "bg-[#FF6200]/50"
                }`}
              />
            )}
            <div
              className={`relative flex h-14 w-14 items-center justify-center rounded-full transition-all duration-500 ${
                replying
                  ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/40"
                  : listening
                    ? "bg-[#FF6200] text-white shadow-[0_0_32px_-2px_rgba(255,98,0,0.85)]"
                    : "bg-white/10 text-emerald-300 ring-1 ring-white/15"
              }`}
            >
              {replying ? (
                <Volume2 className="h-6 w-6" />
              ) : listening ? (
                <Mic className="h-6 w-6" />
              ) : (
                <Check className="h-6 w-6 stroke-[2.5]" />
              )}
            </div>
          </div>

          {/* Waveform viva */}
          <div
            aria-hidden="true"
            className="flex h-12 items-center gap-[4px]"
          >
            {WAVE_BARS.map((bar, i) => (
              <span
                key={i}
                style={{
                  height: `${Math.round(bar.height * (listening || replying ? 0.95 : 0.25))}px`,
                  animationDelay: bar.delay,
                }}
                className={`w-[3px] rounded-full transition-all duration-500 ${
                  replying
                    ? "animate-landing-wave bg-emerald-400"
                    : listening
                      ? "animate-landing-wave bg-[#FF6200]"
                      : "bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Legenda mínima de 3–4 palavras */}
        <div className="mt-5 h-7">
          <span
            className={`inline-flex items-center rounded-full border px-3.5 py-1 text-[12px] font-medium transition-all duration-400 ${
              replying
                ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-200"
                : updated
                  ? "border-[#FF6200]/30 bg-[#FF6200]/15 text-[#FFD2B3]"
                  : "border-white/10 bg-white/[0.05] text-white/75"
            }`}
          >
            {replying
              ? "Resposta em áudio · R$ 3.420"
              : updated
                ? "Almoço lançado · -R$ 68"
                : "“Almoço de R$ 68”"}
          </span>
        </div>
      </div>

      {/* 3 pontinhos discretos de navegação */}
      <div className="relative flex items-center gap-2">
        {[0, 1, 2].map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setStep(id)}
            aria-label={`Etapa ${id + 1}`}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              step === id
                ? "w-5 bg-[#FF6200]"
                : "w-1.5 bg-white/20 hover:bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
