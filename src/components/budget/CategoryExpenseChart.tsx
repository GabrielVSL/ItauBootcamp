"use client";

import React, { useMemo } from "react";
import { PieChart } from "lucide-react";
import type { TransactionCategory, TransactionResponse } from "@/types/budget";
import { useAppStatus } from "@/context/AppStatusContext";
import { CATEGORY_META, formatBRL } from "@/lib/format";

interface CategoryExpenseChartProps {
  transactions: TransactionResponse[];
  loading: boolean;
}

interface SliceData {
  category: TransactionCategory;
  label: string;
  color: string;
  total: number;
  percentage: number;
  dashArray: string;
  dashOffset: number;
}

export function CategoryExpenseChart({
  transactions,
  loading,
}: CategoryExpenseChartProps) {
  const { hideBalances } = useAppStatus();
  const masked = (val: string) => (hideBalances ? "R$ •••" : val);

  const { slices, totalExpense } = useMemo(() => {
    const map = new Map<TransactionCategory, number>();
    let sum = 0;

    for (const tx of transactions) {
      if (tx.type !== "EXPENSE") continue;
      sum += tx.amount;
      map.set(tx.category, (map.get(tx.category) ?? 0) + tx.amount);
    }

    const sorted = Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
    const radius = 56;
    const circumference = 2 * Math.PI * radius;
    let accumulatedPct = 0;

    const computed: SliceData[] = sorted.map(([category, total]) => {
      const pct = sum > 0 ? (total / sum) * 100 : 0;
      const segmentLength = (pct / 100) * circumference;
      const dashOffset = -(accumulatedPct / 100) * circumference;
      accumulatedPct += pct;

      const meta = CATEGORY_META[category] ?? CATEGORY_META.OTHER;
      return {
        category,
        label: meta.label,
        color: meta.color,
        total,
        percentage: pct,
        dashArray: `${segmentLength} ${circumference}`,
        dashOffset,
      };
    });

    return { slices: computed, totalExpense: sum };
  }, [transactions]);

  return (
    <section className="voxel-card p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF4EC] text-[#FF6200]">
          <PieChart className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-base font-extrabold text-[#101828]">
            Despesas por Categoria
          </h2>
          <p className="text-xs text-[#667085]">
            Distribuição percentual das saídas registradas
          </p>
        </div>
      </div>

      {loading ? (
        <div className="mt-6 h-48 animate-pulse rounded-2xl bg-[#F4EFE9]" />
      ) : slices.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-[#EAE3DB] bg-[#FBF9F6] py-12 text-center text-xs text-[#667085]">
          Nenhuma despesa registrada para exibir no gráfico.
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 items-center gap-6 sm:grid-cols-12">
          <div className="flex justify-center sm:col-span-5">
            <div className="relative h-44 w-44">
              <svg
                viewBox="0 0 160 160"
                className="h-full w-full -rotate-90"
                role="img"
                aria-label="Gráfico de rosca de despesas por categoria"
              >
                <circle
                  cx="80"
                  cy="80"
                  r="56"
                  fill="none"
                  stroke="#F4EFE9"
                  strokeWidth="22"
                />
                {slices.map((slice) => (
                  <circle
                    key={slice.category}
                    cx="80"
                    cy="80"
                    r="56"
                    fill="none"
                    stroke={slice.color}
                    strokeWidth="22"
                    strokeDasharray={slice.dashArray}
                    strokeDashoffset={slice.dashOffset}
                    className="transition-all duration-500"
                  />
                ))}
              </svg>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#98A2B3]">
                  Total Saídas
                </span>
                <span className="mt-0.5 font-display text-sm font-extrabold tabular-nums text-[#101828]">
                  {masked(formatBRL(totalExpense))}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-3 sm:col-span-7">
            {slices.map((slice) => (
              <div key={slice.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-2 font-semibold text-[#101828]">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    {slice.label}
                  </span>
                  <span className="font-bold tabular-nums text-[#101828]">
                    {masked(formatBRL(slice.total))}{" "}
                    <span className="font-medium text-[#98A2B3]">
                      ({slice.percentage.toFixed(1)}%)
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F4EFE9]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(3, slice.percentage)}%`,
                      backgroundColor: slice.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
