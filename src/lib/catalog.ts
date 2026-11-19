import type { TransactionCategory } from "@/types/budget";
import type { CheckoutItemRequest, CheckoutRequest } from "@/types/checkout";

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
    nomeProduto: "Kit Dev Itaú Bootcamp Edition (Hub + Mochila)",
    descricao:
      "Produto configurado no backend com limite real de 3 unidades para testar a Chain of Responsibility.",
    precoUnitario: 229.9,
    pesoKg: 1.2,
    budgetCategory: "TECH",
    tag: "Edição Limitada",
    stockBadge: {
      label: "Últimas 3 unidades",
      tone: "limited",
      hint: "PROD-LIMITADO: pedir > 3 unidades retorna 422 no Elo 1 (Estoque).",
    },
    accentColor: "from-[#EC7000] to-[#C85A00]",
  },
  {
    produtoId: "PROD-NOTEBOOK-DEV",
    nomeProduto: "Workstation Ultrabook 32GB RAM",
    descricao:
      "Alta performance para containers Docker, Spring Boot e modelos locais. Ideal para testar limite de Boleto (> R$ 5.000).",
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
      "Item propositalmente mantido com estoque zero no backend para demonstração real de erro 422 (Chain Elo 1).",
    precoUnitario: 3299.0,
    pesoKg: 7.4,
    budgetCategory: "TECH",
    tag: "Demo GoF (422)",
    stockBadge: {
      label: "Esgotado (Demo 422)",
      tone: "out",
      hint: "PROD-SEM-ESTOQUE: enviar no checkout dispara 422 no Elo 1 (Estoque).",
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
    cupomHint = "DEV10 aplicado: 10% OFF sem valor mínimo.";
  } else if (code === "BEMVINDO20") {
    if (valorItens >= 100) {
      valorDesconto = round2(valorItens * 0.2);
      cupomStatus = "applied";
      cupomHint = "BEMVINDO20 aplicado: 20% OFF (mínimo R$ 100 atingido).";
    } else {
      cupomStatus = "min_not_met";
      cupomHint = "BEMVINDO20 exige mínimo de R$ 100,00 em itens (retornará 422).";
    }
  } else if (code.length > 0) {
    cupomStatus = "unknown";
    cupomHint = `Cupom "${code}" não reconhecido (Chain Elo 3 retornará 422).`;
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

export interface DesignPatternScenario {
  id: string;
  title: string;
  pattern: string;
  expectedStatus: number;
  description: string;
  payload: CheckoutRequest;
}

export const DESIGN_PATTERN_SCENARIOS: DesignPatternScenario[] = [
  {
    id: "strategy-drone",
    title: 'Frete Inválido ("DRONE")',
    pattern: "Strategy + Factory (Frete)",
    expectedStatus: 422,
    description:
      'Envia modalidadeFrete: "DRONE", não registrada no mapa de estratégias (PAC/SEDEX).',
    payload: {
      clienteNome: "Avaliador Itaú",
      clienteEmail: "avaliador@itau-bootcamp.dev",
      itens: [
        {
          produtoId: "PROD-KEYCHRON-K2",
          nomeProduto: "Teclado Mecânico Wireless Pro",
          quantidade: 1,
          precoUnitario: 349.9,
        },
      ],
      modalidadeFrete: "DRONE",
      formaPagamento: "PIX",
      cupomDesconto: null,
      pesoTotalKg: 0.9,
    },
  },
  {
    id: "chain-estoque-esgotado",
    title: "Estoque Esgotado (PROD-SEM-ESTOQUE)",
    pattern: "Chain of Responsibility — Elo 1 (Estoque)",
    expectedStatus: 422,
    description:
      "Validador de estoque bloqueia imediatamente o item com 0 unidades disponíveis.",
    payload: {
      clienteNome: "Avaliador Itaú",
      clienteEmail: "avaliador@itau-bootcamp.dev",
      itens: [
        {
          produtoId: "PROD-SEM-ESTOQUE",
          nomeProduto: 'Monitor Ultrawide 34" 144Hz OLED',
          quantidade: 1,
          precoUnitario: 3299.0,
        },
      ],
      modalidadeFrete: "PAC",
      formaPagamento: "PIX",
      cupomDesconto: null,
      pesoTotalKg: 7.4,
    },
  },
  {
    id: "chain-estoque-limitado",
    title: "Exceder Limite (5x PROD-LIMITADO)",
    pattern: "Chain of Responsibility — Elo 1 (Estoque)",
    expectedStatus: 422,
    description:
      "PROD-LIMITADO possui no máximo 3 unidades; solicitar 5 interrompe a cadeia no Elo 1.",
    payload: {
      clienteNome: "Avaliador Itaú",
      clienteEmail: "avaliador@itau-bootcamp.dev",
      itens: [
        {
          produtoId: "PROD-LIMITADO",
          nomeProduto: "Kit Dev Itaú Bootcamp Edition",
          quantidade: 5,
          precoUnitario: 229.9,
        },
      ],
      modalidadeFrete: "SEDEX",
      formaPagamento: "CARTAO_CREDITO",
      cupomDesconto: null,
      pesoTotalKg: 6.0,
    },
  },
  {
    id: "chain-boleto-limite",
    title: "Boleto acima de R$ 5.000",
    pattern: "Chain of Responsibility — Elo 2 (Pagamento)",
    expectedStatus: 422,
    description:
      "Pedido de R$ 5.499,00 com formaPagamento BOLETO viola a regra de teto de R$ 5.000,00.",
    payload: {
      clienteNome: "Avaliador Itaú",
      clienteEmail: "avaliador@itau-bootcamp.dev",
      itens: [
        {
          produtoId: "PROD-NOTEBOOK-DEV",
          nomeProduto: "Workstation Ultrabook 32GB RAM",
          quantidade: 1,
          precoUnitario: 5499.0,
        },
      ],
      modalidadeFrete: "PAC",
      formaPagamento: "BOLETO",
      cupomDesconto: null,
      pesoTotalKg: 1.8,
    },
  },
  {
    id: "chain-cupom-invalido",
    title: 'Cupom Inválido ("SUPER99")',
    pattern: "Chain of Responsibility — Elo 3 (Cupom)",
    expectedStatus: 422,
    description:
      'Cupom "SUPER99" é rejeitado no terceiro elo após passar por estoque e pagamento.',
    payload: {
      clienteNome: "Avaliador Itaú",
      clienteEmail: "avaliador@itau-bootcamp.dev",
      itens: [
        {
          produtoId: "PROD-MOUSE-MX",
          nomeProduto: "Mouse Ergonômico Precision",
          quantidade: 1,
          precoUnitario: 279.0,
        },
      ],
      modalidadeFrete: "PAC",
      formaPagamento: "PIX",
      cupomDesconto: "SUPER99",
      pesoTotalKg: 0.25,
    },
  },
];
