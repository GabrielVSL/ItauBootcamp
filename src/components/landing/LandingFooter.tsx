import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { GITHUB_BUDGET_REPO, GITHUB_CHECKOUT_REPO } from "@/lib/env";

export function LandingFooter() {
  return (
    <footer className="relative border-t border-[#ECEBE7] bg-white">
      <div className="mx-auto flex max-w-5xl flex-col justify-between gap-6 px-6 py-10 sm:flex-row sm:items-center sm:px-10">
        <div className="flex items-start gap-3">
          <Image
            src="/images/itau-logo.png"
            alt="Logo Itaú"
            width={26}
            height={26}
            className="mt-0.5 h-[26px] w-[26px] shrink-0 object-contain"
          />
          <div>
            <p className="text-[13.5px] font-semibold tracking-[-0.015em] text-[#141413]">
              Bootcamp Itaú + DIO • Java com IA
            </p>
            <p className="mt-0.5 text-[12px] text-[#7A7872]">
              Projeto pessoal de portfólio educacional. Não é um produto oficial
              do Itaú Unibanco S.A.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-5 text-[13px] font-medium text-[#57554F]">
          <Link href="/app" className="transition hover:text-[#141413]">
            Aplicação
          </Link>
          <a
            href={GITHUB_CHECKOUT_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition hover:text-[#141413]"
          >
            checkout-service
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </a>
          <a
            href={GITHUB_BUDGET_REPO}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 transition hover:text-[#141413]"
          >
            finance-ai-service
            <ArrowUpRight className="h-3.5 w-3.5 opacity-60" />
          </a>
        </div>
      </div>
    </footer>
  );
}
