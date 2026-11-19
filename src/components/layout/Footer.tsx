"use client";

import React from "react";
import { ExternalLink, FileCode2, Github } from "lucide-react";
import { GITHUB_BUDGET_REPO, GITHUB_CHECKOUT_REPO } from "@/lib/env";
import { useAppStatus } from "@/context/AppStatusContext";
import { PedraMark } from "@/components/brand/ItauBootcampLogo";

export function Footer() {
  const { health } = useAppStatus();

  return (
    <footer className="mt-16 border-t border-[#EAE3DB] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="flex max-w-xl items-start gap-3.5">
            <PedraMark className="mt-0.5 h-9 w-9 shrink-0" />
            <div>
              <p className="font-display text-sm font-extrabold text-[#101828]">
                Projeto de Portfólio • Bootcamp Java &amp; IA — Itaú + DIO
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#667085]">
                Experiência educacional e de portfólio inspirada na linguagem
                visual moderna do ecossistema Itaú, construída para unificar dois
                desafios independentes do Bootcamp em parceria com a DIO. Não é
                um produto oficial do Itaú Unibanco S.A.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
            <a
              href={GITHUB_BUDGET_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE3DB] bg-[#FBF9F6] px-3.5 py-2 text-[#344054] transition hover:border-[#101828] hover:text-[#101828]"
            >
              <Github className="h-3.5 w-3.5" />
              Smart Budget AI
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
            <a
              href={GITHUB_CHECKOUT_REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE3DB] bg-[#FBF9F6] px-3.5 py-2 text-[#344054] transition hover:border-[#101828] hover:text-[#101828]"
            >
              <Github className="h-3.5 w-3.5" />
              Checkout API GoF
              <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
            {health?.budget.swaggerUrl && (
              <a
                href={health.budget.swaggerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#F5D6BE] bg-[#FFF4EC] px-3.5 py-2 text-[#C84A00] transition hover:bg-[#FFEAD9]"
              >
                <FileCode2 className="h-3.5 w-3.5" />
                Swagger Budget
              </a>
            )}
            {health?.checkout.swaggerUrl && (
              <a
                href={health.checkout.swaggerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border border-[#F5D6BE] bg-[#FFF4EC] px-3.5 py-2 text-[#C84A00] transition hover:bg-[#FFEAD9]"
              >
                <FileCode2 className="h-3.5 w-3.5" />
                Swagger Checkout
              </a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
