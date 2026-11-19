"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Cpu,
  Eye,
  EyeOff,
  FlaskConical,
  Mic,
  Plus,
  RefreshCw,
  ShoppingBag,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type {
  FinancialSummaryResponse,
  TransactionResponse,
} from "@/types/budget";
import type { PedidoResponse } from "@/types/checkout";
import type { NormalizedApiError } from "@/types/bff";
import { useAppStatus } from "@/context/AppStatusContext";
import {
  getDemoOrders,
  getDemoSummary,
  getDemoTransactions,
} from "@/lib/demo-store";
import { CATEGORY_META, formatBRL, formatDateTime } from "@/lib/format";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
import { PedraMark } from "@/components/brand/ItauBootcampLogo";

export function DashboardView() {
  const {
    demoMode,
    setDemoMode,
    refreshHealth,
    hideBalances,
    toggleHideBalances,
  } = useAppStatus();
  const [summary, setSummary] = useState<FinancialSummaryResponse | null>(null);
  const [recentTx, setRecentTx] = useState<TransactionResponse[]>([]);
  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetError, setBudgetError] = useState<NormalizedApiError | null>(null);
  const [checkoutError, setCheckoutError] = useState<NormalizedApiError | null>(
    null,
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    setBudgetError(null);
    setCheckoutError(null);

    if (demoMode) {
      setSummary(getDemoSummary());
      setRecentTx(getDemoTransactions().slice(0, 5));
      setOrders(getDemoOrders());
      setLoading(false);
      return;
    }

    const [summaryRes, txRes, ordersRes] = await Promise.allSettled([
      fetch("/api/budget/transactions/summary", { cache: "no-store" }),
      fetch("/api/budget/transactions", { cache: "no-store" }),
      fetch("/api/checkout/pedidos", { cache: "no-store" }),
    ]);

    if (summaryRes.status === "fulfilled") {
      const payload = await summaryRes.value.json();
      if (summaryRes.value.ok) {
        setSummary(payload as FinancialSummaryResponse);
      } else {
        setSummary(null);
        setBudgetError(payload as NormalizedApiError);
      }
    }

    if (txRes.status === "fulfilled" && txRes.value.ok) {
      const list = (await txRes.value.json()) as TransactionResponse[];
      setRecentTx(
        [...list]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 5),
      );
    } else {
      setRecentTx([]);
    }

    if (ordersRes.status === "fulfilled") {
      const payload = await ordersRes.value.json();
      if (ordersRes.value.ok) {
        const list = payload as PedidoResponse[];
        setOrders(
          [...list].sort(
            (a, b) =>
              new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
          ),
        );
      } else {
        setOrders([]);
        setCheckoutError(payload as NormalizedApiError);
      }
    }

    setLoading(false);
  }, [demoMode]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const totalOrdersVolume = orders.reduce((acc, o) => acc + o.valorTotal, 0);
  const masked = (val: string) => (hideBalances ? "R$ •••••" : val);

  const expenseRatioPct =
    summary && summary.totalIncome > 0
      ? Math.min(100, Math.round((summary.totalExpense / summary.totalIncome) * 100))
      : 0;
  const savingsRatePct =
    summary && summary.totalIncome > 0
      ? Math.max(0, 100 - expenseRatioPct)
      : 0;

  return (
    <div className="space-y-7">
      {/* Saudação editorial limpa + botão atualizar */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E05200]">
            <Sparkles className="h-3 w-3" />
            Bootcamp Java &amp; IA • Itaú + DIO
          </span>
          <h1 className="mt-2 font-display text-2xl font-extrabold tracking-tight text-[#101828] sm:text-3xl">
            Seu Super-App Financeiro
          </h1>
          <p className="mt-1 text-sm text-[#525D73]">
            Dois microsserviços independentes orquestrados em tempo real via BFF.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            void refreshHealth();
            void loadData();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[#EAE3DB] bg-white px-4 py-2 text-xs font-bold text-[#344054] shadow-2xs transition hover:border-[#FF6200]/40 hover:text-[#101828]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar dados
        </button>
      </div>

      {/* Alerta de Déficit */}
      {summary?.deficitAlert && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-4 rounded-3xl border border-rose-200 bg-rose-50/90 p-5 text-rose-950 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-sm font-extrabold">
                Alerta de Déficit no Smart Budget
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-rose-800">
                {summary.alertMessage ||
                  "Suas despesas superaram suas receitas. Converse com o Consultor IA para equilibrar seu mês."}
              </p>
            </div>
          </div>
          <Link
            href="/budget"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-rose-700"
          >
            Abrir Consultor IA
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* BENTO GRID PRINCIPAL (Estilo Modern Fintech + DNA Itaú 100 Anos) */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Card Principal de Saldo — Dark Obsidian Navy + Aura Laranja Itaú */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[28px] bg-[#0D1528] p-6 text-white shadow-xl shadow-[#0D1528]/15 sm:p-8 lg:col-span-7">
          {/* Glows orgânicos sutis */}
          <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-[#FF6200]/28 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#106EB0]/25 blur-3xl" />
          {/* Marca d'água da Pedra */}
          <div className="pointer-events-none absolute right-6 top-6 opacity-15">
            <PedraMark className="h-20 w-20" />
          </div>

          <div className="relative">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold tracking-wide text-slate-300">
                Saldo consolidado • Smart Budget AI
              </span>
              <button
                type="button"
                onClick={toggleHideBalances}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold text-white/90 backdrop-blur transition hover:bg-white/20"
              >
                {hideBalances ? (
                  <>
                    <Eye className="h-3.5 w-3.5" /> Mostrar
                  </>
                ) : (
                  <>
                    <EyeOff className="h-3.5 w-3.5" /> Ocultar
                  </>
                )}
              </button>
            </div>

            {loading ? (
              <div className="mt-4 h-12 w-56 animate-pulse rounded-2xl bg-white/15" />
            ) : (
              <p
                className={`mt-3 font-display text-4xl font-extrabold tracking-tight tabular-nums sm:text-5xl ${
                  (summary?.netBalance ?? 0) < 0 ? "text-rose-400" : "text-white"
                }`}
              >
                {summary ? masked(formatBRL(summary.netBalance)) : "—"}
              </p>
            )}

            {/* Barra de Saúde Financeira (Comprometimento vs Economia) */}
            {summary && !loading && (
              <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">
                    Comprometimento da receita
                  </span>
                  <span className="font-bold tabular-nums text-white">
                    {expenseRatioPct}% gasto •{" "}
                    <span className="text-emerald-400">
                      {savingsRatePct}% livre
                    </span>
                  </span>
                </div>
                <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.deficitAlert
                        ? "bg-rose-500"
                        : "bg-gradient-to-r from-[#FF6200] to-[#FF9A44]"
                    }`}
                    style={{ width: `${Math.max(4, expenseRatioPct)}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Ações rápidas integradas */}
          <div className="relative mt-6 flex flex-wrap items-center gap-2.5">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6200] px-5 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-[#FF6200]/30 transition hover:bg-[#E05200]"
            >
              <ShoppingBag className="h-4 w-4" />
              Explorar Shop GoF
            </Link>
            <Link
              href="/budget"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2.5 text-xs font-bold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Bot className="h-4 w-4 text-[#FF8A3D]" />
              Consultor IA
            </Link>
            <Link
              href="/architecture"
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              Arquitetura <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        {/* Coluna Direita do Bento Grid: Card Destaque Laranja Itaú + Mini KPIs */}
        <div className="flex flex-col gap-5 lg:col-span-5">
          {/* Card Assinatura Laranja Itaú — Shop & Checkout GoF */}
          <Link
            href="/shop"
            className="group relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#FF6A00] via-[#FF6200] to-[#E04F00] p-6 text-white shadow-lg shadow-[#FF6200]/20 transition hover:brightness-105"
          >
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
            <div className="relative flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-black/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-orange-50">
                  Checkout API • Design Patterns GoF
                </span>
                <p className="mt-3 font-display text-3xl font-extrabold tabular-nums">
                  {loading
                    ? "—"
                    : checkoutError && !demoMode
                      ? "Offline"
                      : `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"}`}
                </p>
                <p className="mt-1 text-xs font-medium text-orange-50/90">
                  {checkoutError && !demoMode
                    ? "Conecte a API (:8081) ou ative o Modo Demo"
                    : `Volume acumulado: ${masked(formatBRL(totalOrdersVolume))}`}
                </p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/20 backdrop-blur transition group-hover:translate-x-0.5 group-hover:bg-white/30">
                <ArrowRight className="h-5 w-5" />
              </span>
            </div>
            <div className="relative mt-4 flex items-center justify-between border-t border-white/20 pt-3 text-[11px] font-semibold text-orange-50">
              <span>Frete PAC Grátis acima de R$ 500</span>
              <span className="underline decoration-white/50 underline-offset-2">
                Ir para Loja
              </span>
            </div>
          </Link>

          {/* Mini Cards Receitas & Despesas */}
          <div className="grid flex-1 grid-cols-2 gap-4">
            <div className="voxel-card flex flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                  Receitas
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                  <TrendingUp className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-7 w-24 animate-pulse rounded-lg bg-[#F4EFE9]" />
                ) : (
                  <p className="font-display text-xl font-extrabold tabular-nums text-emerald-700 sm:text-2xl">
                    {summary ? masked(formatBRL(summary.totalIncome)) : "—"}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[#667085]">
                  Entradas (INCOME)
                </p>
              </div>
            </div>

            <div className="voxel-card flex flex-col justify-between p-5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                  Despesas
                </span>
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF4EC] text-[#FF6200]">
                  <TrendingDown className="h-4 w-4" />
                </span>
              </div>
              <div className="mt-3">
                {loading ? (
                  <div className="h-7 w-24 animate-pulse rounded-lg bg-[#F4EFE9]" />
                ) : (
                  <p className="font-display text-xl font-extrabold tabular-nums text-[#101828] sm:text-2xl">
                    {summary ? masked(formatBRL(summary.totalExpense)) : "—"}
                  </p>
                )}
                <p className="mt-1 text-[11px] text-[#667085]">
                  Saídas &amp; Loja
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Banner de erro com CTA suave para Modo Demo */}
      {(budgetError || checkoutError) && !demoMode && (
        <div className="space-y-3">
          {budgetError && <ApiErrorBanner error={budgetError} />}
          {checkoutError && <ApiErrorBanner error={checkoutError} />}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDemoMode(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6200] px-5 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E05200]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Experimentar tudo no Modo Demo
            </button>
          </div>
        </div>
      )}

      {/* Faixa de Atalhos estilo Super-App (Ações de 1 clique) */}
      <section aria-label="Atalhos rápidos">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            {
              href: "/budget",
              icon: Plus,
              title: "Novo Lançamento",
              desc: "Registrar receita ou despesa",
              tint: "bg-[#FFF4EC] text-[#FF6200]",
            },
            {
              href: "/budget",
              icon: Mic,
              title: "Consultor por Voz",
              desc: "Whisper STT + Tool Calling",
              tint: "bg-blue-50 text-[#001E62]",
            },
            {
              href: "/shop",
              icon: FlaskConical,
              title: "Lab Design Patterns",
              desc: "Disparar cenários 422 reais",
              tint: "bg-amber-50 text-amber-700",
            },
            {
              href: "/architecture",
              icon: Cpu,
              title: "Topologia & Saúde",
              desc: "BFF + 2 Neon PostgreSQL",
              tint: "bg-slate-100 text-[#101828]",
            },
          ].map(({ href, icon: Icon, title, desc, tint }) => (
            <Link
              key={title}
              href={href}
              className="voxel-card voxel-card-interactive flex items-center gap-3.5 p-4"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${tint}`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-xs font-extrabold text-[#101828] sm:text-[13px]">
                  {title}
                </p>
                <p className="truncate text-[11px] text-[#667085]">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Atividade Recente dos 2 Microsserviços */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Extrato recente */}
        <div className="voxel-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-extrabold text-[#101828]">
                Movimentações recentes
              </h2>
              <p className="text-xs text-[#667085]">Smart Budget Spring AI</p>
            </div>
            <Link
              href="/budget"
              className="rounded-full bg-[#FFF4EC] px-3 py-1 text-xs font-bold text-[#E05200] transition hover:bg-[#FFEAD9]"
            >
              Ver tudo
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#F2ECE6]">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-14 animate-pulse rounded-2xl bg-[#F4EFE9]"
                  />
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#667085]">
                Nenhuma movimentação registrada ainda.
              </p>
            ) : (
              recentTx.map((tx) => {
                const cat = CATEGORY_META[tx.category] ?? CATEGORY_META.OTHER;
                const isIncome = tx.type === "INCOME";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-3.5 transition hover:bg-[#FBF9F6]"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-[#FFF4EC] text-[#FF6200]"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#101828]">
                          {tx.description}
                        </p>
                        <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#667085]">
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${cat.bgClass} ${cat.textClass}`}
                          >
                            {cat.label}
                          </span>
                          <span>{formatDateTime(tx.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 font-display text-sm font-extrabold tabular-nums ${
                        isIncome ? "text-emerald-700" : "text-[#101828]"
                      }`}
                    >
                      {isIncome ? "+" : "-"}{" "}
                      {masked(formatBRL(tx.amount))}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pedidos recentes */}
        <div className="voxel-card p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-extrabold text-[#101828]">
                Compras na Loja
              </h2>
              <p className="text-xs text-[#667085]">
                Checkout API Design Patterns
              </p>
            </div>
            <Link
              href="/shop"
              className="rounded-full bg-[#FFF4EC] px-3 py-1 text-xs font-bold text-[#E05200] transition hover:bg-[#FFEAD9]"
            >
              Nova compra
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#F2ECE6]">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-14 animate-pulse rounded-2xl bg-[#F4EFE9]"
                  />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#667085]">
                Nenhum pedido confirmado ainda.
              </p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order.pedidoId}
                  className="flex items-center justify-between gap-3 py-3.5 transition hover:bg-[#FBF9F6]"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display text-sm font-extrabold text-[#101828]">
                        Pedido #{order.pedidoId}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-[#667085]">
                      {order.clienteNome} • {order.modalidadeFrete} •{" "}
                      {order.formaPagamento}
                      {order.cupomAplicado ? ` • ${order.cupomAplicado}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-sm font-extrabold tabular-nums text-[#101828]">
                      {masked(formatBRL(order.valorTotal))}
                    </p>
                    <p className="text-[11px] text-[#98A2B3]">
                      {formatDateTime(order.criadoEm)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
