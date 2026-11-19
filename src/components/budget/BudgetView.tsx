"use client";

import React, { useCallback, useEffect, useState } from "react";
import { RefreshCw, Sparkles, Wallet } from "lucide-react";
import type {
  FinancialSummaryResponse,
  TransactionCategory,
  TransactionRequest,
  TransactionResponse,
  TransactionType,
} from "@/types/budget";
import type { NormalizedApiError } from "@/types/bff";
import { useAppStatus } from "@/context/AppStatusContext";
import { useToast } from "@/context/ToastContext";
import {
  addDemoTransaction,
  getDemoSummary,
  getDemoTransactions,
} from "@/lib/demo-store";
import { formatBRL } from "@/lib/format";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
import { BudgetSummaryCards } from "./BudgetSummaryCards";
import { CategoryExpenseChart } from "./CategoryExpenseChart";
import { TransactionsPanel } from "./TransactionsPanel";
import { AiConsultantPanel } from "./AiConsultantPanel";

export function BudgetView() {
  const { demoMode } = useAppStatus();
  const { notify } = useToast();

  const [summary, setSummary] = useState<FinancialSummaryResponse | null>(null);
  const [allTransactions, setAllTransactions] = useState<TransactionResponse[]>(
    [],
  );
  const [filteredTransactions, setFilteredTransactions] = useState<
    TransactionResponse[]
  >([]);
  const [filterCategory, setFilterCategory] = useState<
    TransactionCategory | ""
  >("");
  const [filterType, setFilterType] = useState<TransactionType | "">("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<NormalizedApiError | null>(null);

  const loadBudgetData = useCallback(async () => {
    setLoading(true);
    setLoadError(null);

    if (demoMode) {
      setSummary(getDemoSummary());
      setAllTransactions(getDemoTransactions());
      setFilteredTransactions(
        getDemoTransactions({
          category: filterCategory,
          type: filterType,
        }),
      );
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (filterCategory) params.set("category", filterCategory);
    if (filterType) params.set("type", filterType);
    const qs = params.toString();

    const [summaryRes, allTxRes, filteredTxRes] = await Promise.allSettled([
      fetch("/api/budget/transactions/summary", { cache: "no-store" }),
      fetch("/api/budget/transactions", { cache: "no-store" }),
      qs
        ? fetch(`/api/budget/transactions?${qs}`, { cache: "no-store" })
        : Promise.resolve(null),
    ]);

    if (summaryRes.status === "fulfilled") {
      const payload = await summaryRes.value.json();
      if (summaryRes.value.ok) {
        setSummary(payload as FinancialSummaryResponse);
      } else {
        setSummary(null);
        setLoadError(payload as NormalizedApiError);
      }
    }

    let allList: TransactionResponse[] = [];
    if (allTxRes.status === "fulfilled" && allTxRes.value.ok) {
      const data = (await allTxRes.value.json()) as TransactionResponse[];
      allList = [...data].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setAllTransactions(allList);
    } else {
      setAllTransactions([]);
    }

    if (qs) {
      if (
        filteredTxRes.status === "fulfilled" &&
        filteredTxRes.value &&
        filteredTxRes.value.ok
      ) {
        const data =
          (await filteredTxRes.value.json()) as TransactionResponse[];
        setFilteredTransactions(
          [...data].sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );
      } else {
        setFilteredTransactions([]);
      }
    } else {
      setFilteredTransactions(allList);
    }

    setLoading(false);
  }, [demoMode, filterCategory, filterType]);

  useEffect(() => {
    void loadBudgetData();
  }, [loadBudgetData]);

  async function handleCreateTransaction(
    payload: TransactionRequest,
  ): Promise<{ ok: boolean; error?: NormalizedApiError }> {
    if (demoMode) {
      const created = addDemoTransaction(payload);
      notify({
        tone: "success",
        title: "Transação registrada (Demo)",
        description: `${created.description} — ${formatBRL(created.amount)}`,
      });
      await loadBudgetData();
      return { ok: true };
    }

    try {
      const res = await fetch("/api/budget/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        return { ok: false, error: data as NormalizedApiError };
      }
      notify({
        tone: "success",
        title: "Transação salva no Smart Budget!",
        description: `${payload.description} — ${formatBRL(payload.amount)}`,
      });
      await loadBudgetData();
      return { ok: true };
    } catch {
      return {
        ok: false,
        error: {
          status: 503,
          title: "Erro de comunicação",
          message: "Não foi possível salvar a transação.",
          details: [],
          service: "budget",
        },
      };
    }
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho editorial */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E05200]">
            <Sparkles className="h-3 w-3" />
            Smart Budget Spring AI • Tool Calling + Voz
          </span>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0D1528] text-[#FF8A3D] shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#101828] sm:text-3xl">
                Finanças &amp; Consultor IA
              </h1>
              <p className="text-xs text-[#525D73]">
                Controle financeiro em tempo real com assistente conversacional
                conectado direto ao banco.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadBudgetData()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE3DB] bg-white px-4 py-2 text-xs font-bold text-[#344054] shadow-2xs transition hover:border-[#FF6200]/40 hover:text-[#101828]"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Atualizar extrato
        </button>
      </div>

      {loadError && !demoMode && <ApiErrorBanner error={loadError} />}

      <BudgetSummaryCards summary={summary} loading={loading} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          <CategoryExpenseChart
            transactions={allTransactions}
            loading={loading}
          />
          <TransactionsPanel
            transactions={filteredTransactions}
            loading={loading}
            filterCategory={filterCategory}
            filterType={filterType}
            onChangeFilterCategory={setFilterCategory}
            onChangeFilterType={setFilterType}
            onCreateTransaction={handleCreateTransaction}
          />
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-24">
            <AiConsultantPanel onAssistantCompleted={loadBudgetData} />
          </div>
        </div>
      </div>
    </div>
  );
}
