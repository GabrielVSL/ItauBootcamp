"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ChevronUp, PieChart } from "lucide-react";
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
  const [minimized, setMinimized] = useState(false);
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
    const radius = 58;
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
    <section className="rounded-[22px] border border-[#EAE9E4] bg-white px-6 py-5">
      {/* Cabeçalho da faixa com botão Minimizar/Expandir */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5F4F1] text-[#141413]">
            <PieChart className="h-4.5 w-4.5" />
          </span>
          <div>
            <h2 className="text-[15.5px] font-semibold tracking-[-0.02em] text-[#141413]">
              Despesas por categoria
            </h2>
            {minimized && !loading && (
              <p className="text-xs text-[#7A7872]">
                {slices.length}{" "}
                {slices.length === 1 ? "categoria" : "categorias"} · Total{" "}
                <strong className="font-semibold text-[#141413]">
                  {masked(formatBRL(totalExpense))}
                </strong>
              </p>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setMinimized((prev) => !prev)}
          aria-expanded={!minimized}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE9E4] bg-white px-3.5 py-1.5 text-[12px] font-medium text-[#57554F] transition hover:border-[#141413] hover:text-[#141413]"
        >
          {minimized ? (
            <>
              Expandir
              <ChevronDown className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              Minimizar
              <ChevronUp className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Conteúdo horizontal em largura total */}
      {!minimized && (
        <div className="mt-5 border-t border-[#F0EFEA] pt-5">
          {loading ? (
            <div className="h-36 animate-pulse rounded-2xl bg-[#F5F4F1]" />
          ) : slices.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5E3DD] bg-[#FAF9F7] py-10 text-center text-xs text-[#6E6C66]">
              Nenhuma despesa registrada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-12">
              {/* Donut com respiro interno para o texto */}
              <div className="flex justify-center md:col-span-4 lg:col-span-3">
                <div className="relative h-40 w-40">
                  <svg
                    viewBox="0 0 160 160"
                    className="h-full w-full -rotate-90"
                    role="img"
                    aria-label="Gráfico de despesas por categoria"
                  >
                    <circle
                      cx="80"
                      cy="80"
                      r="58"
                      fill="none"
                      stroke="#F2F1ED"
                      strokeWidth="15"
                    />
                    {slices.map((slice) => (
                      <circle
                        key={slice.category}
                        cx="80"
                        cy="80"
                        r="58"
                        fill="none"
                        stroke={slice.color}
                        strokeWidth="15"
                        strokeDasharray={slice.dashArray}
                        strokeDashoffset={slice.dashOffset}
                        className="transition-all duration-500"
                      />
                    ))}
                  </svg>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-5 text-center">
                    <span className="text-[10px] font-medium text-[#8A8882]">
                      Total saídas
                    </span>
                    <span className="mt-0.5 text-[13px] font-semibold tabular-nums text-[#141413]">
                      {masked(formatBRL(totalExpense))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Barras distribuídas em 2 colunas aproveitando toda a largura */}
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 md:col-span-8 lg:col-span-9">
                {slices.map((slice) => (
                  <div key={slice.category} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="inline-flex items-center gap-2 font-medium text-[#141413]">
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: slice.color }}
                        />
                        {slice.label}
                      </span>
                      <span className="font-semibold tabular-nums text-[#141413]">
                        {masked(formatBRL(slice.total))}{" "}
                        <span className="font-normal text-[#8A8882]">
                          ({slice.percentage.toFixed(0)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#F2F1ED]">
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
        </div>
      )}
    </section>
  );
}
