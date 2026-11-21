"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Home,
  RefreshCw,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useAppStatus } from "@/context/AppStatusContext";

const NAV_ITEMS = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/shop", label: "Loja", icon: ShoppingBag },
  { href: "/budget", label: "Finanças", icon: Wallet },
];

export function Header() {
  const pathname = usePathname();
  const {
    isBudgetOnline,
    isCheckoutOnline,
    isChecking,
    isWakingUp,
    refreshHealth,
    demoMode,
    hideBalances,
    toggleHideBalances,
  } = useAppStatus();

  const bothOnline = isBudgetOnline && isCheckoutOnline && !demoMode;
  const statusLabel = bothOnline
    ? "APIs Online"
    : demoMode
      ? "Demo"
      : isWakingUp
        ? "Iniciando..."
        : "Offline";

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-[#EAE9E4] bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Esquerda: Logo Itaú + nome + botão claro para voltar à apresentação */}
          <div className="flex items-center gap-3">
            <Link
              href="/app"
              className="group flex items-center gap-2.5 focus:outline-none"
            >
              <Image
                src="/images/itau-logo.png"
                alt="Logo Itaú"
                width={30}
                height={30}
                priority
                className="h-[30px] w-[30px] object-contain transition-transform duration-200 group-hover:scale-105"
              />
              <span className="text-[15.5px] font-semibold tracking-[-0.025em] text-[#141413]">
                Itaú Hub
              </span>
            </Link>

            <span
              aria-hidden="true"
              className="hidden h-4 w-px bg-[#E5E3DD] sm:inline-block"
            />

            <Link
              href="/"
              className="hidden items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium text-[#6E6C66] transition hover:bg-[#F5F4F1] hover:text-[#141413] sm:inline-flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Apresentação
            </Link>
          </div>

          {/* Centro: Apenas as 3 abas do produto (sem Arquitetura) */}
          <nav
            aria-label="Navegação da aplicação"
            className="hidden items-center gap-1 rounded-full bg-[#F5F4F1] p-1 md:flex"
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-medium tracking-[-0.01em] transition-all duration-200 ${
                    active
                      ? "bg-[#141413] text-white shadow-xs"
                      : "text-[#57554F] hover:text-[#141413]"
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active ? "text-[#FF6200]" : "opacity-70"
                    }`}
                  />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Direita: Status compacto + privacidade de saldo */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void refreshHealth()}
              disabled={isChecking}
              title={
                bothOnline
                  ? "APIs Java conectadas — clique para revalidar"
                  : demoMode
                    ? "Modo Demo ativo — clique para verificar APIs reais"
                    : "Verificando conexão com APIs Java"
              }
              className="hidden items-center gap-2 rounded-full border border-[#EAE9E4] bg-white px-3 py-1.5 text-[12px] font-medium text-[#57554F] transition hover:border-[#D0CEC7] hover:text-[#141413] disabled:opacity-60 sm:inline-flex"
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  bothOnline
                    ? "bg-emerald-500"
                    : isWakingUp && !demoMode
                      ? "animate-pulse bg-[#FF6200]"
                      : "bg-[#FF6200]"
                }`}
              />
              <span>{statusLabel}</span>
              <RefreshCw
                className={`h-3 w-3 opacity-60 ${isChecking ? "animate-spin" : ""}`}
              />
            </button>

            <button
              type="button"
              onClick={toggleHideBalances}
              title={hideBalances ? "Mostrar valores" : "Ocultar valores"}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#EAE9E4] bg-white text-[#57554F] transition hover:border-[#141413] hover:text-[#141413]"
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
          </div>
        </div>
      </header>

      {/* Tab Bar Mobile limpa (3 itens) */}
      <nav
        aria-label="Navegação mobile"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-[#EAE9E4] bg-white/95 px-2 pb-2 pt-1.5 backdrop-blur-xl md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 rounded-2xl py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "bg-[#FFF3EB] text-[#FF6200]"
                    : "text-[#6E6C66] hover:text-[#141413]"
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
