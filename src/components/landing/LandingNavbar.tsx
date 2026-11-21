import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

const NAV_LINKS = [
  { href: "#sobre", label: "Sobre" },
  { href: "#projetos", label: "Projetos" },
  { href: "#na-pratica", label: "Na prática" },
];

export function LandingNavbar() {
  return (
    <header id="landing-navbar" className="w-full bg-white">
      <div className="mx-auto flex h-[74px] max-w-[1360px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        {/* Esquerda: Logo Itaú + Bootcamp */}
        <Link
          href="/"
          className="group flex items-center gap-2.5 focus:outline-none"
        >
          <Image
            src="/images/itau-logo.png"
            alt="Logo Itaú"
            width={30}
            height={30}
            priority
            className="h-[30px] w-[30px] object-contain transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-[16px] font-semibold tracking-[-0.025em] text-[#141413]">
            Bootcamp
          </span>
        </Link>

        {/* Centro: Navegação enxuta da landing */}
        <nav
          aria-label="Navegação da página"
          className="hidden items-center gap-8 md:flex"
        >
          {NAV_LINKS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-[13.5px] font-medium tracking-[-0.01em] text-[#57554F] transition-colors hover:text-[#141413]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        {/* Direita: CTA principal único */}
        <div className="flex items-center">
          <Link
            href="/app"
            className="group inline-flex items-center gap-1.5 rounded-full bg-[#FF6200] px-4 py-2 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_8px_20px_-8px_rgba(255,98,0,0.6)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#E05200] hover:shadow-[0_12px_24px_-8px_rgba(255,98,0,0.7)] sm:px-5"
          >
            Acessar Aplicação
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
