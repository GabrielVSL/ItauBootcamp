"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw, ShoppingBag, Sparkles } from "lucide-react";
import type {
  FinancialSummaryResponse,
  TransactionCategory,
} from "@/types/budget";
import type {
  CheckoutRequest,
  FormaPagamento,
  ModalidadeFrete,
  PedidoResponse,
} from "@/types/checkout";
import type {
  CheckoutWithBudgetResponse,
  NormalizedApiError,
} from "@/types/bff";
import { useAppStatus } from "@/context/AppStatusContext";
import { useToast } from "@/context/ToastContext";
import { CATALOG_PRODUCTS, type CatalogProduct } from "@/lib/catalog";
import {
  executeDemoCheckoutWithBudget,
  getDemoOrders,
  getDemoSummary,
} from "@/lib/demo-store";
import { formatBRL } from "@/lib/format";
import { ProductCatalog } from "./ProductCatalog";
import { CartCheckoutPanel, type CartEntry } from "./CartCheckoutPanel";
import { DesignPatternsLab } from "./DesignPatternsLab";
import { OrdersHistory } from "./OrdersHistory";

export function ShopView() {
  const { demoMode } = useAppStatus();
  const { notify } = useToast();

  const [cart, setCart] = useState<CartEntry[]>([
    { product: CATALOG_PRODUCTS[0], quantidade: 1 },
  ]);
  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [budgetSummary, setBudgetSummary] =
    useState<FinancialSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastError, setLastError] = useState<NormalizedApiError | null>(null);

  const loadShopContext = useCallback(async () => {
    setLoading(true);
    if (demoMode) {
      setOrders(getDemoOrders());
      setBudgetSummary(getDemoSummary());
      setLoading(false);
      return;
    }

    const [ordersRes, summaryRes] = await Promise.allSettled([
      fetch("/api/checkout/pedidos", { cache: "no-store" }),
      fetch("/api/budget/transactions/summary", { cache: "no-store" }),
    ]);

    if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
      const list = (await ordersRes.value.json()) as PedidoResponse[];
      setOrders(
        [...list].sort(
          (a, b) =>
            new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
        ),
      );
    } else {
      setOrders([]);
    }

    if (summaryRes.status === "fulfilled" && summaryRes.value.ok) {
      setBudgetSummary(
        (await summaryRes.value.json()) as FinancialSummaryResponse,
      );
    } else {
      setBudgetSummary(null);
    }

    setLoading(false);
  }, [demoMode]);

  useEffect(() => {
    void loadShopContext();
  }, [loadShopContext]);

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.product.produtoId] = item.quantidade;
    }
    return map;
  }, [cart]);

  function handleAddProduct(product: CatalogProduct) {
    setLastError(null);
    setCart((prev) => {
      const existing = prev.find(
        (e) => e.product.produtoId === product.produtoId,
      );
      if (existing) {
        return prev.map((e) =>
          e.product.produtoId === product.produtoId
            ? { ...e, quantidade: e.quantidade + 1 }
            : e,
        );
      }
      return [...prev, { product, quantidade: 1 }];
    });
  }

  function handleUpdateQty(produtoId: string, delta: number) {
    setLastError(null);
    setCart((prev) =>
      prev
        .map((entry) =>
          entry.product.produtoId === produtoId
            ? { ...entry, quantidade: entry.quantidade + delta }
            : entry,
        )
        .filter((entry) => entry.quantidade > 0),
    );
  }

  function handleRemoveItem(produtoId: string) {
    setLastError(null);
    setCart((prev) =>
      prev.filter((entry) => entry.product.produtoId !== produtoId),
    );
  }

  async function handleSubmitCheckout(params: {
    clienteNome: string;
    clienteEmail: string;
    modalidadeFrete: ModalidadeFrete;
    formaPagamento: FormaPagamento;
    cupomDesconto: string | null;
    syncToBudget: boolean;
    budgetCategory: TransactionCategory;
  }): Promise<CheckoutWithBudgetResponse | null> {
    setSubmitting(true);
    setLastError(null);

    const pesoTotalKg =
      Math.round(
        cart.reduce((acc, c) => acc + c.product.pesoKg * c.quantidade, 0) * 100,
      ) / 100;

    const checkoutPayload: CheckoutRequest = {
      clienteNome: params.clienteNome,
      clienteEmail: params.clienteEmail,
      itens: cart.map((entry) => ({
        produtoId: entry.product.produtoId,
        nomeProduto: entry.product.nomeProduto,
        quantidade: entry.quantidade,
        precoUnitario: entry.product.precoUnitario,
      })),
      modalidadeFrete: params.modalidadeFrete,
      formaPagamento: params.formaPagamento,
      cupomDesconto: params.cupomDesconto,
      pesoTotalKg,
    };

    try {
      let consolidated: CheckoutWithBudgetResponse;

      if (demoMode) {
        const simulated = executeDemoCheckoutWithBudget(
          checkoutPayload,
          params.syncToBudget,
          params.budgetCategory,
        );
        if (!simulated.ok) {
          setLastError(simulated.error);
          notify({
            tone: "error",
            title: simulated.error.title,
            description: simulated.error.message,
          });
          return null;
        }
        consolidated = simulated.data;
      } else {
        const res = await fetch("/api/bff/checkout-with-budget", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            checkout: checkoutPayload,
            syncToBudget: params.syncToBudget,
            budgetCategory: params.budgetCategory,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          const normalized = data as NormalizedApiError;
          setLastError(normalized);
          notify({
            tone: "error",
            title: `${normalized.title} (HTTP ${normalized.status})`,
            description: normalized.message,
          });
          return null;
        }

        consolidated = data as CheckoutWithBudgetResponse;
      }

      if (
        consolidated.budgetSync.requested &&
        !consolidated.budgetSync.succeeded
      ) {
        notify({
          tone: "warning",
          title: `Pedido #${consolidated.pedido.pedidoId} confirmado (falha parcial no Budget)`,
          description:
            consolidated.budgetSync.error?.message ||
            "A compra foi aprovada na Checkout API, mas o Smart Budget estava indisponível para o lançamento automático.",
        });
      } else if (consolidated.budgetSync.succeeded) {
        notify({
          tone: "success",
          title: `Pedido #${consolidated.pedido.pedidoId} confirmado e lançado!`,
          description: `${formatBRL(consolidated.pedido.valorTotal)} registrado automaticamente no Smart Budget.`,
        });
      } else {
        notify({
          tone: "success",
          title: `Pedido #${consolidated.pedido.pedidoId} confirmado!`,
          description: `Total: ${formatBRL(consolidated.pedido.valorTotal)} via ${consolidated.pedido.formaPagamento}.`,
        });
      }

      setCart([]);
      await loadShopContext();
      return consolidated;
    } catch {
      const err: NormalizedApiError = {
        status: 503,
        title: "Falha de comunicação com o BFF",
        message: "Não foi possível completar o checkout.",
        details: [],
        service: "checkout",
      };
      setLastError(err);
      return null;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho editorial da Loja */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FFF4EC] px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#E05200]">
            <Sparkles className="h-3 w-3" />
            Checkout API Design Patterns • GoF + SOLID
          </span>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF6200] text-white shadow-md shadow-[#FF6200]/25">
              <ShoppingBag className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold tracking-tight text-[#101828] sm:text-3xl">
                Itaú Shop &amp; Checkout
              </h1>
              <p className="text-xs text-[#525D73]">
                Frete por Strategy, validações em Chain of Responsibility e
                lançamento automático no Smart Budget.
              </p>
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void loadShopContext()}
          className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE3DB] bg-white px-4 py-2 text-xs font-bold text-[#344054] shadow-2xs transition hover:border-[#FF6200]/40 hover:text-[#101828]"
        >
          <RefreshCw
            className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
          />
          Sincronizar pedidos e saldo
        </button>
      </div>

      {/* Catálogo + Carrinho Lateral */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7 xl:col-span-8">
          <ProductCatalog
            cartQuantities={cartQuantities}
            onAddProduct={handleAddProduct}
            onUpdateQty={handleUpdateQty}
          />
        </div>
        <div className="lg:col-span-5 xl:col-span-4">
          <CartCheckoutPanel
            cart={cart}
            budgetSummary={budgetSummary}
            submitting={submitting}
            lastError={lastError}
            onClearError={() => setLastError(null)}
            onUpdateQty={handleUpdateQty}
            onRemoveItem={handleRemoveItem}
            onSubmitCheckout={handleSubmitCheckout}
          />
        </div>
      </div>

      {/* Laboratório de Design Patterns (colapsável) */}
      <DesignPatternsLab />

      {/* Lista de Pedidos Confirmados */}
      <OrdersHistory orders={orders} loading={loading} />
    </div>
  );
}
