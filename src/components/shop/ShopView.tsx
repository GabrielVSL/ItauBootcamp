"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ShoppingBag } from "lucide-react";
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
import { OrdersHistory } from "./OrdersHistory";

export function ShopView() {
  const { demoMode, budgetVersion, notifyBudgetUpdated } = useAppStatus();
  const { notify } = useToast();

  const [cart, setCart] = useState<CartEntry[]>([
    { product: CATALOG_PRODUCTS[0], quantidade: 1 },
  ]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orders, setOrders] = useState<PedidoResponse[]>([]);
  const [budgetSummary, setBudgetSummary] =
    useState<FinancialSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastError, setLastError] = useState<NormalizedApiError | null>(null);

  const requestSeqRef = useRef(0);

  const loadShopContext = useCallback(async () => {
    const seq = ++requestSeqRef.current;
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

    if (seq !== requestSeqRef.current) return;

    if (ordersRes.status === "fulfilled" && ordersRes.value.ok) {
      const list = (await ordersRes.value.json()) as PedidoResponse[];
      if (seq !== requestSeqRef.current) return;
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
      const data = (await summaryRes.value.json()) as FinancialSummaryResponse;
      if (seq !== requestSeqRef.current) return;
      setBudgetSummary(data);
    } else {
      setBudgetSummary(null);
    }

    if (seq === requestSeqRef.current) {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    void loadShopContext();
  }, [loadShopContext, budgetVersion]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCartOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const cartQuantities = useMemo(() => {
    const map: Record<string, number> = {};
    for (const item of cart) {
      map[item.product.produtoId] = item.quantidade;
    }
    return map;
  }, [cart]);

  const cartUnits = useMemo(
    () => cart.reduce((acc, item) => acc + item.quantidade, 0),
    [cart],
  );

  const cartSubtotal = useMemo(
    () =>
      cart.reduce(
        (acc, item) => acc + item.product.precoUnitario * item.quantidade,
        0,
      ),
    [cart],
  );

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
            title: normalized.title,
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
          title: `Pedido #${consolidated.pedido.pedidoId} confirmado`,
          description:
            "A compra foi aprovada, mas não foi possível lançar nas finanças agora.",
        });
      } else if (consolidated.budgetSync.succeeded) {
        notify({
          tone: "success",
          title: `Pedido #${consolidated.pedido.pedidoId} confirmado!`,
          description: `${formatBRL(consolidated.pedido.valorTotal)} lançado automaticamente nas suas finanças.`,
        });
      } else {
        notify({
          tone: "success",
          title: `Pedido #${consolidated.pedido.pedidoId} confirmado!`,
          description: `Total: ${formatBRL(consolidated.pedido.valorTotal)} via ${consolidated.pedido.formaPagamento}.`,
        });
      }

      setCart([]);
      setCartOpen(false);
      notifyBudgetUpdated();
      await loadShopContext();
      return consolidated;
    } catch {
      const err: NormalizedApiError = {
        status: 503,
        title: "Falha de comunicação",
        message: "Não foi possível completar o pedido.",
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
      {/* Cabeçalho único da Loja + Botão de abrir o Sidebar do Carrinho */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#141413] sm:text-3xl">
            Loja
          </h1>
          <p className="mt-1 text-[13.5px] text-[#6E6C66]">
            Frete PAC grátis acima de R$ 500 · Lançamento integrado às suas
            finanças.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => void loadShopContext()}
            aria-label="Atualizar pedidos"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#EAE9E4] bg-white text-[#57554F] transition hover:border-[#141413] hover:text-[#141413]"
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="inline-flex items-center gap-2.5 rounded-full bg-[#141413] px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm transition hover:bg-[#FF6200]"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Carrinho</span>
            {cartUnits > 0 && (
              <>
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white/20 px-1.5 text-[11px] font-bold tabular-nums">
                  {cartUnits}
                </span>
                <span className="hidden border-l border-white/20 pl-2.5 font-normal tabular-nums text-white/85 sm:inline">
                  {formatBRL(cartSubtotal)}
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Catálogo em largura total (foco único na vitrine) */}
      <ProductCatalog
        cartQuantities={cartQuantities}
        onAddProduct={handleAddProduct}
        onUpdateQty={handleUpdateQty}
      />

      {/* Histórico de pedidos */}
      <OrdersHistory orders={orders} loading={loading} />

      {/* Sidebar Drawer lateral direito do Carrinho */}
      {cartOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Carrinho de compras"
          className="fixed inset-0 z-50 flex justify-end"
        >
          <div
            onClick={() => setCartOpen(false)}
            className="fixed inset-0 bg-[#120F17]/40 backdrop-blur-[2px] transition-opacity"
          />
          <div className="relative z-10 h-full w-full max-w-md shadow-[-20px_0_60px_-20px_rgba(18,15,23,0.35)]">
            <CartCheckoutPanel
              cart={cart}
              budgetSummary={budgetSummary}
              submitting={submitting}
              lastError={lastError}
              onClearError={() => setLastError(null)}
              onUpdateQty={handleUpdateQty}
              onRemoveItem={handleRemoveItem}
              onClose={() => setCartOpen(false)}
              onSubmitCheckout={handleSubmitCheckout}
            />
          </div>
        </div>
      )}
    </div>
  );
}
