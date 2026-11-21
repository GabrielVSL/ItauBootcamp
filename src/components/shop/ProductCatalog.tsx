"use client";

import React, { useMemo, useState } from "react";
import {
  Coffee,
  Headphones,
  Keyboard,
  Laptop,
  Minus,
  Monitor,
  Mouse,
  Package,
  Plus,
} from "lucide-react";
import { CATALOG_PRODUCTS, type CatalogProduct } from "@/lib/catalog";
import { formatBRL } from "@/lib/format";

interface ProductCatalogProps {
  cartQuantities: Record<string, number>;
  onAddProduct: (product: CatalogProduct) => void;
  onUpdateQty: (produtoId: string, delta: number) => void;
}

function getProductIcon(produtoId: string) {
  if (produtoId.includes("KEYCHRON")) return Keyboard;
  if (produtoId.includes("HEADSET")) return Headphones;
  if (produtoId.includes("MOUSE")) return Mouse;
  if (produtoId.includes("NOTEBOOK")) return Laptop;
  if (produtoId.includes("CAFE")) return Coffee;
  if (produtoId.includes("SEM-ESTOQUE")) return Monitor;
  return Package;
}

export function ProductCatalog({
  cartQuantities,
  onAddProduct,
  onUpdateQty,
}: ProductCatalogProps) {
  const [selectedTag, setSelectedTag] = useState<string>("Todos");

  const tags = useMemo(() => {
    const unique = Array.from(new Set(CATALOG_PRODUCTS.map((p) => p.tag)));
    return ["Todos", ...unique];
  }, []);

  const filteredProducts = useMemo(() => {
    if (selectedTag === "Todos") return CATALOG_PRODUCTS;
    return CATALOG_PRODUCTS.filter((p) => p.tag === selectedTag);
  }, [selectedTag]);

  return (
    <section className="space-y-6">
      {/* Filtros limpos por categoria (sem segundo título duplicado) */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-4 py-1.5 text-[12.5px] font-medium transition ${
                active
                  ? "bg-[#141413] text-white"
                  : "border border-[#EAE9E4] bg-white text-[#57554F] hover:border-[#141413] hover:text-[#141413]"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Vitrine em largura total (3 colunas no desktop) */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => {
          const qtyInCart = cartQuantities[product.produtoId] ?? 0;
          const badge = product.stockBadge;
          const Icon = getProductIcon(product.produtoId);
          const isOut = badge?.tone === "out";
          const isLimited = badge?.tone === "limited";

          return (
            <article
              key={product.produtoId}
              className="flex flex-col justify-between rounded-[22px] border border-[#EAE9E4] bg-white p-5 transition duration-200 hover:-translate-y-0.5 hover:border-[#D6D4CC]"
            >
              <div>
                {/* Topo com ícone e status discreto */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F5F4F1] text-[#141413]">
                    <Icon className="h-5 w-5" strokeWidth={1.75} />
                  </div>

                  {isOut ? (
                    <span className="rounded-full bg-rose-50 px-2.5 py-1 text-[11px] font-medium text-rose-700">
                      Esgotado
                    </span>
                  ) : isLimited ? (
                    <span className="rounded-full bg-[#FFF3EB] px-2.5 py-1 text-[11px] font-medium text-[#C85A17]">
                      {badge?.label}
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-[#8A8882]">
                      {product.tag}
                    </span>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="text-[15.5px] font-semibold leading-snug tracking-[-0.015em] text-[#141413]">
                    {product.nomeProduto}
                  </h3>
                  <p className="mt-1.5 text-[13px] leading-[1.55] text-[#66645E]">
                    {product.descricao}
                  </p>
                </div>
              </div>

              {/* Preço + ação limpa */}
              <div className="mt-6 flex items-center justify-between gap-3 border-t border-[#F0EFEA] pt-4">
                <p className="text-[18px] font-semibold tracking-[-0.02em] tabular-nums text-[#141413]">
                  {formatBRL(product.precoUnitario)}
                </p>

                {qtyInCart > 0 ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-[#F3D7C4] bg-[#FFF5EE] p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(product.produtoId, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#141413] transition hover:bg-[#F5F4F1]"
                      aria-label="Remover unidade"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-6 text-center text-xs font-semibold tabular-nums text-[#C84A00]">
                      {qtyInCart}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(product.produtoId, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6200] text-white transition hover:bg-[#E05200]"
                      aria-label="Adicionar unidade"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddProduct(product)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-semibold transition ${
                      isOut
                        ? "border border-[#E5E3DD] bg-[#FAF9F7] text-[#6E6C66] hover:border-[#141413] hover:text-[#141413]"
                        : "bg-[#141413] text-white hover:bg-[#FF6200]"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
