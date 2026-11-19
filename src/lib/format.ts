import type { TransactionCategory } from "@/types/budget";
import type { FormaPagamento, ModalidadeFrete } from "@/types/checkout";

export function formatBRL(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number.isFinite(value) ? value : 0);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export interface CategoryMeta {
  label: string;
  color: string;
  bgClass: string;
  textClass: string;
}

export const CATEGORY_META: Record<TransactionCategory, CategoryMeta> = {
  FOOD: {
    label: "Alimentação",
    color: "#EC7000",
    bgClass: "bg-orange-50 border-orange-200",
    textClass: "text-orange-700",
  },
  TRANSPORT: {
    label: "Transporte",
    color: "#002D72",
    bgClass: "bg-blue-50 border-blue-200",
    textClass: "text-blue-800",
  },
  SALARY: {
    label: "Salário",
    color: "#10B981",
    bgClass: "bg-emerald-50 border-emerald-200",
    textClass: "text-emerald-700",
  },
  TECH: {
    label: "Tecnologia",
    color: "#6366F1",
    bgClass: "bg-indigo-50 border-indigo-200",
    textClass: "text-indigo-700",
  },
  HOUSING: {
    label: "Moradia",
    color: "#0EA5E9",
    bgClass: "bg-sky-50 border-sky-200",
    textClass: "text-sky-700",
  },
  HEALTH: {
    label: "Saúde",
    color: "#EF4444",
    bgClass: "bg-rose-50 border-rose-200",
    textClass: "text-rose-700",
  },
  ENTERTAINMENT: {
    label: "Lazer",
    color: "#A855F7",
    bgClass: "bg-purple-50 border-purple-200",
    textClass: "text-purple-700",
  },
  OTHER: {
    label: "Outros",
    color: "#64748B",
    bgClass: "bg-slate-100 border-slate-200",
    textClass: "text-slate-700",
  },
};

export const PAYMENT_LABELS: Record<FormaPagamento, string> = {
  PIX: "PIX (Aprovação imediata)",
  CARTAO_CREDITO: "Cartão de Crédito",
  BOLETO: "Boleto Bancário (limite R$ 5.000)",
};

export const FREIGHT_LABELS: Record<ModalidadeFrete, string> = {
  PAC: "PAC Econômico (grátis acima de R$ 500)",
  SEDEX: "SEDEX Expresso",
};
