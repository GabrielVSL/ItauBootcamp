"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Cpu,
  Eye,
  EyeOff,
  Home,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";
import { useAppStatus } from "@/context/AppStatusContext";
import { ItauBootcampLogo } from "@/components/brand/ItauBootcampLogo";

const NAV_ITEMS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/shop", label: "Shop GoF", icon: ShoppingBag },
  { href: "/budget", label: "Finanças & IA", icon: Wallet },
  { href: "/architecture", label: "Arquitetura", icon: Cpu },
];

function ServiceDot({
  label,
  online,
  demoMode,
}: {
  label: string;
  online: boolean;
  demoMode: boolean;
}) {
  const dot = online
    ? "bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.18)]"
    : "bg-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.18)]";

  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#525D73]"
      title={`${label}: ${online ? "Online" : demoMode ? "Modo Demo" : "Offline"}`}
    >
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span>{label}</span>
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const {
    isBudgetOnline,
    isCheckoutOnline,
    isChecking,
    refreshHealth,
    demoMode,
    hideBalances,
    toggleHideBalances,
  } = useAppStatus();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#EAE3DB]/90 bg-[#FBF9F6]/85 backdrop-blur-xl">
        {/* Linha fina de assinatura laranja Itaú */}
        <div className="h-1 w-full bg-gradient-to-r from-[#FF6200] via-[#FF7A1A] to-[#001E62]" />

        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo Pedra Itaú + Bootcamp DIO */}
          <Link href="/" className="group flex items-center focus:outline-none">
            <ItauBootcampLogo />
          </Link>

          {/* Navegação em cápsula segmentada (Desktop) */}
          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-1 rounded-full border border-[#EAE3DB] bg-white/90 p-1.5 shadow-xs lg:flex"
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold transition-all duration-200 ${
                    active
                      ? "bg-[#101828] text-white shadow-sm"
                      : "text-[#525D73] hover:bg-[#F4EFE9] hover:text-[#101828]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active ? "text-[#FF6200]" : "opacity-75"
                    }`}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Controles à direita: status ao vivo + privacidade de saldo */}
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-3 rounded-full border border-[#EAE3DB] bg-white px-3.5 py-1.5 shadow-2xs md:flex">
              <ServiceDot
                label="Checkout"
                online={isCheckoutOnline}
                demoMode={demoMode}
              />
              <span className="h-3.5 w-px bg-[#EAE3DB]" />
              <ServiceDot
                label="Budget AI"
                online={isBudgetOnline}
                demoMode={demoMode}
              />
              <button
                type="button"
                onClick={() => void refreshHealth()}
                disabled={isChecking}
                title="Revalidar status dos microsserviços"
                className="ml-0.5 rounded-full p-1 text-[#667085] transition hover:bg-[#F4EFE9] hover:text-[#101828] disabled:opacity-50"
                aria-label="Atualizar status"
              >
                <RefreshCw
                  className={`h-3 w-3 ${isChecking ? "animate-spin" : ""}`}
                />
              </button>
            </div>

            <button
              type="button"
              onClick={toggleHideBalances}
              title={hideBalances ? "Mostrar valores" : "Ocultar valores"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#EAE3DB] bg-white text-[#525D73] shadow-2xs transition hover:border-[#FF6200]/50 hover:text-[#FF6200]"
              aria-label={
                hideBalances ? "Mostrar saldos e valores" : "Ocultar saldos e valores"
              }
            >
              {hideBalances ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>

            <Link
              href="/budget"
              className="hidden items-center gap-1.5 rounded-full bg-[#FF6200] px-3.5 py-2 text-xs font-bold text-white shadow-sm shadow-orange-600/20 transition hover:bg-[#E05200] sm:inline-flex"
            >
              <Sparkles className="h-3.5 w-3.5" />
              IA
            </Link>
          </div>
        </div>
      </header>

      {/* Tab Bar Mobile estilo Super-App nativo */}
      <nav
        aria-label="Navegação mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAE3DB] bg-white/95 px-2 pb-2 pt-1.5 backdrop-blur-xl lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] font-bold transition ${
                  active
                    ? "bg-[#FFF4EC] text-[#FF6200]"
                    : "text-[#667085] hover:text-[#101828]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
