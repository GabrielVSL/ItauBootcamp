"use client";

import React from "react";
import { AlertTriangle, TrendingDown, TrendingUp } from "lucide-react";
import type { FinancialSummaryResponse } from "@/types/budget";
import { useAppStatus } from "@/context/AppStatusContext";
import { formatBRL } from "@/lib/format";

interface BudgetSummaryCardsProps {
  summary: FinancialSummaryResponse | null;
  loading: boolean;
}

export function BudgetSummaryCards({
  summary,
  loading,
}: BudgetSummaryCardsProps) {
  const { hideBalances } = useAppStatus();
  const masked = (val: string) => (hideBalances ? "R$ •••••" : val);

  return (
    <div className="space-y-4">
      {summary?.deficitAlert && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50/80 p-4 text-rose-950"
        >
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <div>
            <h3 className="text-sm font-semibold">
              Despesas acima das receitas
            </h3>
            <p className="mt-0.5 text-xs text-rose-800">
              {summary.alertMessage ||
                "Use o Consultor IA ao lado para equilibrar seu orçamento."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="relative overflow-hidden rounded-[22px] bg-[#120F17] p-6 text-white">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#FF6200]/25 blur-2xl"
          />
          <span className="relative text-[12.5px] font-medium text-white/60">
            Saldo líquido
          </span>
          {loading ? (
            <div className="mt-3 h-8 w-36 animate-pulse rounded-lg bg-white/10" />
          ) : (
            <p
              className={`relative mt-2.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums sm:text-3xl ${
                (summary?.netBalance ?? 0) < 0 ? "text-rose-400" : "text-white"
              }`}
            >
              {summary ? masked(formatBRL(summary.netBalance)) : "—"}
            </p>
          )}
          <p className="relative mt-1.5 text-xs text-white/45">
            {summary
              ? `${summary.transactionCount} lançamentos`
              : "Sem dados no momento"}
          </p>
        </div>

        <div className="rounded-[22px] bg-[#F5F4F1] p-6">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-[#6E6C66]">
              Receitas
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-32 animate-pulse rounded-lg bg-white" />
          ) : (
            <p className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-[#141413] sm:text-3xl">
              {summary ? masked(formatBRL(summary.totalIncome)) : "—"}
            </p>
          )}
        </div>

        <div className="rounded-[22px] bg-[#F5F4F1] p-6">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-[#6E6C66]">
              Despesas
            </span>
            <TrendingDown className="h-4 w-4 text-[#FF6200]" />
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-32 animate-pulse rounded-lg bg-white" />
          ) : (
            <p className="mt-2.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-[#141413] sm:text-3xl">
              {summary ? masked(formatBRL(summary.totalExpense)) : "—"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
