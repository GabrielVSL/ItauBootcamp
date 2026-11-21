"use client";

import React from "react";
import Image from "next/image";
import { FaJava } from "react-icons/fa6";
import { RiOpenaiFill } from "react-icons/ri";
import { SiSpringboot } from "react-icons/si";
import { Grainient } from "@/components/landing/Grainient";
import {
  HERO_HIGHLIGHTS,
  type HeroHighlight,
} from "@/components/landing/LandingData";

function HighlightIcon({ id }: { id: HeroHighlight["id"] }) {
  if (id === "java") {
    return <FaJava className="h-[22px] w-[22px] text-[#FF6200]" aria-hidden="true" />;
  }
  if (id === "spring") {
    return (
      <SiSpringboot className="h-[19px] w-[19px] text-[#FF6200]" aria-hidden="true" />
    );
  }
  return (
    <RiOpenaiFill
      className="h-[21px] w-[21px] text-[#FF6200]"
      aria-hidden="true"
    />
  );
}

/**
 * Curva côncava SVG (inverted corner fillet) de 28x28 para conectar
 * o recorte branco do canto inferior direito à caixa arredondada da Hero.
 */
function ConcaveCorner({ className }: { className: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path d="M28 0L28 28L0 28A28 28 0 0 0 28 0Z" fill="#FFFFFF" />
    </svg>
  );
}

export function LandingHero() {
  return (
    <section className="w-full bg-white pb-6 pt-1 sm:pb-10">
      <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
        {/* Caixa arredondada com Grainient + recorte inferior direito */}
        <div className="relative">
          <div className="relative overflow-hidden rounded-[28px] bg-[#120f17] text-white">
            {/* Fundo interativo WebGL2 Grainient */}
            <div className="absolute inset-0 z-0">
              <Grainient
                colors={["#120f17", "#2a0f0a", "#9a3412", "#f97316", "#fed7aa"]}
                angle={55}
                flow={0.8}
                silk={0.35}
                grainAmount={0.08}
                type="linear"
                bands={1}
                softness={1}
                scale={1}
                speed={1}
                grainSize={1.2}
                grainAnimated
                contrast={1}
                saturation={1}
                variation={0}
                interactive
                stir={1}
                clickSwirl
                intro
                lightMode={false}
              />
            </div>

            {/* Scrim suave apenas para manter contraste nítido da tipografia */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_72%_46%,rgba(18,15,23,0.34)_0%,rgba(18,15,23,0.12)_55%,rgba(18,15,23,0.34)_100%)]"
            />

            {/* Conteúdo da Hero (2 colunas, sem botões duplicados) */}
            <div className="relative z-10 mx-auto flex min-h-[540px] max-w-6xl items-center px-6 py-16 sm:px-12 sm:py-20 lg:min-h-[600px] lg:pb-36 lg:pt-20">
              <div className="grid w-full grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
                {/* Esquerda: Logo oficial Itaú */}
                <div className="flex justify-center lg:col-span-5 lg:justify-start">
                  <div className="group relative">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-5 rounded-[56px] bg-[#FF6200]/20 opacity-70 blur-3xl transition duration-500 group-hover:opacity-95"
                    />
                    <Image
                      src="/images/itau-logo.png"
                      alt="Logo Itaú"
                      width={284}
                      height={284}
                      priority
                      className="relative h-40 w-40 select-none object-contain drop-shadow-[0_28px_56px_rgba(0,0,0,0.52)] transition-transform duration-500 ease-out group-hover:-translate-y-1 sm:h-52 sm:w-52 lg:h-[264px] lg:w-[264px]"
                    />
                  </div>
                </div>

                {/* Direita: Título direto, descrição curta e stack discreta */}
                <div className="flex flex-col items-center text-center lg:col-span-7 lg:items-start lg:text-left">
                  <h1 className="text-[2.5rem] font-semibold leading-[1.03] tracking-[-0.04em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.2)] sm:text-[3.4rem] lg:text-[4rem]">
                    Bootcamp Itaú
                    <br />
                    Java com IA
                  </h1>

                  <p className="mt-5 max-w-lg text-[15.5px] font-normal leading-[1.6] tracking-[-0.01em] text-white/85 drop-shadow-[0_1px_10px_rgba(0,0,0,0.24)] sm:text-[17.5px]">
                    Projeto de portfólio onde uni dois microsserviços Spring Boot
                    — checkout com Design Patterns e controle financeiro com IA
                    por voz.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Recorte branco fora do overflow-hidden para 0px de subpixel bleed no canto */}
          <div className="pointer-events-auto relative z-20 hidden lg:block">
            <div className="absolute -bottom-px -right-px rounded-tl-[28px] bg-white pb-2.5 pl-8 pr-6 pt-6 text-[#141413]">
              {/* Curva côncava acima do recorte (borda direita) */}
              <ConcaveCorner className="pointer-events-none absolute -top-[27px] right-0" />
              {/* Curva côncava à esquerda do recorte (borda inferior) */}
              <ConcaveCorner className="pointer-events-none absolute bottom-0 -left-[27px]" />

              <div className="grid grid-cols-3 gap-7">
                {HERO_HIGHLIGHTS.map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EB]">
                      <HighlightIcon id={item.id} />
                    </span>
                    <div className="min-w-0">
                      <p className="whitespace-nowrap text-[14.5px] font-semibold leading-tight tracking-[-0.02em] text-[#141413]">
                        {item.title}
                      </p>
                      <p className="mt-1 whitespace-nowrap text-[12px] text-[#6E6C66]">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Versão mobile/tablet dos 3 destaques logo abaixo da caixa */}
          <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-[#ECEAE5] bg-white p-4 sm:grid-cols-3 lg:hidden">
            {HERO_HIGHLIGHTS.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF3EB]">
                  <HighlightIcon id={item.id} />
                </span>
                <div className="min-w-0">
                  <p className="text-[14px] font-semibold leading-tight tracking-[-0.02em] text-[#141413]">
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-[12px] text-[#6E6C66]">
                    {item.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
