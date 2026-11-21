"use client";

import React, { useState } from "react";
import { Eye, Loader2, PackageCheck, Receipt } from "lucide-react";
import type { PedidoResponse } from "@/types/checkout";
import type { NormalizedApiError } from "@/types/bff";
import { useAppStatus } from "@/context/AppStatusContext";
import { getDemoOrderById } from "@/lib/demo-store";
import { formatBRL, formatDateTime } from "@/lib/format";
import { Modal } from "@/components/ui/Modal";
import { ApiErrorBanner } from "@/components/ui/ApiErrorBanner";

interface OrdersHistoryProps {
  orders: PedidoResponse[];
  loading: boolean;
}

export function OrdersHistory({ orders, loading }: OrdersHistoryProps) {
  const { demoMode } = useAppStatus();
  const [selectedOrder, setSelectedOrder] = useState<PedidoResponse | null>(
    null,
  );
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [detailError, setDetailError] = useState<NormalizedApiError | null>(
    null,
  );
  const [modalOpen, setModalOpen] = useState(false);

  async function openOrderDetail(orderId: number | string) {
    setModalOpen(true);
    setLoadingDetail(true);
    setDetailError(null);

    if (demoMode) {
      setSelectedOrder(getDemoOrderById(orderId));
      setLoadingDetail(false);
      return;
    }

    try {
      const res = await fetch(
        `/api/checkout/pedidos/${encodeURIComponent(String(orderId))}`,
        { cache: "no-store" },
      );
      const payload = await res.json();
      if (!res.ok) {
        setSelectedOrder(null);
        setDetailError(payload as NormalizedApiError);
      } else {
        setSelectedOrder(payload as PedidoResponse);
      }
    } catch {
      setDetailError({
        status: 503,
        title: "Erro ao consultar pedido",
        message: "Não foi possível carregar os detalhes do pedido.",
        details: [],
        service: "checkout",
      });
    } finally {
      setLoadingDetail(false);
    }
  }

  return (
    <section className="voxel-card p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFF4EC] text-[#FF6200]">
            <Receipt className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-base font-extrabold text-[#101828]">
              Histórico de Pedidos
            </h2>
            <p className="text-xs text-[#667085]">
              Acompanhe seus pedidos e clique em Abrir para ver os detalhes
            </p>
          </div>
        </div>
        <span className="rounded-full bg-[#F4EFE9] px-3 py-1 text-xs font-extrabold tabular-nums text-[#344054]">
          {orders.length} pedido(s)
        </span>
      </div>

      <div className="mt-5 overflow-x-auto">
        {loading ? (
          <div className="space-y-2.5 py-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-12 animate-pulse rounded-2xl bg-[#F4EFE9]"
              />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-xs text-[#667085]">
            Nenhum pedido confirmado ainda. Finalize uma compra no carrinho
            acima!
          </div>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#EAE3DB] text-[11px] uppercase tracking-wider text-[#667085]">
                <th className="py-2.5 pr-3 font-semibold">Pedido</th>
                <th className="py-2.5 pr-3 font-semibold">Cliente</th>
                <th className="py-2.5 pr-3 font-semibold">Frete / Pagamento</th>
                <th className="py-2.5 pr-3 font-semibold">Cupom</th>
                <th className="py-2.5 pr-3 font-semibold">Status</th>
                <th className="py-2.5 pr-3 text-right font-semibold">Total</th>
                <th className="py-2.5 text-right font-semibold">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2ECE6]">
              {orders.map((order) => (
                <tr key={order.pedidoId} className="hover:bg-[#FBF9F6]">
                  <td className="py-3.5 pr-3 font-display font-extrabold text-[#101828]">
                    #{order.pedidoId}
                    <span className="block font-sans text-[10px] font-normal text-[#98A2B3]">
                      {formatDateTime(order.criadoEm)}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3">
                    <span className="font-semibold text-[#101828]">
                      {order.clienteNome}
                    </span>
                    <span className="block text-[11px] text-[#667085]">
                      {order.clienteEmail}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 text-[#525D73]">
                    {order.modalidadeFrete} • {order.formaPagamento}
                  </td>
                  <td className="py-3.5 pr-3">
                    {order.cupomAplicado ? (
                      <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 font-bold text-emerald-700">
                        {order.cupomAplicado}
                      </span>
                    ) : (
                      <span className="text-[#98A2B3]">—</span>
                    )}
                  </td>
                  <td className="py-3.5 pr-3">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        order.status === "CONFIRMADO"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-rose-50 text-rose-700"
                      }`}
                    >
                      <PackageCheck className="h-3 w-3" />
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3.5 pr-3 text-right font-display font-extrabold tabular-nums text-[#101828]">
                    {formatBRL(order.valorTotal)}
                  </td>
                  <td className="py-3.5 text-right">
                    <button
                      type="button"
                      onClick={() => void openOrderDetail(order.pedidoId)}
                      className="inline-flex items-center gap-1 rounded-full border border-[#EAE3DB] bg-white px-3 py-1.5 text-[11px] font-bold text-[#101828] transition hover:border-[#FF6200] hover:text-[#FF6200]"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Abrir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          selectedOrder
            ? `Detalhes do Pedido #${selectedOrder.pedidoId}`
            : "Detalhes do Pedido"
        }
        subtitle="Resumo completo dos itens, frete e pagamento"
      >
        {loadingDetail ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[#667085]">
            <Loader2 className="h-5 w-5 animate-spin text-[#FF6200]" />
            Carregando detalhes do pedido...
          </div>
        ) : detailError ? (
          <ApiErrorBanner error={detailError} />
        ) : selectedOrder ? (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-[#FBF9F6] p-4">
              <div>
                <span className="block text-[#667085]">Cliente</span>
                <strong className="text-[#101828]">
                  {selectedOrder.clienteNome}
                </strong>
                <span className="block text-[#667085]">
                  {selectedOrder.clienteEmail}
                </span>
              </div>
              <div>
                <span className="block text-[#667085]">Status &amp; Data</span>
                <strong className="text-emerald-700">
                  {selectedOrder.status}
                </strong>
                <span className="block text-[#667085]">
                  {formatDateTime(selectedOrder.criadoEm)}
                </span>
              </div>
              <div>
                <span className="block text-[#667085]">Frete</span>
                <strong className="text-[#101828]">
                  {selectedOrder.modalidadeFrete}
                </strong>
              </div>
              <div>
                <span className="block text-[#667085]">
                  Pagamento / Cupom
                </span>
                <strong className="text-[#101828]">
                  {selectedOrder.formaPagamento}
                  {selectedOrder.cupomAplicado
                    ? ` • ${selectedOrder.cupomAplicado}`
                    : ""}
                </strong>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-display font-extrabold text-[#101828]">
                Itens do Pedido ({selectedOrder.itens.length})
              </h4>
              <div className="divide-y divide-[#F2ECE6] rounded-2xl border border-[#EAE3DB]">
                {selectedOrder.itens.map((item, idx) => (
                  <div
                    key={`${item.produtoId}-${idx}`}
                    className="flex items-center justify-between gap-3 p-3"
                  >
                    <div>
                      <p className="font-semibold text-[#101828]">
                        {item.nomeProduto}
                      </p>
                      <p className="text-[11px] tabular-nums text-[#667085]">
                        {item.produtoId} • {item.quantidade}x{" "}
                        {formatBRL(item.precoUnitario)}
                      </p>
                    </div>
                    <span className="font-display font-extrabold tabular-nums text-[#101828]">
                      {formatBRL(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 rounded-2xl border border-[#EAE3DB] bg-[#FBF9F6] p-4 tabular-nums">
              <div className="flex justify-between text-[#525D73]">
                <span>Valor dos itens</span>
                <span>{formatBRL(selectedOrder.valorItens)}</span>
              </div>
              <div className="flex justify-between text-[#525D73]">
                <span>Frete</span>
                <span>{formatBRL(selectedOrder.valorFrete)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Desconto</span>
                <span>- {formatBRL(selectedOrder.valorDesconto)}</span>
              </div>
              <div className="flex justify-between border-t border-[#EAE3DB] pt-2 font-display text-sm font-extrabold text-[#101828]">
                <span>Valor Total</span>
                <span>{formatBRL(selectedOrder.valorTotal)}</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="py-6 text-center text-xs text-[#667085]">
            Pedido não encontrado.
          </p>
        )}
      </Modal>
    </section>
  );
}
