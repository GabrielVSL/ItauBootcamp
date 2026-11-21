import React from "react";
import { Terminal } from "lucide-react";
import { ScrollReveal } from "@/components/landing/ScrollReveal";

export function LandingEditorialIntro() {
  return (
    <section id="sobre" className="relative pb-12 pt-20 sm:pb-16 sm:pt-28">
      <div className="mx-auto max-w-5xl px-6 sm:px-10">
        <ScrollReveal>
          <h2 className="max-w-4xl text-[1.95rem] font-semibold leading-[1.2] tracking-[-0.035em] text-[#141413] sm:text-[2.65rem] lg:text-[3.05rem]">
            Em vez de deixar os projetos do bootcamp isolados em repositórios
            separados,{" "}
            <span
              aria-hidden="true"
              className="mx-1 inline-flex h-8 w-8 -translate-y-1 items-center justify-center rounded-lg bg-[#141413] text-white shadow-sm sm:h-10 sm:w-10"
            >
              <Terminal className="h-4 w-4 sm:h-5 sm:w-5" />
            </span>{" "}
            uni dois backends Java em{" "}
            <span className="text-[#C8C7C2]">
              um único produto — para mostrar na prática como microsserviços
              conversam de verdade.
            </span>
          </h2>
        </ScrollReveal>
      </div>
    </section>
  );
}
