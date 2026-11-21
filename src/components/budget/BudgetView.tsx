"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
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

export function BudgetView() {
  const { demoMode, budgetVersion } = useAppStatus();
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

  const requestSeqRef = useRef(0);

  const loadBudgetData = useCallback(async () => {
    const seq = ++requestSeqRef.current;
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

    if (seq !== requestSeqRef.current) return;

    if (summaryRes.status === "fulfilled") {
      const payload = await summaryRes.value.json();
      if (seq !== requestSeqRef.current) return;
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
      if (seq !== requestSeqRef.current) return;
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
        if (seq !== requestSeqRef.current) return;
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

    if (seq === requestSeqRef.current) {
      setLoading(false);
    }
  }, [demoMode, filterCategory, filterType]);

  useEffect(() => {
    void loadBudgetData();
  }, [loadBudgetData, budgetVersion]);

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
      {/* Cabeçalho enxuto */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#141413] sm:text-3xl">
            Finanças
          </h1>
          <p className="mt-1 text-[13.5px] text-[#6E6C66]">
            Acompanhe receitas, despesas por categoria e seu extrato completo.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadBudgetData()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE9E4] bg-white px-4 py-2 text-[12.5px] font-medium text-[#57554F] transition hover:border-[#141413] hover:text-[#141413]"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Atualizar
        </button>
      </div>

      {loadError && !demoMode && <ApiErrorBanner error={loadError} />}

      <BudgetSummaryCards summary={summary} loading={loading} />

      {/* Faixa horizontal minimizável de Despesas por Categoria em largura total */}
      <CategoryExpenseChart
        transactions={allTransactions}
        loading={loading}
      />

      {/* Extrato em largura total com altura fixa e paginação */}
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
  );
}
