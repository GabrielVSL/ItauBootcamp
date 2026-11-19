"use client";

import React, { useMemo, useState } from "react";
import {
  AlertTriangle,
  Coffee,
  Headphones,
  Keyboard,
  Laptop,
  Minus,
  Monitor,
  Mouse,
  Package,
  Plus,
  Scale,
  Sparkles,
} from "lucide-react";
import { CATALOG_PRODUCTS, type CatalogProduct } from "@/lib/catalog";
import { CATEGORY_META, formatBRL } from "@/lib/format";

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
  if (produtoId.includes("LIMITADO")) return Sparkles;
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
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-extrabold text-[#101828]">
            Vitrine Itaú Shop GoF
          </h2>
          <p className="text-xs text-[#667085]">
            Filtre por linha ou teste os cenários reais{" "}
            <code className="rounded bg-[#F4EFE9] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#101828]">
              PROD-LIMITADO
            </code>{" "}
            e{" "}
            <code className="rounded bg-[#F4EFE9] px-1.5 py-0.5 font-mono text-[11px] font-semibold text-[#101828]">
              PROD-SEM-ESTOQUE
            </code>
            .
          </p>
        </div>
      </div>

      {/* Chips de filtro modernos */}
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = selectedTag === tag;
          return (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                active
                  ? "bg-[#101828] text-white shadow-xs"
                  : "border border-[#EAE3DB] bg-white text-[#525D73] hover:border-[#FF6200]/50 hover:text-[#101828]"
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Grid de produtos editorial */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filteredProducts.map((product) => {
          const qtyInCart = cartQuantities[product.produtoId] ?? 0;
          const catMeta = CATEGORY_META[product.budgetCategory];
          const badge = product.stockBadge;
          const Icon = getProductIcon(product.produtoId);

          const badgeClasses =
            badge?.tone === "out"
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : badge?.tone === "limited"
                ? "border-[#F5D6BE] bg-[#FFF4EC] text-[#C84A00]"
                : "border-emerald-200 bg-emerald-50 text-emerald-700";

          return (
            <article
              key={product.produtoId}
              className="voxel-card voxel-card-interactive flex flex-col justify-between overflow-hidden p-5"
            >
              <div>
                {/* Topo limpo com medalhão superelipse + status */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${product.accentColor} text-white shadow-sm`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>

                  <div className="flex flex-wrap justify-end gap-1.5">
                    {badge && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold ${badgeClasses}`}
                      >
                        {badge.tone !== "normal" && (
                          <AlertTriangle className="h-3 w-3" />
                        )}
                        {badge.label}
                      </span>
                    )}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${catMeta.bgClass} ${catMeta.textClass}`}
                    >
                      {catMeta.label}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[#98A2B3]">
                    {product.produtoId} • {product.tag}
                  </p>
                  <h3 className="mt-1 font-display text-[15px] font-extrabold leading-snug text-[#101828]">
                    {product.nomeProduto}
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-[#525D73]">
                    {product.descricao}
                  </p>
                </div>

                {badge?.hint && (
                  <p className="mt-3 rounded-xl border border-[#EAE3DB] bg-[#FBF9F6] px-3 py-2 text-[11px] text-[#525D73]">
                    {badge.hint}
                  </p>
                )}
              </div>

              {/* Rodapé com preço + controle instantâneo de carrinho */}
              <div className="mt-5 flex items-center justify-between gap-3 border-t border-[#F2ECE6] pt-4">
                <div>
                  <p className="font-display text-lg font-extrabold tabular-nums text-[#101828]">
                    {formatBRL(product.precoUnitario)}
                  </p>
                  <p className="inline-flex items-center gap-1 text-[11px] text-[#667085]">
                    <Scale className="h-3 w-3" />
                    {product.pesoKg.toFixed(2).replace(".", ",")} kg
                  </p>
                </div>

                {qtyInCart > 0 ? (
                  <div className="inline-flex items-center gap-1 rounded-full border border-[#F5D6BE] bg-[#FFF4EC] p-1">
                    <button
                      type="button"
                      onClick={() => onUpdateQty(product.produtoId, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[#101828] shadow-2xs transition hover:bg-[#F4EFE9]"
                      aria-label="Remover unidade"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="min-w-7 text-center font-display text-xs font-extrabold tabular-nums text-[#C84A00]">
                      {qtyInCart}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUpdateQty(product.produtoId, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FF6200] text-white shadow-2xs transition hover:bg-[#E05200]"
                      aria-label="Adicionar unidade"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => onAddProduct(product)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-extrabold transition ${
                      badge?.tone === "out"
                        ? "border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
                        : "bg-[#FF6200] text-white shadow-sm shadow-[#FF6200]/25 hover:bg-[#E05200]"
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {badge?.tone === "out" ? "Testar 422" : "Adicionar"}
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
