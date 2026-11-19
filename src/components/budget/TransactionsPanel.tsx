"use client";

import React, { useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  Loader2,
  Plus,
  ReceiptText,
} from "lucide-react";
import {
  TRANSACTION_CATEGORIES,
  type TransactionCategory,
  type TransactionRequest,
  type TransactionResponse,
  type TransactionType,
} from "@/types/budget";
import type { NormalizedApiError } from "@/types/bff";
import { useAppStatus } from "@/context/AppStatusContext";
import { CATEGORY_META, formatBRL, formatDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";

interface TransactionsPanelProps {
  transactions: TransactionResponse[];
  loading: boolean;
  filterCategory: TransactionCategory | "";
  filterType: TransactionType | "";
  onChangeFilterCategory: (val: TransactionCategory | "") => void;
  onChangeFilterType: (val: TransactionType | "") => void;
  onCreateTransaction: (
    payload: TransactionRequest,
  ) => Promise<{ ok: boolean; error?: NormalizedApiError }>;
}

export function TransactionsPanel({
  transactions,
  loading,
  filterCategory,
  filterType,
  onChangeFilterCategory,
  onChangeFilterType,
  onCreateTransaction,
}: TransactionsPanelProps) {
  const { hideBalances } = useAppStatus();
  const masked = (val: string) => (hideBalances ? "R$ •••" : val);

  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [category, setCategory] = useState<TransactionCategory>("FOOD");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<NormalizedApiError | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);

    const parsedAmount = Number(amount.replace(",", "."));
    if (
      !description.trim() ||
      !Number.isFinite(parsedAmount) ||
      parsedAmount <= 0
    ) {
      setFormError({
        status: 400,
        title: "Validação do formulário",
        message: "Informe uma descrição válida e um valor maior que zero.",
        details: [],
        service: "budget",
      });
      return;
    }

    setSaving(true);
    const result = await onCreateTransaction({
      description: description.trim(),
      amount: parsedAmount,
      type,
      category,
    });
    setSaving(false);

    if (!result.ok && result.error) {
      setFormError(result.error);
      return;
    }

    setDescription("");
    setAmount("");
    setType("EXPENSE");
    setCategory("FOOD");
    setModalOpen(false);
  }

  return (
    <section className="voxel-card p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F4EFE9] text-[#101828]">
            <ReceiptText className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-extrabold text-[#101828]">
              Extrato de Transações
            </h2>
            <p className="text-xs text-[#667085]">
              GET /api/v1/transactions?category=&amp;type=
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#FF6200] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm shadow-[#FF6200]/25 transition hover:bg-[#E05200]"
        >
          <Plus className="h-4 w-4" />
          Novo Lançamento
        </button>
      </div>

      {/* Barra de filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-2.5 rounded-2xl bg-[#FBF9F6] p-3">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#525D73]">
          <Filter className="h-3.5 w-3.5 text-[#FF6200]" />
          Filtros:
        </span>

        <select
          value={filterType}
          onChange={(e) =>
            onChangeFilterType(e.target.value as TransactionType | "")
          }
          aria-label="Filtrar por tipo"
          className="rounded-full border border-[#EAE3DB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#101828] outline-none focus:border-[#FF6200]"
        >
          <option value="">Todos os tipos</option>
          <option value="INCOME">Receitas (INCOME)</option>
          <option value="EXPENSE">Despesas (EXPENSE)</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) =>
            onChangeFilterCategory(e.target.value as TransactionCategory | "")
          }
          aria-label="Filtrar por categoria"
          className="rounded-full border border-[#EAE3DB] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#101828] outline-none focus:border-[#FF6200]"
        >
          <option value="">Todas as categorias</option>
          {TRANSACTION_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_META[cat].label} ({cat})
            </option>
          ))}
        </select>

        {(filterCategory || filterType) && (
          <button
            type="button"
            onClick={() => {
              onChangeFilterCategory("");
              onChangeFilterType("");
            }}
            className="px-2 text-xs font-bold text-[#FF6200] hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Lista do Extrato */}
      <div className="mt-4 divide-y divide-[#F2ECE6]">
        {loading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-14 animate-pulse rounded-2xl bg-[#F4EFE9]"
              />
            ))}
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-xs text-[#667085]">
            Nenhuma transação encontrada para os filtros selecionados.
          </div>
        ) : (
          transactions.map((tx) => {
            const meta = CATEGORY_META[tx.category] ?? CATEGORY_META.OTHER;
            const isIncome = tx.type === "INCOME";

            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-4 py-3.5 transition hover:bg-[#FBF9F6]"
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
                    <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[#667085]">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${meta.bgClass} ${meta.textClass}`}
                      >
                        {meta.label}
                      </span>
                      <span className="font-mono text-[10px] text-[#98A2B3]">
                        #{tx.id}
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
                  {isIncome ? "+" : "-"} {masked(formatBRL(tx.amount))}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Modal de Novo Lançamento */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo Lançamento Financeiro"
        subtitle="POST /api/v1/transactions no Smart Budget Spring AI"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <ApiErrorBanner error={formError} />}

          <div>
            <label className="mb-1 block text-xs font-bold text-[#344054]">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType("EXPENSE");
                  if (category === "SALARY") setCategory("FOOD");
                }}
                className={`rounded-2xl border px-3 py-2.5 text-xs font-extrabold transition ${
                  type === "EXPENSE"
                    ? "border-[#FF6200] bg-[#FFF4EC] text-[#C84A00]"
                    : "border-[#EAE3DB] text-[#525D73] hover:bg-[#FBF9F6]"
                }`}
              >
                Despesa (EXPENSE)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("INCOME");
                  setCategory("SALARY");
                }}
                className={`rounded-2xl border px-3 py-2.5 text-xs font-extrabold transition ${
                  type === "INCOME"
                    ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                    : "border-[#EAE3DB] text-[#525D73] hover:bg-[#FBF9F6]"
                }`}
              >
                Receita (INCOME)
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-[#344054]">
              Descrição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Almoço de equipe ou Salário mensal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#FF6200] focus:bg-white focus:ring-2 focus:ring-[#FF6200]/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-bold text-[#344054]">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#FF6200] focus:bg-white focus:ring-2 focus:ring-[#FF6200]/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold text-[#344054]">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as TransactionCategory)
                }
                className="w-full rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] px-3.5 py-2.5 text-sm text-[#101828] outline-none focus:border-[#FF6200] focus:bg-white focus:ring-2 focus:ring-[#FF6200]/15"
              >
                {TRANSACTION_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_META[cat].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-full border border-[#EAE3DB] px-4 py-2 text-xs font-bold text-[#525D73] hover:bg-[#FBF9F6]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6200] px-5 py-2 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#E05200] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salvar Transação
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
