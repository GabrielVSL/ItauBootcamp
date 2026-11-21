"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Loader2,
  Minus,
  Plus,
  ShoppingBag,
  Tag,
  Trash2,
  Truck,
  Wallet,
  X,
} from "lucide-react";
import {
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
import { CustomSelect } from "@/components/ui/CustomSelect";

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
  onClose?: () => void;
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
  onClose,
  onSubmitCheckout,
}: CartCheckoutPanelProps) {
  const [clienteNome, setClienteNome] = useState("Gabriel");
  const [clienteEmail, setClienteEmail] = useState("gabriel@email.com");
  const [modalidadeFrete, setModalidadeFrete] =
    useState<ModalidadeFrete>("PAC");
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [cupomInput, setCupomInput] = useState("");
  const [syncToBudget, setSyncToBudget] = useState(true);

  // Categoria automática: se todos os itens forem da mesma categoria, usa ela; se misturados, usa "OTHER" (Outros/Geral)
  const autoCategory: TransactionCategory = useMemo(() => {
    if (cart.length === 0) return "OTHER";
    const uniqueCategories = new Set(
      cart.map((entry) => entry.product.budgetCategory),
    );
    if (uniqueCategories.size === 1) {
      return Array.from(uniqueCategories)[0];
    }
    return "OTHER";
  }, [cart]);

  const paymentOptions = useMemo(
    () =>
      (Object.keys(PAYMENT_LABELS) as FormaPagamento[]).map((pay) => ({
        value: pay,
        label: PAYMENT_LABELS[pay],
      })),
    [],
  );

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

  const totalUnits = cart.reduce((acc, i) => acc + i.quantidade, 0);

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
      budgetCategory: autoCategory,
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-full flex-col bg-white text-[#141413]"
    >
      {/* Topo fixo do Sidebar Drawer */}
      <div className="flex items-center justify-between border-b border-[#EAE9E4] px-6 py-4">
        <div className="flex items-center gap-2.5">
          <ShoppingBag className="h-4.5 w-4.5 text-[#FF6200]" />
          <h2 className="text-[16px] font-semibold tracking-[-0.02em]">
            Carrinho
          </h2>
          <span className="rounded-full bg-[#F5F4F1] px-2 py-0.5 text-[11px] font-semibold tabular-nums text-[#57554F]">
            {totalUnits} {totalUnits === 1 ? "item" : "itens"}
          </span>
        </div>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar carrinho"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#57554F] transition hover:bg-[#F5F4F1] hover:text-[#141413]"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        )}
      </div>

      {/* Corpo com rolagem interna */}
      <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
        {/* Barra de progresso Frete PAC Grátis */}
        <div className="rounded-2xl bg-[#FAF9F7] p-3.5 ring-1 ring-[#EAE9E4]">
          <div className="flex items-center justify-between text-xs font-medium text-[#141413]">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="h-3.5 w-3.5 text-[#FF6200]" />
              Frete PAC grátis acima de R$ 500
            </span>
            <span className="tabular-nums text-[#6E6C66]">
              {pacProgressPct}%
            </span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EAE8E3]">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                pricing.pacGratisAtingido ? "bg-emerald-500" : "bg-[#FF6200]"
              }`}
              style={{ width: `${pacProgressPct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11.5px] text-[#6E6C66]">
            {pricing.pacGratisAtingido ? (
              <span className="font-medium text-emerald-700">
                Frete PAC grátis desbloqueado!
              </span>
            ) : (
              <>
                Faltam{" "}
                <strong className="font-semibold tabular-nums text-[#141413]">
                  {formatBRL(pricing.faltaParaPacGratis)}
                </strong>{" "}
                para frete grátis.
              </>
            )}
          </p>
        </div>

        {/* Lista de Itens */}
        {cart.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#E5E3DD] bg-[#FAF9F7] py-10 text-center">
            <ShoppingBag className="mx-auto h-7 w-7 text-[#C5C3BC]" />
            <p className="mt-2.5 text-xs font-medium text-[#6E6C66]">
              Seu carrinho está vazio.
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {cart.map(({ product, quantidade }) => (
              <li
                key={product.produtoId}
                className="flex items-center justify-between gap-2 rounded-2xl border border-[#EAE9E4] bg-white p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-[#141413]">
                    {product.nomeProduto}
                  </p>
                  <p className="mt-0.5 text-[11.5px] tabular-nums text-[#7A7872]">
                    {formatBRL(product.precoUnitario)}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onUpdateQty(product.produtoId, -1)}
                    className="rounded-full border border-[#E5E3DD] bg-white p-1 text-[#57554F] hover:bg-[#F5F4F1]"
                    aria-label="Diminuir quantidade"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-semibold tabular-nums text-[#141413]">
                    {quantidade}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateQty(product.produtoId, 1)}
                    className="rounded-full border border-[#E5E3DD] bg-white p-1 text-[#57554F] hover:bg-[#F5F4F1]"
                    aria-label="Aumentar quantidade"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveItem(product.produtoId)}
                    className="ml-0.5 rounded-full p-1 text-[#9A9892] hover:bg-rose-50 hover:text-rose-600"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {/* Dados e opções de entrega/pagamento */}
        <div className="space-y-4 border-t border-[#F0EFEA] pt-4">
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-[#57554F]">
                Nome
              </label>
              <input
                type="text"
                required
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full rounded-xl border border-[#E5E3DD] bg-[#FAF9F7] px-3 py-2 text-xs text-[#141413] outline-none focus:border-[#141413] focus:bg-white"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] font-medium text-[#57554F]">
                E-mail
              </label>
              <input
                type="email"
                required
                value={clienteEmail}
                onChange={(e) => setClienteEmail(e.target.value)}
                className="w-full rounded-xl border border-[#E5E3DD] bg-[#FAF9F7] px-3 py-2 text-xs text-[#141413] outline-none focus:border-[#141413] focus:bg-white"
              />
            </div>
          </div>

          {/* Entrega */}
          <div>
            <label className="mb-1.5 flex items-center justify-between text-[11.5px] font-medium text-[#57554F]">
              <span>Entrega</span>
              <span className="tabular-nums text-[#8A8882]">
                {pesoTotalKg.toFixed(2).replace(".", ",")} kg
              </span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(["PAC", "SEDEX"] as ModalidadeFrete[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setModalidadeFrete(mode)}
                  className={`rounded-xl border px-3 py-2 text-left text-xs transition ${
                    modalidadeFrete === mode
                      ? "border-[#141413] bg-[#141413] font-semibold text-white"
                      : "border-[#E5E3DD] bg-white text-[#57554F] hover:border-[#141413]"
                  }`}
                >
                  <span className="block">{mode}</span>
                  <span className="mt-0.5 block text-[10.5px] font-normal opacity-75">
                    {mode === "PAC"
                      ? pricing.pacGratisAtingido
                        ? "Grátis"
                        : "R$ 12,90 + peso"
                      : "R$ 24,90 + peso"}
                  </span>
                </button>
              ))}
            </div>
            <p className="sr-only">{FREIGHT_LABELS[modalidadeFrete]}</p>
          </div>

          {/* Cupom */}
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="inline-flex items-center gap-1 text-[11.5px] font-medium text-[#57554F]">
                <Tag className="h-3.5 w-3.5 text-[#FF6200]" />
                Cupom de desconto
              </label>
              <div className="flex gap-1.5">
                {["DEV10", "BEMVINDO20"].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() =>
                      setCupomInput((prev) => (prev === code ? "" : code))
                    }
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition ${
                      cupomInput.toUpperCase() === code
                        ? "bg-[#141413] text-white"
                        : "bg-[#F5F4F1] text-[#57554F] hover:bg-[#EAE8E3]"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            </div>
            <input
              type="text"
              placeholder="Digite um cupom (ex: DEV10)"
              value={cupomInput}
              onChange={(e) => setCupomInput(e.target.value)}
              className="w-full rounded-xl border border-[#E5E3DD] bg-[#FAF9F7] px-3 py-2 text-xs uppercase text-[#141413] outline-none placeholder:normal-case focus:border-[#141413] focus:bg-white"
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

          {/* Pagamento (CustomSelect padronizado) */}
          <div>
            <label className="mb-1.5 inline-flex items-center gap-1 text-[11.5px] font-medium text-[#57554F]">
              <CreditCard className="h-3.5 w-3.5 text-[#FF6200]" />
              Forma de pagamento
            </label>
            <CustomSelect
              value={formaPagamento}
              options={paymentOptions}
              onChange={(val) => setFormaPagamento(val)}
              ariaLabel="Forma de pagamento"
            />
            {boletoOverLimit && (
              <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                Boleto está disponível apenas para compras até R$ 5.000.
              </p>
            )}
          </div>

          {/* Lançamento automático nas Finanças (categoria detectada automaticamente) */}
          <div className="rounded-2xl bg-[#FAF9F7] p-3.5 ring-1 ring-[#EAE9E4]">
            <label className="flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={syncToBudget}
                onChange={(e) => setSyncToBudget(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-[#D4D2CC] accent-[#FF6200]"
              />
              <span className="text-xs leading-snug text-[#141413]">
                <strong className="block font-semibold">
                  Lançar compra nas minhas finanças
                </strong>
                <span className="text-[11px] text-[#7A7872]">
                  {cart.length > 0
                    ? `Categoria automática: ${CATEGORY_META[autoCategory].label}`
                    : "Categoria definida automaticamente pelos itens."}
                </span>
              </span>
            </label>
          </div>

          {/* Impacto no saldo */}
          {budgetSummary && (
            <div
              className={`rounded-2xl border p-3.5 text-xs ${
                willEnterDeficit
                  ? "border-rose-200 bg-rose-50 text-rose-950"
                  : "border-[#EAE9E4] bg-white text-[#141413]"
              }`}
            >
              <div className="flex items-center justify-between font-medium">
                <span className="inline-flex items-center gap-1.5 text-[#57554F]">
                  <Wallet className="h-3.5 w-3.5 text-[#FF6200]" />
                  Saldo após esta compra
                </span>
                <span
                  className={`font-semibold tabular-nums ${
                    willEnterDeficit ? "text-rose-700" : "text-emerald-700"
                  }`}
                >
                  {formatBRL(projectedBalance ?? 0)}
                </span>
              </div>
              {willEnterDeficit && (
                <p className="mt-1.5 text-[11px] font-medium text-rose-800">
                  Atenção: esta compra deixará seu saldo negativo.
                </p>
              )}
            </div>
          )}

          {lastError && (
            <ApiErrorBanner error={lastError} onDismiss={onClearError} />
          )}
        </div>
      </div>

      {/* Rodapé fixo do Drawer com totais + botão Finalizar */}
      <div className="border-t border-[#EAE9E4] bg-[#FAF9F7] px-6 py-4">
        <div className="space-y-1 text-xs tabular-nums">
          <div className="flex justify-between text-[#6E6C66]">
            <span>Subtotal</span>
            <span>{formatBRL(pricing.valorItens)}</span>
          </div>
          <div className="flex justify-between text-[#6E6C66]">
            <span>Frete ({modalidadeFrete})</span>
            <span
              className={
                pricing.valorFrete === 0 && pricing.valorItens > 0
                  ? "font-semibold text-emerald-700"
                  : ""
              }
            >
              {pricing.valorFrete === 0 && pricing.valorItens > 0
                ? "Grátis"
                : formatBRL(pricing.valorFrete)}
            </span>
          </div>
          {pricing.valorDesconto > 0 && (
            <div className="flex justify-between font-medium text-emerald-700">
              <span>Desconto</span>
              <span>- {formatBRL(pricing.valorDesconto)}</span>
            </div>
          )}
          <div className="flex items-baseline justify-between pt-2 text-[17px] font-semibold text-[#141413]">
            <span>Total</span>
            <span>{formatBRL(pricing.valorTotal)}</span>
          </div>
        </div>

        <button
          type="submit"
          disabled={cart.length === 0 || submitting}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-[#FF6200] px-5 py-3.5 text-[13.5px] font-semibold text-white shadow-[0_12px_28px_-10px_rgba(255,98,0,0.65)] transition hover:bg-[#E05200] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Finalizando...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              Finalizar pedido
            </>
          )}
        </button>
      </div>
    </form>
  );
}
