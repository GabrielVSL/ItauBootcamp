import type { TransactionCategory } from "@/types/budget";
import type { CheckoutItemRequest } from "@/types/checkout";

export interface CatalogProduct {
  produtoId: string;
  nomeProduto: string;
  descricao: string;
  precoUnitario: number;
  pesoKg: number;
  budgetCategory: TransactionCategory;
  tag: string;
  stockBadge?: {
    label: string;
    tone: "normal" | "limited" | "out";
    hint?: string;
  };
  accentColor: string;
}

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    produtoId: "PROD-KEYCHRON-K2",
    nomeProduto: "Teclado Mecânico Wireless Pro",
    descricao:
      "Layout compacto 75%, switches táteis silenciosos e conexão multi-dispositivo para devs.",
    precoUnitario: 349.9,
    pesoKg: 0.9,
    budgetCategory: "TECH",
    tag: "Periféricos",
    stockBadge: { label: "Em estoque", tone: "normal" },
    accentColor: "from-orange-500 to-amber-500",
  },
  {
    produtoId: "PROD-HEADSET-ANC",
    nomeProduto: "Headset Studio ANC Bluetooth",
    descricao:
      "Cancelamento ativo de ruído para dailies e pair programming com 40h de bateria.",
    precoUnitario: 489.9,
    pesoKg: 0.45,
    budgetCategory: "TECH",
    tag: "Áudio",
    stockBadge: { label: "Em estoque", tone: "normal" },
    accentColor: "from-blue-800 to-indigo-700",
  },
  {
    produtoId: "PROD-MOUSE-MX",
    nomeProduto: "Mouse Ergonômico Precision",
    descricao:
      "Sensor 8000 DPI, scroll eletromagnético e recarga rápida USB-C.",
    precoUnitario: 279.0,
    pesoKg: 0.25,
    budgetCategory: "TECH",
    tag: "Periféricos",
    stockBadge: { label: "Em estoque", tone: "normal" },
    accentColor: "from-slate-700 to-slate-900",
  },
  {
    produtoId: "PROD-LIMITADO",
    nomeProduto: "Kit Dev Edition (Hub USB-C + Mochila)",
    descricao:
      "Hub USB-C 7 em 1 de alumínio e mochila impermeável para notebook até 16\".",
    precoUnitario: 229.9,
    pesoKg: 1.2,
    budgetCategory: "TECH",
    tag: "Acessórios",
    stockBadge: {
      label: "Últimas 3 un.",
      tone: "limited",
    },
    accentColor: "from-[#EC7000] to-[#C85A00]",
  },
  {
    produtoId: "PROD-NOTEBOOK-DEV",
    nomeProduto: "Workstation Ultrabook 32GB RAM",
    descricao:
      "Alta performance para desenvolvimento, multitarefa pesada e jornadas longas fora da tomada.",
    precoUnitario: 5499.0,
    pesoKg: 1.8,
    budgetCategory: "TECH",
    tag: "Computadores",
    stockBadge: { label: "Em estoque", tone: "normal" },
    accentColor: "from-[#002D72] to-sky-700",
  },
  {
    produtoId: "PROD-CADEIRA-ERGO",
    nomeProduto: "Cadeira Ergonômica Mesh Lombar",
    descricao:
      "Apoio lombar ajustável em 4D e encosto respirável para longas jornadas de código.",
    precoUnitario: 1190.0,
    pesoKg: 14.5,
    budgetCategory: "HOUSING",
    tag: "Home Office",
    stockBadge: { label: "Em estoque", tone: "normal" },
    accentColor: "from-teal-600 to-emerald-700",
  },
  {
    produtoId: "PROD-CAFE-ESPECIAL",
    nomeProduto: "Assinatura Café Especial em Grãos (1kg)",
    descricao:
      "Torra média artesanal com notas de chocolate e caramelo para turbinar seus deploys.",
    precoUnitario: 89.9,
    pesoKg: 1.0,
    budgetCategory: "FOOD",
    tag: "Lifestyle",
    stockBadge: { label: "Em estoque", tone: "normal" },
    accentColor: "from-amber-700 to-yellow-700",
  },
  {
    produtoId: "PROD-SEM-ESTOQUE",
    nomeProduto: "Monitor Ultrawide 34\" 144Hz OLED",
    descricao:
      "Painel curvo OLED 144Hz com fidelidade de cores para produtividade e edição.",
    precoUnitario: 3299.0,
    pesoKg: 7.4,
    budgetCategory: "TECH",
    tag: "Monitores",
    stockBadge: {
      label: "Esgotado",
      tone: "out",
    },
    accentColor: "from-rose-600 to-red-700",
  },
];

export interface PricingPreview {
  valorItens: number;
  valorFrete: number;
  valorDesconto: number;
  valorTotal: number;
  pacGratisAtingido: boolean;
  faltaParaPacGratis: number;
  cupomStatus: "none" | "applied" | "min_not_met" | "unknown";
  cupomHint: string;
}

export const PAC_FREE_THRESHOLD = 500;

export function estimateCheckoutPricing(
  itens: CheckoutItemRequest[],
  modalidadeFrete: string,
  cupomDesconto: string | null,
  pesoTotalKg: number,
): PricingPreview {
  const valorItens = round2(
    itens.reduce((acc, item) => acc + item.precoUnitario * item.quantidade, 0),
  );
  const pacGratisAtingido = valorItens >= PAC_FREE_THRESHOLD;
  const faltaParaPacGratis = Math.max(0, round2(PAC_FREE_THRESHOLD - valorItens));

  let valorFrete = 0;
  if (valorItens > 0) {
    if (modalidadeFrete === "SEDEX") {
      valorFrete = round2(24.9 + 4.5 * pesoTotalKg);
    } else if (modalidadeFrete === "PAC") {
      valorFrete = pacGratisAtingido ? 0 : round2(12.9 + 2.1 * pesoTotalKg);
    }
  }

  let valorDesconto = 0;
  let cupomStatus: PricingPreview["cupomStatus"] = "none";
  let cupomHint = "";
  const code = cupomDesconto?.trim().toUpperCase() || "";

  if (code === "DEV10") {
    valorDesconto = round2(valorItens * 0.1);
    cupomStatus = "applied";
    cupomHint = "Cupom DEV10 aplicado (10% OFF).";
  } else if (code === "BEMVINDO20") {
    if (valorItens >= 100) {
      valorDesconto = round2(valorItens * 0.2);
      cupomStatus = "applied";
      cupomHint = "Cupom BEMVINDO20 aplicado (20% OFF).";
    } else {
      cupomStatus = "min_not_met";
      cupomHint = "BEMVINDO20 exige mínimo de R$ 100,00 em itens.";
    }
  } else if (code.length > 0) {
    cupomStatus = "unknown";
    cupomHint = `Cupom "${code}" não encontrado.`;
  }

  const valorTotal = round2(Math.max(0, valorItens + valorFrete - valorDesconto));

  return {
    valorItens,
    valorFrete,
    valorDesconto,
    valorTotal,
    pacGratisAtingido,
    faltaParaPacGratis,
    cupomStatus,
    cupomHint,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
