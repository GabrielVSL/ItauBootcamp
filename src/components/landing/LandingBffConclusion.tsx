"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LandingSectionTitle } from "@/components/landing/LandingSectionTitle";
import { GradientText } from "@/components/landing/GradientText";
import { RotatingText } from "@/components/landing/RotatingText";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

function AnimatedConnector() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-[2px] w-full overflow-hidden rounded-full bg-[#DEDCD6] md:block"
    >
      <span className="animate-landing-flow absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-transparent via-[#FF6200] to-transparent" />
    </div>
  );
}

const ROTATING_FEATURES = [
  "Checkout GoF",
  "IA por Voz",
  "Fluxo BFF",
  "Modo Demo",
];

export function LandingBffConclusion() {
  return (
    <section id="na-pratica" className="relative pb-24 pt-12 sm:pb-32 sm:pt-20">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        {/* Título padronizado com GradientText sutil em "na prática." */}
        <ScrollReveal>
          <LandingSectionTitle
            highlightItems={[
              "Next.js BFF",
              "Database per Service",
              "Zero CORS",
            ]}
            titleLine1="Microsserviços conversando"
            titleLine2={
              <GradientText
                colors={["#FF6200", "#EA580C", "#9A3412", "#FF8A3D"]}
                animationSpeed={6}
              >
                na prática.
              </GradientText>
            }
            subtitle="Os dois serviços rodam isolados com seus próprios bancos PostgreSQL. Este site entra no meio como BFF para que uma compra no checkout vire automaticamente uma despesa no gestor financeiro."
          />
        </ScrollReveal>

        {/* Faixa compacta mostrando o BFF no centro conectando os 2 microsserviços */}
        <ScrollReveal delayMs={60}>
          <div className="mt-12 rounded-2xl border border-[#EAE8E3] bg-[#F5F4F1] p-4 sm:p-5">
            <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-[1fr_40px_1.15fr_40px_1fr] md:gap-2">
              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5 ring-1 ring-[#EAE8E3]">
                <div>
                  <p className="text-[13.5px] font-semibold tracking-[-0.015em] text-[#141413]">
                    checkout-service
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[#7A7872]">
                    Microsserviço Java
                  </p>
                </div>
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>

              <AnimatedConnector />

              <div className="flex items-center justify-between rounded-xl bg-[#141416] px-4 py-3.5 text-white shadow-sm">
                <div>
                  <p className="text-[13.5px] font-semibold tracking-[-0.015em]">
                    Next.js BFF
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-white/60">
                    Orquestra os dois serviços
                  </p>
                </div>
                <span className="rounded-full bg-[#FF6200]/20 px-2 py-0.5 font-mono text-[10px] font-semibold text-[#FFA066]">
                  Zero CORS
                </span>
              </div>

              <AnimatedConnector />

              <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5 ring-1 ring-[#EAE8E3]">
                <div>
                  <p className="text-[13.5px] font-semibold tracking-[-0.015em] text-[#141413]">
                    finance-ai-service
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-[#7A7872]">
                    Microsserviço Java
                  </p>
                </div>
                <span className="h-2 w-2 rounded-full bg-[#FF6200]" />
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* CTA Final compacto, focado e de alto impacto com RotatingText */}
        <ScrollReveal delayMs={110}>
          <div
            id="landing-final-cta"
            className="relative mt-6 overflow-hidden rounded-[24px] bg-[#120F17] px-6 py-12 text-center text-white shadow-[0_26px_64px_-24px_rgba(18,15,23,0.48)] sm:px-12 sm:py-14"
          >
            {/* Brilho quente discreto na base ecoando a Hero */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-24 left-1/2 h-52 w-[460px] -translate-x-1/2 rounded-full bg-[#FF6200]/30 blur-[90px]"
            />

            <div className="relative z-10 mx-auto max-w-2xl">
              <h3 className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-[1.75rem] font-semibold leading-tight tracking-[-0.035em] text-white sm:text-[2.35rem]">
                <span>Experimente agora</span>
                <RotatingText
                  texts={ROTATING_FEATURES}
                  effect="blur"
                  highlight
                  highlightColor="#FF6200"
                  rotationInterval={2600}
                  staggerDuration={0.02}
                  splitBy="characters"
                  mainClassName="font-semibold tracking-[-0.03em]"
                />
              </h3>

              <p className="mx-auto mt-4 max-w-lg text-[14.5px] leading-[1.6] text-white/70 sm:text-[15.5px]">
                Acesse o Super-App direto no navegador — o Modo Demo já vem
                pronto para testar pedidos, erros 422 e extrato mesmo sem subir
                Java localmente.
              </p>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <Link
                  href="/app"
                  className="group inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-4 text-[14.5px] font-semibold tracking-[-0.015em] text-[#120F17] shadow-[0_16px_40px_-10px_rgba(255,255,255,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#FFF3EB]"
                >
                  Acessar Aplicação
                  <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </Link>

                <Link
                  href="/architecture"
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.05] px-5 py-4 text-[13.5px] font-medium text-white/85 transition hover:border-white/30 hover:bg-white/10 hover:text-white"
                >
                  Ver arquitetura
                </Link>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
