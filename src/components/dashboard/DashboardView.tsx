"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Mic,
  RefreshCw,
  ShoppingBag,
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

export function DashboardView() {
  const {
    demoMode,
    setDemoMode,
    refreshHealth,
    hideBalances,
    budgetVersion,
    openAiConsultant,
  } = useAppStatus();
  const [summary, setSummary] = useState<FinancialSummaryResponse | null>(null);
  const [recentTx, setRecentTx] = useState<TransactionResponse[]>([]);
  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [budgetError, setBudgetError] = useState<NormalizedApiError | null>(null);
  const [checkoutError, setCheckoutError] = useState<NormalizedApiError | null>(
    null,
  );

  const requestSeqRef = useRef(0);

  const loadData = useCallback(async () => {
    const seq = ++requestSeqRef.current;
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

    if (seq !== requestSeqRef.current) return;

    if (summaryRes.status === "fulfilled") {
      const payload = await summaryRes.value.json();
      if (seq !== requestSeqRef.current) return;
      if (summaryRes.value.ok) {
        setSummary(payload as FinancialSummaryResponse);
      } else {
        setSummary(null);
        setBudgetError(payload as NormalizedApiError);
      }
    }

    if (txRes.status === "fulfilled" && txRes.value.ok) {
      const list = (await txRes.value.json()) as TransactionResponse[];
      if (seq !== requestSeqRef.current) return;
      setRecentTx(
        [...list]
          .sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          )
          .slice(0, 5),
      );
    } else {
      if (seq !== requestSeqRef.current) return;
      setRecentTx([]);
    }

    if (ordersRes.status === "fulfilled") {
      const payload = await ordersRes.value.json();
      if (seq !== requestSeqRef.current) return;
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

    if (seq === requestSeqRef.current) {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    void loadData();
  }, [loadData, budgetVersion]);

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
    <div className="space-y-8">
      {/* Cabeçalho enxuto */}
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#141413] sm:text-3xl">
          Visão geral
        </h1>

        <button
          type="button"
          onClick={() => {
            void refreshHealth();
            void loadData();
          }}
          className="inline-flex items-center gap-2 rounded-full border border-[#EAE9E4] bg-white px-4 py-2 text-[12.5px] font-medium text-[#57554F] transition hover:border-[#141413] hover:text-[#141413]"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </div>

      {/* Alerta de Déficit */}
      {summary?.deficitAlert && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-4 rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-rose-950 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
            <div>
              <h2 className="text-sm font-semibold">
                Suas despesas superaram as receitas
              </h2>
              <p className="mt-0.5 text-xs text-rose-800">
                {summary.alertMessage ||
                  "Converse com o Consultor IA para equilibrar seu mês."}
              </p>
            </div>
          </div>
          <Link
            href="/budget"
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
          >
            Abrir Consultor IA
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}

      {/* Bloco Principal: Saldo (Obsidian) + 3 indicadores limpos */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Card Principal de Saldo */}
        <div className="relative flex flex-col justify-between overflow-hidden rounded-[24px] bg-[#120F17] p-7 text-white shadow-[0_24px_60px_-28px_rgba(18,15,23,0.45)] sm:p-8 lg:col-span-7">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-60 w-60 rounded-full bg-[#FF6200]/22 blur-3xl"
          />

          <div className="relative">
            <span className="text-[13px] font-medium text-white/60">
              Saldo consolidado
            </span>

            {loading ? (
              <div className="mt-3 h-12 w-52 animate-pulse rounded-xl bg-white/10" />
            ) : (
              <p
                className={`mt-2 text-4xl font-semibold tracking-[-0.035em] tabular-nums sm:text-[2.85rem] ${
                  (summary?.netBalance ?? 0) < 0 ? "text-rose-400" : "text-white"
                }`}
              >
                {summary ? masked(formatBRL(summary.netBalance)) : "—"}
              </p>
            )}

            {summary && !loading && (
              <div className="mt-7">
                <div className="flex items-center justify-between text-xs text-white/60">
                  <span>Comprometimento da receita</span>
                  <span className="font-medium tabular-nums text-white/90">
                    {expenseRatioPct}% usado ·{" "}
                    <span className="text-emerald-400">
                      {savingsRatePct}% livre
                    </span>
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
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

          <div className="relative mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 rounded-full bg-[#FF6200] px-5 py-2.5 text-[13px] font-semibold text-white transition hover:bg-[#E05200]"
            >
              <ShoppingBag className="h-4 w-4" />
              Ir para Loja
            </Link>
            <button
              type="button"
              onClick={openAiConsultant}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/12"
            >
              <Mic className="h-4 w-4 text-[#FFA066]" />
              Consultor IA
            </button>
          </div>
        </div>

        {/* Coluna Direita: Receitas, Despesas e Pedidos */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[20px] bg-[#F5F4F1] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-[#6E6C66]">
                  Receitas
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              {loading ? (
                <div className="mt-4 h-7 w-24 animate-pulse rounded-lg bg-white" />
              ) : (
                <p className="mt-4 text-xl font-semibold tracking-[-0.025em] tabular-nums text-[#141413] sm:text-2xl">
                  {summary ? masked(formatBRL(summary.totalIncome)) : "—"}
                </p>
              )}
            </div>

            <div className="rounded-[20px] bg-[#F5F4F1] p-5">
              <div className="flex items-center justify-between">
                <span className="text-[12.5px] font-medium text-[#6E6C66]">
                  Despesas
                </span>
                <TrendingDown className="h-4 w-4 text-[#FF6200]" />
              </div>
              {loading ? (
                <div className="mt-4 h-7 w-24 animate-pulse rounded-lg bg-white" />
              ) : (
                <p className="mt-4 text-xl font-semibold tracking-[-0.025em] tabular-nums text-[#141413] sm:text-2xl">
                  {summary ? masked(formatBRL(summary.totalExpense)) : "—"}
                </p>
              )}
            </div>
          </div>

          {/* Card de Pedidos na Loja */}
          <Link
            href="/shop"
            className="group flex flex-1 flex-col justify-between rounded-[20px] border border-[#EAE9E4] bg-white p-5 transition hover:border-[#D0CEC7]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[12.5px] font-medium text-[#6E6C66]">
                  Pedidos na loja
                </span>
                <p className="mt-2 text-2xl font-semibold tracking-[-0.025em] tabular-nums text-[#141413]">
                  {loading
                    ? "—"
                    : checkoutError && !demoMode
                      ? "Offline"
                      : `${orders.length} ${orders.length === 1 ? "pedido" : "pedidos"}`}
                </p>
                <p className="mt-1 text-xs text-[#7A7872]">
                  {checkoutError && !demoMode
                    ? "Ative o Modo Demo ou inicie o backend"
                    : `Total acumulado: ${masked(formatBRL(totalOrdersVolume))}`}
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F4F1] text-[#141413] transition group-hover:bg-[#FF6200] group-hover:text-white">
                <ArrowRight className="h-4 w-4" />
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-[#F0EFEA] pt-3 text-xs text-[#6E6C66]">
              <span>Frete PAC grátis acima de R$ 500</span>
              <span className="font-medium text-[#141413] group-hover:text-[#FF6200]">
                Abrir loja
              </span>
            </div>
          </Link>
        </div>
      </section>

      {/* Banner de erro só quando realmente offline fora do Demo */}
      {(budgetError || checkoutError) && !demoMode && (
        <div className="space-y-3">
          {budgetError && <ApiErrorBanner error={budgetError} />}
          {checkoutError && <ApiErrorBanner error={checkoutError} />}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setDemoMode(true)}
              className="rounded-full bg-[#141413] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#FF6200]"
            >
              Ativar Modo Demo
            </button>
          </div>
        </div>
      )}

      {/* Movimentações recentes + Pedidos recentes */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-[22px] border border-[#EAE9E4] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#141413]">
              Movimentações recentes
            </h2>
            <Link
              href="/budget"
              className="text-xs font-medium text-[#FF6200] transition hover:text-[#C84A00]"
            >
              Ver extrato →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#F2F0EC]">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-12 animate-pulse rounded-xl bg-[#F5F4F1]"
                  />
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#7A7872]">
                Nenhuma movimentação registrada ainda.
              </p>
            ) : (
              recentTx.map((tx) => {
                const cat = CATEGORY_META[tx.category] ?? CATEGORY_META.OTHER;
                const isIncome = tx.type === "INCOME";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between gap-3 py-3.5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isIncome
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-[#F5F4F1] text-[#141413]"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="h-4 w-4" />
                        ) : (
                          <ArrowUpRight className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[13.5px] font-medium text-[#141413]">
                          {tx.description}
                        </p>
                        <p className="mt-0.5 text-[11.5px] text-[#7A7872]">
                          {cat.label} · {formatDateTime(tx.createdAt)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-[13.5px] font-semibold tabular-nums ${
                        isIncome ? "text-emerald-700" : "text-[#141413]"
                      }`}
                    >
                      {isIncome ? "+" : "-"} {masked(formatBRL(tx.amount))}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-[22px] border border-[#EAE9E4] bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[16px] font-semibold tracking-[-0.02em] text-[#141413]">
              Pedidos recentes
            </h2>
            <Link
              href="/shop"
              className="text-xs font-medium text-[#FF6200] transition hover:text-[#C84A00]"
            >
              Nova compra →
            </Link>
          </div>

          <div className="mt-4 divide-y divide-[#F2F0EC]">
            {loading ? (
              <div className="space-y-3 py-2">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-12 animate-pulse rounded-xl bg-[#F5F4F1]"
                  />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <p className="py-10 text-center text-xs text-[#7A7872]">
                Nenhum pedido confirmado ainda.
              </p>
            ) : (
              orders.slice(0, 5).map((order) => (
                <div
                  key={order.pedidoId}
                  className="flex items-center justify-between gap-3 py-3.5"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-[#141413]">
                        Pedido #{order.pedidoId}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700">
                        {order.status}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[11.5px] text-[#7A7872]">
                      {order.clienteNome} · {order.modalidadeFrete} ·{" "}
                      {order.formaPagamento}
                      {order.cupomAplicado ? ` · ${order.cupomAplicado}` : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-[13.5px] font-semibold tabular-nums text-[#141413]">
                      {masked(formatBRL(order.valorTotal))}
                    </p>
                    <p className="text-[11px] text-[#9A9892]">
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
