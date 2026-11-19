"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShoppingCart,
  Tag,
  Trash2,
  Truck,
  Wallet,
} from "lucide-react";
import {
  TRANSACTION_CATEGORIES,
  type FinancialSummaryResponse,
  type TransactionCategory,
} from "@/types/budget";
import type { FormaPagamento, ModalidadeFrete } from "@/types/checkout";
import type {
  CheckoutWithBudgetResponse,
  NormalizedApiError,
} from "@/types/bff";
import {
  PAC_FREE_THRESHOLD,
  estimateCheckoutPricing,
  type CatalogProduct,
} from "@/lib/catalog";
import {
  CATEGORY_META,
  FREIGHT_LABELS,
  PAYMENT_LABELS,
  formatBRL,
} from "@/lib/format";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";

export interface CartEntry {
  product: CatalogProduct;
  quantidade: number;
}

interface CartCheckoutPanelProps {
  cart: CartEntry[];
  budgetSummary: FinancialSummaryResponse | null;
  submitting: boolean;
  lastError: NormalizedApiError | null;
  onClearError: () => void;
  onUpdateQty: (produtoId: string, delta: number) => void;
  onRemoveItem: (produtoId: string) => void;
  onSubmitCheckout: (params: {
    clienteNome: string;
    clienteEmail: string;
    modalidadeFrete: ModalidadeFrete;
    formaPagamento: FormaPagamento;
    cupomDesconto: string | null;
    syncToBudget: boolean;
    budgetCategory: TransactionCategory;
  }) => Promise<CheckoutWithBudgetResponse | null>;
}

export function CartCheckoutPanel({
  cart,
  budgetSummary,
  submitting,
  lastError,
  onClearError,
  onUpdateQty,
  onRemoveItem,
  onSubmitCheckout,
}: CartCheckoutPanelProps) {
  const [clienteNome, setClienteNome] = useState("Gabriel Dev");
  const [clienteEmail, setClienteEmail] = useState("gabriel@itau-bootcamp.dev");
  const [modalidadeFrete, setModalidadeFrete] =
    useState<ModalidadeFrete>("PAC");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [cupomInput, setCupomInput] = useState("");
  const [syncToBudget, setSyncToBudget] = useState(true);
  const [customCategory, setCustomCategory] =
    useState<TransactionCategory | null>(null);

  const defaultCategory: TransactionCategory = useMemo(() => {
    if (cart.length === 0) return "TECH";
    const dominant = [...cart].sort(
      (a, b) =>
        b.product.precoUnitario * b.quantidade -
        a.product.precoUnitario * a.quantidade,
    )[0];
    return dominant?.product.budgetCategory ?? "TECH";
  }, [cart]);

  const selectedCategory = customCategory ?? defaultCategory;

  const pesoTotalKg = useMemo(
    () =>
      Math.round(
        cart.reduce(
          (acc, entry) => acc + entry.product.pesoKg * entry.quantidade,
          0,
        ) * 100,
      ) / 100,
    [cart],
  );

  const checkoutItems = useMemo(
    () =>
      cart.map((entry) => ({
        produtoId: entry.product.produtoId,
        nomeProduto: entry.product.nomeProduto,
        quantidade: entry.quantidade,
        precoUnitario: entry.product.precoUnitario,
      })),
    [cart],
  );

  const pricing = useMemo(
    () =>
      estimateCheckoutPricing(
        checkoutItems,
        modalidadeFrete,
        cupomInput.trim() || null,
        pesoTotalKg,
      ),
    [checkoutItems, modalidadeFrete, cupomInput, pesoTotalKg],
  );

  const pacProgressPct = Math.min(
    100,
    Math.round((pricing.valorItens / PAC_FREE_THRESHOLD) * 100),
  );

  const projectedBalance =
    budgetSummary != null
      ? Math.round((budgetSummary.netBalance - pricing.valorTotal) * 100) / 100
      : null;

  const willEnterDeficit =
    projectedBalance !== null && pricing.valorTotal > 0 && projectedBalance < 0;

  const boletoOverLimit =
    formaPagamento === "BOLETO" && pricing.valorItens > 5000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (cart.length === 0) return;

    await onSubmitCheckout({
      clienteNome: clienteNome.trim(),
      clienteEmail: clienteEmail.trim(),
      modalidadeFrete,
      formaPagamento,
      cupomDesconto: cupomInput.trim() ? cupomInput.trim().toUpperCase() : null,
      syncToBudget,
      budgetCategory: selectedCategory,
    });
  }

  return (
    <aside className="sticky top-24 space-y-4">
      <form onSubmit={handleSubmit} className="voxel-card p-5">
        <div className="flex items-center justify-between border-b border-[#F2ECE6] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#FFF4EC] text-[#FF6200]">
              <ShoppingCart className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold text-[#101828]">
                Resumo da Compra
              </h2>
              <p className="text-[11px] text-[#667085]">
                Orquestrado via BFF → Checkout + Budget
              </p>
            </div>
          </div>
          <span className="rounded-full bg-[#101828] px-2.5 py-0.5 text-xs font-extrabold tabular-nums text-white">
            {cart.reduce((acc, i) => acc + i.quantidade, 0)} un.
          </span>
        </div>

        {/* Barra de progresso Frete PAC Grátis (R$ 500) */}
        <div className="mt-4 rounded-2xl border border-[#F5D6BE] bg-[#FFF8F3] p-3.5">
          <div className="flex items-center justify-between text-xs font-bold text-[#101828]">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-[#FF6200]" />
              Frete PAC Grátis (≥ R$ 500)
            </span>
            <span className="tabular-nums text-[#E05200]">
              {pacProgressPct}%
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#F2E2D5]">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                pricing.pacGratisAtingido
                  ? "bg-emerald-500"
                  : "bg-gradient-to-r from-[#FF6200] to-[#FF8A3D]"
              }`}
              style={{ width: `${pacProgressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[#525D73]">
            {pricing.pacGratisAtingido ? (
              <span className="font-bold text-emerald-700">
                Desbloqueado! Frete PAC Grátis ativo (Strategy Pattern).
              </span>
            ) : (
              <>
                Faltam{" "}
                <strong className="tabular-nums text-[#101828]">
                  {formatBRL(pricing.faltaParaPacGratis)}
                </strong>{" "}
                em itens para zerar o frete PAC.
              </>
            )}
          </p>
        </div>

        {/* Itens no Carrinho */}
        <div className="mt-4">
          {cart.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#EAE3DB] bg-[#FBF9F6] py-8 text-center">
              <ShoppingCart className="mx-auto h-7 w-7 text-[#C5BCB2]" />
              <p className="mt-2 text-xs font-medium text-[#667085]">
                Seu carrinho está vazio. Adicione itens da vitrine ao lado.
              </p>
            </div>
          ) : (
            <ul className="max-h-52 space-y-2 overflow-y-auto pr-1">
              {cart.map(({ product, quantidade }) => (
                <li
                  key={product.produtoId}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-[#F2ECE6] bg-[#FBF9F6] p-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-[#101828]">
                      {product.nomeProduto}
                    </p>
                    <p className="text-[11px] tabular-nums text-[#667085]">
                      {formatBRL(product.precoUnitario)} •{" "}
                      {(product.pesoKg * quantidade).toFixed(2).replace(".", ",")}{" "}
                      kg
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(product.produtoId, -1)}
                      className="rounded-full border border-[#EAE3DB] bg-white p-1 text-[#525D73] hover:bg-[#F4EFE9]"
                      aria-label="Diminuir quantidade"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-extrabold tabular-nums text-[#101828]">
                      {quantidade}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(product.produtoId, 1)}
                      className="rounded-full border border-[#EAE3DB] bg-white p-1 text-[#525D73] hover:bg-[#F4EFE9]"
                      aria-label="Aumentar quantidade"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onRemoveItem(product.produtoId)}
                      className="ml-0.5 rounded-full p-1 text-[#98A2B3] hover:bg-rose-50 hover:text-rose-600"
                      aria-label="Remover item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Dados do cliente + regras */}
        <div className="mt-4 space-y-3 border-t border-[#F2ECE6] pt-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#525D73]">
                Nome
              </label>
              <input
                type="text"
                required
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] px-3 py-2 text-xs text-[#101828] outline-none focus:border-[#FF6200] focus:bg-white focus:ring-2 focus:ring-[#FF6200]/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-[#525D73]">
                E-mail
              </label>
              <input
                type="email"
                required
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="w-full rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] px-3 py-2 text-xs text-[#101828] outline-none focus:border-[#FF6200] focus:bg-white focus:ring-2 focus:ring-[#FF6200]/15"
              />
            </div>
          </div>

          {/* Frete (Strategy) */}
          <div>
            <label className="mb-1 flex items-center justify-between text-[11px] font-semibold text-[#525D73]">
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 text-[#FF6200]" />
                Frete (Strategy)
              </span>
              <span className="tabular-nums text-[#98A2B3]">
                {pesoTotalKg.toFixed(2).replace(".", ",")} kg
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["PAC", "SEDEX"] as ModalidadeFrete[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModalidadeFrete(mode)}
                  className={`rounded-2xl border px-3 py-2 text-left text-xs transition ${
                    modalidadeFrete === mode
                      ? "border-[#FF6200] bg-[#FFF4EC] font-extrabold text-[#C84A00]"
                      : "border-[#EAE3DB] bg-white text-[#525D73] hover:bg-[#FBF9F6]"
                  }`}
                >
                  <span className="block">{mode}</span>
                  <span className="mt-0.5 block text-[10px] font-normal opacity-80">
                    {mode === "PAC"
                      ? pricing.pacGratisAtingido
                        ? "Grátis!"
                        : "R$ 12,90 + R$ 2,10/kg"
                      : "R$ 24,90 + R$ 4,50/kg"}
                  </span>
                </button>
              ))}
            </div>
            <p className="sr-only">{FREIGHT_LABELS[modalidadeFrete]}</p>
          </div>

          {/* Cupom (Chain Elo 3) */}
          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#525D73]">
                <Tag className="h-3.5 w-3.5 text-[#FF6200]" />
                Cupom (Chain Elo 3)
              </label>
              <div className="flex gap-1.5">
                {["DEV10", "BEMVINDO20"].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      setCupomInput((prev) => (prev === code ? "" : code))
                    }
                    className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition ${
                      cupomInput.toUpperCase() === code
                        ? "bg-[#101828] text-white"
                        : "bg-[#F4EFE9] text-[#525D73] hover:bg-[#EAE3DB]"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="DEV10 (10%) ou BEMVINDO20 (20% mín. R$100)"
              value={cupomInput}
              onChange={(e) => setCupomInput(e.target.value)}
              className="w-full rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] px-3 py-2 text-xs uppercase text-[#101828] outline-none placeholder:normal-case focus:border-[#FF6200] focus:bg-white focus:ring-2 focus:ring-[#FF6200]/15"
            />
            {pricing.cupomHint && (
              <p
                className={`mt-1 text-[11px] font-medium ${
                  pricing.cupomStatus === "applied"
                    ? "text-emerald-700"
                    : "text-amber-700"
                }`}
              >
                {pricing.cupomHint}
              </p>
            )}
          </div>

          {/* Pagamento (Chain Elo 2) */}
          <div>
            <label className="mb-1 inline-flex items-center gap-1 text-[11px] font-semibold text-[#525D73]">
              <CreditCard className="h-3.5 w-3.5 text-[#FF6200]" />
              Pagamento (Chain Elo 2)
            </label>
            <select
              value={formaPagamento}
              onChange={(e) =>
                setFormaPagamento(e.target.value as FormaPagamento)
              }
              className="w-full rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] px-3 py-2 text-xs font-semibold text-[#101828] outline-none focus:border-[#FF6200] focus:bg-white focus:ring-2 focus:ring-[#FF6200]/15"
            >
              {(Object.keys(PAYMENT_LABELS) as FormaPagamento[]).map((pay) => (
                <option key={pay} value={pay}>
                  {PAYMENT_LABELS[pay]}
                </option>
              ))}
            </select>
            {boletoOverLimit && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Itens excedem R$ 5.000: Boleto retornará HTTP 422 no Elo 2.
              </p>
            )}
          </div>

          {/* Sync Smart Budget */}
          <div className="rounded-2xl border border-[#EAE3DB] bg-[#FBF9F6] p-3">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={syncToBudget}
                onChange={(e) => setSyncToBudget(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#D6CDC3] accent-[#FF6200]"
              />
              <span className="text-xs leading-snug text-[#101828]">
                <strong className="block font-bold">
                  Lançar compra automaticamente no Smart Budget
                </strong>
                <span className="text-[11px] text-[#667085]">
                  Orquestração via{" "}
                  <code className="font-mono">
                    POST /api/bff/checkout-with-budget
                  </code>
                </span>
              </span>
            </label>

            {syncToBudget && (
              <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#EAE3DB] pt-2.5">
                <span className="text-[11px] font-semibold text-[#525D73]">
                  Categoria:
                </span>
                <select
                  value={selectedCategory}
                  onChange={(e) =>
                    setCustomCategory(e.target.value as TransactionCategory)
                  }
                  className="rounded-lg border border-[#EAE3DB] bg-white px-2.5 py-1 text-xs font-bold text-[#101828]"
                >
                  {TRANSACTION_CATEGORIES.filter((c) => c !== "SALARY").map(
                    (cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_META[cat].label} ({cat})
                      </option>
                    ),
                  )}
                </select>
              </div>
            )}
          </div>

          {/* Previsão de impacto financeiro */}
          <div
            className={`rounded-2xl border p-3.5 text-xs ${
              willEnterDeficit
                ? "border-rose-300 bg-rose-50 text-rose-950"
                : "border-[#EAE3DB] bg-white text-[#101828]"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold">
              <Wallet
                className={`h-3.5 w-3.5 ${
                  willEnterDeficit ? "text-rose-600" : "text-[#001E62]"
                }`}
              />
              Impacto no Smart Budget
            </div>

            {budgetSummary ? (
              <div className="mt-2 space-y-1 text-[11px] tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[#667085]">Saldo atual:</span>
                  <span className="font-semibold">
                    {formatBRL(budgetSummary.netBalance)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#667085]">Total desta compra:</span>
                  <span className="font-semibold text-rose-700">
                    - {formatBRL(pricing.valorTotal)}
                  </span>
                </div>
                <div className="flex justify-between border-t border-[#EAE3DB] pt-1.5 text-xs font-extrabold">
                  <span>Saldo após compra:</span>
                  <span
                    className={
                      willEnterDeficit ? "text-rose-700" : "text-emerald-700"
                    }
                  >
                    {formatBRL(projectedBalance ?? 0)}
                  </span>
                </div>
                {willEnterDeficit && (
                  <p className="mt-1.5 flex items-start gap-1.5 rounded-xl bg-rose-100/80 p-2 text-[11px] font-semibold text-rose-900">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Atenção: esta compra deixará seu Smart Budget em déficit!
                  </p>
                )}
              </div>
            ) : (
              <p className="mt-1 text-[11px] text-[#667085]">
                Conecte o Smart Budget (ou ative o Modo Demo) para ver a
                projeção do seu saldo líquido.
              </p>
            )}
          </div>
        </div>

        {/* Totais */}
        <div className="mt-4 space-y-1.5 border-t border-[#F2ECE6] pt-3.5 text-xs tabular-nums">
          <div className="flex justify-between text-[#667085]">
            <span>Subtotal dos itens</span>
            <span>{formatBRL(pricing.valorItens)}</span>
          </div>
          <div className="flex justify-between text-[#667085]">
            <span>Frete ({modalidadeFrete})</span>
            <span
              className={
                pricing.valorFrete === 0 && pricing.valorItens > 0
                  ? "font-bold text-emerald-700"
                  : ""
              }
            >
              {pricing.valorFrete === 0 && pricing.valorItens > 0
                ? "GRÁTIS"
                : formatBRL(pricing.valorFrete)}
            </span>
          </div>
          {pricing.valorDesconto > 0 && (
            <div className="flex justify-between font-bold text-emerald-700">
              <span>Desconto ({cupomInput.trim().toUpperCase()})</span>
              <span>- {formatBRL(pricing.valorDesconto)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between border-t border-[#EAE3DB] pt-2.5 font-display text-lg font-extrabold text-[#101828]">
            <span>Total</span>
            <span>{formatBRL(pricing.valorTotal)}</span>
          </div>
        </div>

        {lastError && (
          <ApiErrorBanner
            error={lastError}
            onDismiss={onClearError}
            className="mt-4"
          />
        )}

        <button
          type="submit"
          disabled={cart.length === 0 || submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6200] px-5 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#FF6200]/25 transition hover:bg-[#E05200] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processando Checkout...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Finalizar Pedido
            </>
          )}
        </button>
      </form>
    </aside>
  );
}
