"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  Plus,
} from "lucide-react";
import {
  TRANSACTION_CATEGORIES,
  type TransactionCategory,
  type TransactionRequest,
  type TransactionResponse,
  type TransactionType,
} from "@/types/budget";
import type { PedidoResponse } from "@/types/checkout";
import type { NormalizedApiError } from "@/types/bff";
import { useAppStatus } from "@/context/AppStatusContext";
import { getDemoOrderById } from "@/lib/demo-store";
import {
  CATEGORY_META,
  PAYMENT_LABELS,
  formatBRL,
  formatDateTime,
} from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";
import { CustomSelect, type SelectOption } from "@/components/ui/CustomSelect";

const PAGE_SIZE = 5;

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

function extractOrderIdFromDescription(desc: string): string | null {
  const match = /Pedido\s+#(\d+)/i.exec(desc);
  return match ? match[1] : null;
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
  const { hideBalances, demoMode } = useAppStatus();
  const masked = (val: string) => (hideBalances ? "R$ •••" : val);

  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [category, setCategory] = useState<TransactionCategory>("FOOD");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<NormalizedApiError | null>(null);

  // Estado do modal de detalhes da movimentação clicada
  const [selectedTx, setSelectedTx] = useState<TransactionResponse | null>(null);
  const [linkedOrder, setLinkedOrder] = useState<PedidoResponse | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(false);

  // Sempre volta para página 1 quando os filtros mudam
  useEffect(() => {
    setPage(1);
  }, [filterCategory, filterType, transactions.length]);

  const totalPages = Math.max(1, Math.ceil(transactions.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  const pagedTransactions = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return transactions.slice(start, start + PAGE_SIZE);
  }, [transactions, safePage]);

  const filterCategoryOptions: SelectOption<TransactionCategory | "">[] =
    useMemo(
      () => [
        { value: "", label: "Todas as categorias" },
        ...TRANSACTION_CATEGORIES.map((cat) => ({
          value: cat,
          label: CATEGORY_META[cat].label,
        })),
      ],
      [],
    );

  const formCategoryOptions: SelectOption<TransactionCategory>[] = useMemo(
    () =>
      TRANSACTION_CATEGORIES.map((cat) => ({
        value: cat,
        label: CATEGORY_META[cat].label,
      })),
    [],
  );

  async function openTransactionDetail(tx: TransactionResponse) {
    setSelectedTx(tx);
    setLinkedOrder(null);

    const orderId = extractOrderIdFromDescription(tx.description);
    if (!orderId) return;

    if (demoMode) {
      setLinkedOrder(getDemoOrderById(orderId));
      return;
    }

    setLoadingOrder(true);
    try {
      const res = await fetch(`/api/checkout/pedidos/${orderId}`, {
        cache: "no-store",
      });
      if (res.ok) {
        setLinkedOrder((await res.json()) as PedidoResponse);
      }
    } catch {
      // Sem pedido vinculado disponível
    } finally {
      setLoadingOrder(false);
    }
  }

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
        title: "Dados inválidos",
        message: "Informe uma descrição e um valor maior que zero.",
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

  const startIdx = transactions.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(safePage * PAGE_SIZE, transactions.length);

  return (
    <section className="rounded-[22px] border border-[#EAE9E4] bg-white p-6">
      {/* Cabeçalho do extrato */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-[16.5px] font-semibold tracking-[-0.02em] text-[#141413]">
            Extrato
          </h2>
          <p className="mt-0.5 text-xs text-[#7A7872]">
            Clique em uma movimentação para ver detalhes
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFormError(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#141413] px-4 py-2.5 text-[12.5px] font-semibold text-white transition hover:bg-[#FF6200]"
        >
          <Plus className="h-4 w-4" />
          Novo lançamento
        </button>
      </div>

      {/* Barra de filtros limpa (pílulas para tipo + CustomSelect para categoria) */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-[#F0EFEA] py-3.5">
        <div
          role="group"
          aria-label="Filtrar por tipo"
          className="inline-flex items-center gap-1 rounded-full bg-[#F5F4F1] p-1"
        >
          {(
            [
              { value: "", label: "Tudo" },
              { value: "INCOME", label: "Receitas" },
              { value: "EXPENSE", label: "Despesas" },
            ] as Array<{ value: TransactionType | ""; label: string }>
          ).map((item) => {
            const active = filterType === item.value;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => onChangeFilterType(item.value)}
                className={`rounded-full px-3.5 py-1 text-[12px] font-medium transition ${
                  active
                    ? "bg-[#141413] text-white"
                    : "text-[#57554F] hover:text-[#141413]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2.5">
          <CustomSelect
            value={filterCategory}
            options={filterCategoryOptions}
            onChange={(val) => onChangeFilterCategory(val)}
            ariaLabel="Filtrar por categoria"
            size="sm"
            className="w-48"
          />

          {(filterCategory || filterType) && (
            <button
              type="button"
              onClick={() => {
                onChangeFilterCategory("");
                onChangeFilterType("");
              }}
              className="text-xs font-medium text-[#FF6200] transition hover:text-[#C84A00]"
            >
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Lista com altura mínima fixa para nunca ficar pulando a tela */}
      <div className="min-h-[345px]">
        {loading ? (
          <div className="space-y-3 py-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                className="h-[58px] animate-pulse rounded-xl bg-[#F5F4F1]"
              />
            ))}
          </div>
        ) : pagedTransactions.length === 0 ? (
          <div className="flex h-[345px] items-center justify-center text-center text-xs text-[#7A7872]">
            Nenhuma movimentação encontrada para os filtros selecionados.
          </div>
        ) : (
          <div className="divide-y divide-[#F2F0EC]">
            {pagedTransactions.map((tx) => {
              const meta = CATEGORY_META[tx.category] ?? CATEGORY_META.OTHER;
              const isIncome = tx.type === "INCOME";

              return (
                <button
                  key={tx.id}
                  type="button"
                  onClick={() => void openTransactionDetail(tx)}
                  className="group flex w-full items-center justify-between gap-4 px-2 py-3.5 text-left transition hover:bg-[#FAF9F7]"
                >
                  <div className="flex min-w-0 items-center gap-3.5">
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
                      <p className="truncate text-[14px] font-medium text-[#141413] group-hover:text-[#FF6200]">
                        {tx.description}
                      </p>
                      <p className="mt-0.5 text-[11.5px] text-[#7A7872]">
                        {meta.label} · {formatDateTime(tx.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <span
                      className={`text-[14px] font-semibold tabular-nums ${
                        isIncome ? "text-emerald-700" : "text-[#141413]"
                      }`}
                    >
                      {isIncome ? "+" : "-"} {masked(formatBRL(tx.amount))}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[#C5C3BC] transition group-hover:translate-x-0.5 group-hover:text-[#141413]" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Paginação fixa na base */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#F0EFEA] pt-4 text-xs text-[#6E6C66]">
        <span>
          {transactions.length === 0
            ? "0 movimentações"
            : `Mostrando ${startIdx}–${endIdx} de ${transactions.length}`}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={safePage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="inline-flex items-center gap-1 rounded-full border border-[#E5E3DD] bg-white px-3 py-1.5 text-[12px] font-medium text-[#141413] transition hover:border-[#141413] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Anterior
          </button>

          <span className="px-2 font-medium tabular-nums text-[#141413]">
            {safePage} / {totalPages}
          </span>

          <button
            type="button"
            disabled={safePage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="inline-flex items-center gap-1 rounded-full border border-[#E5E3DD] bg-white px-3 py-1.5 text-[12px] font-medium text-[#141413] transition hover:border-[#141413] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Próxima
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Modal de Detalhes da Movimentação */}
      <Modal
        open={Boolean(selectedTx)}
        onClose={() => {
          setSelectedTx(null);
          setLinkedOrder(null);
        }}
        title="Detalhes da movimentação"
        maxWidthClass="max-w-md"
      >
        {selectedTx && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-[#FAF9F7] p-5 text-center ring-1 ring-[#EAE9E4]">
              <p className="text-xs font-medium text-[#7A7872]">
                {selectedTx.type === "INCOME" ? "Receita" : "Despesa"} ·{" "}
                {(CATEGORY_META[selectedTx.category] ?? CATEGORY_META.OTHER)
                  .label}
              </p>
              <p
                className={`mt-1.5 text-3xl font-semibold tracking-[-0.03em] tabular-nums ${
                  selectedTx.type === "INCOME"
                    ? "text-emerald-700"
                    : "text-[#141413]"
                }`}
              >
                {selectedTx.type === "INCOME" ? "+" : "-"}{" "}
                {masked(formatBRL(selectedTx.amount))}
              </p>
              <p className="mt-2 text-sm font-medium text-[#141413]">
                {selectedTx.description}
              </p>
            </div>

            <dl className="divide-y divide-[#F0EFEA] text-xs">
              <div className="flex justify-between py-2.5">
                <dt className="text-[#7A7872]">Data e horário</dt>
                <dd className="font-medium text-[#141413]">
                  {formatDateTime(selectedTx.createdAt)}
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#7A7872]">Categoria</dt>
                <dd className="font-medium text-[#141413]">
                  {
                    (CATEGORY_META[selectedTx.category] ?? CATEGORY_META.OTHER)
                      .label
                  }
                </dd>
              </div>
              <div className="flex justify-between py-2.5">
                <dt className="text-[#7A7872]">Identificador</dt>
                <dd className="font-mono font-medium text-[#141413]">
                  #{selectedTx.id}
                </dd>
              </div>
            </dl>

            {/* Detalhes dos itens quando for uma compra da Loja */}
            {loadingOrder && (
              <div className="flex items-center justify-center gap-2 py-3 text-xs text-[#7A7872]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Carregando itens do pedido...
              </div>
            )}

            {linkedOrder && (
              <div className="rounded-2xl border border-[#EAE9E4] bg-white p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#141413]">
                    <Package className="h-3.5 w-3.5 text-[#FF6200]" />
                    Itens do pedido #{linkedOrder.pedidoId}
                  </span>
                  <span className="text-[#7A7872]">
                    {PAYMENT_LABELS[linkedOrder.formaPagamento] ??
                      linkedOrder.formaPagamento}
                  </span>
                </div>

                <ul className="mt-3 divide-y divide-[#F2F0EC] text-xs">
                  {linkedOrder.itens.map((item) => (
                    <li
                      key={`${item.produtoId}-${item.nomeProduto}`}
                      className="flex items-center justify-between gap-2 py-2"
                    >
                      <span className="truncate text-[#3F3E3A]">
                        {item.quantidade}x {item.nomeProduto}
                      </span>
                      <span className="shrink-0 font-medium tabular-nums text-[#141413]">
                        {formatBRL(item.subtotal)}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="mt-2.5 flex items-center justify-between border-t border-[#F0EFEA] pt-2.5 text-[11.5px] text-[#7A7872]">
                  <span>
                    Frete ({linkedOrder.modalidadeFrete}):{" "}
                    {linkedOrder.valorFrete === 0
                      ? "Grátis"
                      : formatBRL(linkedOrder.valorFrete)}
                  </span>
                  {linkedOrder.cupomAplicado && (
                    <span className="font-medium text-emerald-700">
                      Cupom {linkedOrder.cupomAplicado}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Modal de Novo Lançamento (limpo, sem jargões técnicos) */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Novo lançamento"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && <ApiErrorBanner error={formError} />}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#57554F]">
              Tipo
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setType("EXPENSE");
                  if (category === "SALARY") setCategory("FOOD");
                }}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  type === "EXPENSE"
                    ? "border-[#141413] bg-[#141413] text-white"
                    : "border-[#E5E3DD] text-[#57554F] hover:border-[#141413]"
                }`}
              >
                Despesa
              </button>
              <button
                type="button"
                onClick={() => {
                  setType("INCOME");
                  setCategory("SALARY");
                }}
                className={`rounded-xl border px-3 py-2.5 text-xs font-semibold transition ${
                  type === "INCOME"
                    ? "border-emerald-600 bg-emerald-600 text-white"
                    : "border-[#E5E3DD] text-[#57554F] hover:border-emerald-600"
                }`}
              >
                Receita
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-[#57554F]">
              Descrição
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Almoço ou Salário mensal"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[#E5E3DD] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#141413] outline-none focus:border-[#141413] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#57554F]">
                Valor (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="0,00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full rounded-xl border border-[#E5E3DD] bg-[#FAF9F7] px-3.5 py-2.5 text-sm text-[#141413] outline-none focus:border-[#141413] focus:bg-white"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#57554F]">
                Categoria
              </label>
              <CustomSelect
                value={category}
                options={formCategoryOptions}
                onChange={(val) => setCategory(val)}
                ariaLabel="Categoria do lançamento"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-full border border-[#E5E3DD] px-4 py-2 text-xs font-medium text-[#57554F] hover:border-[#141413] hover:text-[#141413]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#FF6200] px-5 py-2 text-xs font-semibold text-white transition hover:bg-[#E05200] disabled:opacity-60"
            >
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Salvar
            </button>
          </div>
        </form>
      </Modal>
    </section>
  );
}
