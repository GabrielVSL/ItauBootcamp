"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * Botão flutuante que acompanha o scroll após a Navbar sair da tela
 * e desaparece suavemente assim que o CTA final entra em vista.
 */
export function LandingFloatingCta() {
  const [navbarHidden, setNavbarHidden] = useState(false);
  const [finalCtaVisible, setFinalCtaVisible] = useState(false);

  useEffect(() => {
    const navEl = document.getElementById("landing-navbar");
    const ctaEl = document.getElementById("landing-final-cta");

    const navObserver = navEl
      ? new IntersectionObserver(
          (entries) => {
            setNavbarHidden(!entries[0].isIntersecting);
          },
          { threshold: 0 },
        )
      : null;

    const ctaObserver = ctaEl
      ? new IntersectionObserver(
          (entries) => {
            setFinalCtaVisible(entries[0].isIntersecting);
          },
          { threshold: 0.15 },
        )
      : null;

    if (navEl && navObserver) navObserver.observe(navEl);
    if (ctaEl && ctaObserver) ctaObserver.observe(ctaEl);

    return () => {
      navObserver?.disconnect();
      ctaObserver?.disconnect();
    };
  }, []);

  const visible = navbarHidden && !finalCtaVisible;

  return (
    <div
      className={`fixed right-5 top-5 z-50 transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] sm:right-8 sm:top-6 ${
        visible
          ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
          : "pointer-events-none -translate-y-3 scale-95 opacity-0"
      }`}
    >
      <Link
        href="/app"
        prefetch
        tabIndex={visible ? 0 : -1}
        aria-hidden={!visible}
        className="group inline-flex items-center gap-2 rounded-full bg-[#FF6200] px-5 py-2.5 text-[13px] font-semibold tracking-[-0.01em] text-white shadow-[0_14px_34px_-8px_rgba(255,98,0,0.65),0_2px_10px_rgba(18,15,23,0.18)] ring-1 ring-white/20 backdrop-blur-md transition duration-200 hover:-translate-y-0.5 hover:bg-[#E05200]"
      >
        Acessar Aplicação
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
