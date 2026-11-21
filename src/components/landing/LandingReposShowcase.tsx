"use client";

import React from "react";
import { ArrowUpRight, Github } from "lucide-react";
import { MacWindow } from "@/components/landing/MacWindow";
import { CheckoutPreviewAnimation } from "@/components/landing/CheckoutPreviewAnimation";
import { FinanceAiPreviewAnimation } from "@/components/landing/FinanceAiPreviewAnimation";
import { LandingSectionTitle } from "@/components/landing/LandingSectionTitle";
import { ScrollReveal } from "@/components/landing/ScrollReveal";
import { GITHUB_BUDGET_REPO, GITHUB_CHECKOUT_REPO } from "@/lib/env";

export function LandingReposShowcase() {
  return (
    <section id="projetos" className="relative py-16 sm:py-24">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        {/* Título de seção padronizado com faixa grifada */}
        <ScrollReveal className="mb-16 sm:mb-24">
          <LandingSectionTitle
            highlightItems={[
              "Java 21",
              "Spring Boot",
              "Design Patterns",
              "Spring AI",
            ]}
            titleLine1="Dois serviços independentes."
            titleLine2="Duas responsabilidades."
          />
        </ScrollReveal>

        <div className="space-y-24 sm:space-y-32">
          {/* Bloco 1: API de Pedidos & Checkout + Animação ao vivo à direita */}
          <ScrollReveal>
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="lg:col-span-5">
                <h3 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.035em] text-[#141413] sm:text-[2.15rem]">
                  API de Pedidos &amp; Checkout
                </h3>
                <p className="mt-4 text-[15px] leading-[1.68] text-[#5E5C56]">
                  Construí este backend em Java 21 e Spring Boot para aplicar{" "}
                  <span className="text-[#141413]">
                    Facade, Strategy e Chain of Responsibility
                  </span>{" "}
                  em regras reais de e-commerce — cálculo de frete, estoque,
                  cupons e validações HTTP 422 com banco PostgreSQL próprio.
                </p>

                <div className="mt-6">
                  <a
                    href={GITHUB_CHECKOUT_REPO}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-[#E5E3DD] bg-white px-4 py-2 text-[13px] font-medium text-[#141413] transition hover:border-[#141413] hover:bg-[#FAF9F7]"
                  >
                    <Github className="h-4 w-4 text-[#141413]" />
                    <span>checkout-service</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#8A8882] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#141413]" />
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7">
                <MacWindow backdropVariant="ember">
                  <CheckoutPreviewAnimation />
                </MacWindow>
              </div>
            </div>
          </ScrollReveal>

          {/* Bloco 2: Animação ao vivo à esquerda + Gestor Financeiro com IA à direita */}
          <ScrollReveal delayMs={60}>
            <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
              <div className="order-2 lg:order-1 lg:col-span-7">
                <MacWindow backdropVariant="dusk">
                  <FinanceAiPreviewAnimation />
                </MacWindow>
              </div>

              <div className="order-1 lg:order-2 lg:col-span-5">
                <h3 className="text-[1.75rem] font-semibold leading-[1.15] tracking-[-0.035em] text-[#141413] sm:text-[2.15rem]">
                  Gestor Financeiro com IA
                </h3>
                <p className="mt-4 text-[15px] leading-[1.68] text-[#5E5C56]">
                  Criei uma API de finanças pessoais com Spring AI onde o
                  assistente ouve comandos de voz via{" "}
                  <span className="text-[#141413]">Whisper STT</span>, consulta
                  e lança movimentações direto no banco com{" "}
                  <span className="text-[#141413]">Tool Calling</span> e
                  responde em áudio.
                </p>

                <div className="mt-6">
                  <a
                    href={GITHUB_BUDGET_REPO}
                    target="_blank"
                    rel="noreferrer"
                    className="group inline-flex items-center gap-2 rounded-full border border-[#E5E3DD] bg-white px-4 py-2 text-[13px] font-medium text-[#141413] transition hover:border-[#141413] hover:bg-[#FAF9F7]"
                  >
                    <Github className="h-4 w-4 text-[#141413]" />
                    <span>finance-ai-service</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-[#8A8882] transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[#141413]" />
                  </a>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
