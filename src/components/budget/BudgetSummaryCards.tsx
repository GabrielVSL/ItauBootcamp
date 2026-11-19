"use client";

import React from "react";
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
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
          className="flex items-start gap-3.5 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-950"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-sm font-extrabold">
              Alerta de Déficit Ativo
            </h3>
            <p className="mt-0.5 text-xs leading-relaxed text-rose-800">
              {summary.alertMessage ||
                "Suas despesas ultrapassaram suas receitas. Utilize o Consultor IA abaixo para planejar ajustes."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Saldo Líquido destacado em dark obsidian */}
        <div className="relative overflow-hidden rounded-3xl bg-[#0D1528] p-5 text-white shadow-lg shadow-[#0D1528]/15">
          <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#FF6200]/30 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
              Saldo Líquido
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-white/10 text-[#FF8A3D]">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-36 animate-pulse rounded-xl bg-white/15" />
          ) : (
            <p
              className={`relative mt-3 font-display text-2xl font-extrabold tabular-nums sm:text-3xl ${
                (summary?.netBalance ?? 0) < 0 ? "text-rose-400" : "text-white"
              }`}
            >
              {summary ? masked(formatBRL(summary.netBalance)) : "—"}
            </p>
          )}
          <p className="relative mt-1.5 text-xs text-slate-300">
            {summary
              ? `${summary.transactionCount} transação(ões) contabilizadas`
              : "Sem dados do Smart Budget"}
          </p>
        </div>

        <div className="voxel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              Receitas Totais
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-32 animate-pulse rounded-xl bg-[#F4EFE9]" />
          ) : (
            <p className="mt-3 font-display text-2xl font-extrabold tabular-nums text-emerald-700 sm:text-3xl">
              {summary ? masked(formatBRL(summary.totalIncome)) : "—"}
            </p>
          )}
          <p className="mt-1.5 text-xs text-[#667085]">
            Soma de entradas (INCOME)
          </p>
        </div>

        <div className="voxel-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
              Despesas Totais
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF4EC] text-[#FF6200]">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          {loading ? (
            <div className="mt-3 h-8 w-32 animate-pulse rounded-xl bg-[#F4EFE9]" />
          ) : (
            <p className="mt-3 font-display text-2xl font-extrabold tabular-nums text-[#101828] sm:text-3xl">
              {summary ? masked(formatBRL(summary.totalExpense)) : "—"}
            </p>
          )}
          <p className="mt-1.5 text-xs text-[#667085]">
            Soma de saídas (EXPENSE)
          </p>
        </div>
      </div>
    </div>
  );
}
