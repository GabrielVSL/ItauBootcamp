import type {
  AssistantResponse,
  FinancialSummaryResponse,
  TransactionCategory,
  TransactionRequest,
  TransactionResponse,
  TransactionType,
} from "@/types/budget";
import type { CheckoutRequest, PedidoResponse } from "@/types/checkout";
import type {
  CheckoutWithBudgetResponse,
  NormalizedApiError,
} from "@/types/bff";
import { estimateCheckoutPricing } from "./catalog";

const INITIAL_TRANSACTIONS: TransactionResponse[] = [
  {
    id: 101,
    description: "Salário Mensal",
    amount: 7200,
    type: "INCOME",
    category: "SALARY",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
  },
  {
    id: 102,
    description: "Aluguel e Condomínio",
    amount: 2150,
    type: "EXPENSE",
    category: "HOUSING",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
  },
  {
    id: 103,
    description: "Supermercado",
    amount: 640.5,
    type: "EXPENSE",
    category: "FOOD",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
  },
  {
    id: 104,
    description: "Pedido #901 · Teclado Mecânico Wireless Pro",
    amount: 343.86,
    type: "EXPENSE",
    category: "TECH",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
  },
  {
    id: 105,
    description: "Plano de Saúde e Academia",
    amount: 420,
    type: "EXPENSE",
    category: "HEALTH",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1).toISOString(),
  },
  {
    id: 106,
    description: "Uber e Metrô",
    amount: 185.9,
    type: "EXPENSE",
    category: "TRANSPORT",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
];

const INITIAL_ORDERS: PedidoResponse[] = [
  {
    pedidoId: 901,
    clienteNome: "Gabriel Dev (Demo)",
    clienteEmail: "gabriel@bootcamp-itau.dev",
    modalidadeFrete: "SEDEX",
    formaPagamento: "PIX",
    cupomAplicado: "DEV10",
    valorItens: 349.9,
    valorFrete: 28.95,
    valorDesconto: 34.99,
    valorTotal: 343.86,
    status: "CONFIRMADO",
    criadoEm: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    itens: [
      {
        produtoId: "PROD-KEYCHRON-K2",
        nomeProduto: "Teclado Mecânico Wireless Pro",
        quantidade: 1,
        precoUnitario: 349.9,
        subtotal: 349.9,
      },
    ],
  },
];

let demoTransactions: TransactionResponse[] = [...INITIAL_TRANSACTIONS];
let demoOrders: PedidoResponse[] = [...INITIAL_ORDERS];
let nextTransactionId = 107;
let nextOrderId = 902;

export function getDemoTransactions(filters?: {
  category?: TransactionCategory | "";
  type?: TransactionType | "";
}): TransactionResponse[] {
  return demoTransactions
    .filter((tx) => {
      if (filters?.category && tx.category !== filters.category) return false;
      if (filters?.type && tx.type !== filters.type) return false;
      return true;
    })
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
}

export function getDemoSummary(): FinancialSummaryResponse {
  const totalIncome = round2(
    demoTransactions
      .filter((t) => t.type === "INCOME")
      .reduce((acc, t) => acc + t.amount, 0),
  );
  const totalExpense = round2(
    demoTransactions
      .filter((t) => t.type === "EXPENSE")
      .reduce((acc, t) => acc + t.amount, 0),
  );
  const netBalance = round2(totalIncome - totalExpense);
  const deficitAlert = netBalance < 0;

  return {
    totalIncome,
    totalExpense,
    netBalance,
    deficitAlert,
    alertMessage: deficitAlert
      ? "Atenção: suas despesas superaram suas receitas! Revise os gastos no Smart Budget."
      : "Saúde financeira positiva. Suas receitas cobrem todas as despesas registradas.",
    transactionCount: demoTransactions.length,
  };
}

export function addDemoTransaction(
  request: TransactionRequest,
): TransactionResponse {
  const created: TransactionResponse = {
    id: nextTransactionId++,
    description: request.description.trim(),
    amount: round2(request.amount),
    type: request.type,
    category: request.category,
    createdAt: new Date().toISOString(),
  };
  demoTransactions = [created, ...demoTransactions];
  return created;
}

export function getDemoOrders(): PedidoResponse[] {
  return [...demoOrders].sort(
    (a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime(),
  );
}

export function getDemoOrderById(id: string | number): PedidoResponse | null {
  return demoOrders.find((o) => String(o.pedidoId) === String(id)) ?? null;
}

export function executeDemoCheckout(
  request: CheckoutRequest,
): { ok: true; data: PedidoResponse } | { ok: false; error: NormalizedApiError } {
  // Validação de estoque
  for (const item of request.itens) {
    if (item.produtoId === "PROD-SEM-ESTOQUE") {
      return {
        ok: false,
        error: {
          status: 422,
          title: "Produto sem estoque",
          message: `"${item.nomeProduto}" está esgotado no momento.`,
          details: [],
          service: "checkout",
        },
      };
    }
    if (item.produtoId === "PROD-LIMITADO" && item.quantidade > 3) {
      return {
        ok: false,
        error: {
          status: 422,
          title: "Quantidade acima do estoque",
          message: `"${item.nomeProduto}" possui apenas 3 unidades disponíveis (você solicitou ${item.quantidade}).`,
          details: [],
          service: "checkout",
        },
      };
    }
    if (item.quantidade > 50) {
      return {
        ok: false,
        error: {
          status: 422,
          title: "Limite por pedido excedido",
          message: `O limite máximo é de 50 unidades por item.`,
          details: [],
          service: "checkout",
        },
      };
    }
  }

  // Validação de frete
  if (request.modalidadeFrete !== "PAC" && request.modalidadeFrete !== "SEDEX") {
    return {
      ok: false,
      error: {
        status: 422,
        title: "Modalidade de frete inválida",
        message: "Escolha PAC ou SEDEX para finalizar a entrega.",
        details: [],
        service: "checkout",
      },
    };
  }

  const pricing = estimateCheckoutPricing(
    request.itens,
    request.modalidadeFrete,
    request.cupomDesconto,
    request.pesoTotalKg,
  );

  // Validação de pagamento
  if (request.formaPagamento === "BOLETO" && pricing.valorItens > 5000) {
    return {
      ok: false,
      error: {
        status: 422,
        title: "Limite de boleto excedido",
        message:
          "Pagamentos via boleto têm limite máximo de R$ 5.000,00 em itens. Escolha Pix ou cartão.",
        details: [`Valor dos itens: R$ ${pricing.valorItens.toFixed(2)}`],
        service: "checkout",
      },
    };
  }

  // Validação de cupom
  const code = request.cupomDesconto?.trim().toUpperCase() || null;
  if (code) {
    if (code !== "DEV10" && code !== "BEMVINDO20") {
      return {
        ok: false,
        error: {
          status: 422,
          title: "Cupom inválido",
          message: `O cupom "${code}" não existe ou expirou. Cupons ativos: DEV10 e BEMVINDO20.`,
          details: [],
          service: "checkout",
        },
      };
    }
    if (code === "BEMVINDO20" && pricing.valorItens < 100) {
      return {
        ok: false,
        error: {
          status: 422,
          title: "Valor mínimo do cupom",
          message:
            "O cupom BEMVINDO20 exige um valor mínimo de R$ 100,00 em itens.",
          details: [],
          service: "checkout",
        },
      };
    }
  }

  const pedido: PedidoResponse = {
    pedidoId: nextOrderId++,
    clienteNome: request.clienteNome,
    clienteEmail: request.clienteEmail,
    modalidadeFrete: request.modalidadeFrete,
    formaPagamento: request.formaPagamento,
    cupomAplicado: code,
    valorItens: pricing.valorItens,
    valorFrete: pricing.valorFrete,
    valorDesconto: pricing.valorDesconto,
    valorTotal: pricing.valorTotal,
    status: "CONFIRMADO",
    criadoEm: new Date().toISOString(),
    itens: request.itens.map((item) => ({
      ...item,
      subtotal: round2(item.precoUnitario * item.quantidade),
    })),
  };

  demoOrders = [pedido, ...demoOrders];
  return { ok: true, data: pedido };
}

export function executeDemoCheckoutWithBudget(
  request: CheckoutRequest,
  syncToBudget: boolean,
  category: TransactionCategory = "TECH",
):
  | { ok: true; data: CheckoutWithBudgetResponse }
  | { ok: false; error: NormalizedApiError } {
  const result = executeDemoCheckout(request);
  if (!result.ok) return result;

  let transaction: TransactionResponse | undefined;
  if (syncToBudget) {
    const totalQty = result.data.itens.reduce((acc, i) => acc + i.quantidade, 0);
    const shortTitle =
      result.data.itens.length === 1 && totalQty === 1
        ? `Pedido #${result.data.pedidoId} · ${result.data.itens[0].nomeProduto}`
        : `Pedido #${result.data.pedidoId} · ${totalQty} itens na Loja`;
    transaction = addDemoTransaction({
      description: shortTitle,
      amount: result.data.valorTotal,
      type: "EXPENSE",
      category,
    });
  }

  return {
    ok: true,
    data: {
      pedido: result.data,
      budgetSync: {
        requested: syncToBudget,
        succeeded: syncToBudget,
        transaction,
      },
    },
  };
}

export function simulateDemoAssistant(message: string): AssistantResponse {
  const lower = message.toLowerCase();
  const numberMatch = message.match(/(\d+(?:[.,]\d{1,2})?)/);
  const parsedAmount = numberMatch
    ? Number(numberMatch[1].replace(",", "."))
    : null;

  if (
    (lower.includes("recebi") ||
      lower.includes("salário") ||
      lower.includes("salario") ||
      lower.includes("ganhei")) &&
    parsedAmount &&
    parsedAmount > 0
  ) {
    const created = addDemoTransaction({
      description: "Receita registrada via Consultor IA (Demo)",
      amount: parsedAmount,
      type: "INCOME",
      category: lower.includes("sal") ? "SALARY" : "OTHER",
    });
    const summary = getDemoSummary();
    return {
      response: `Registrei uma receita de R$ ${created.amount.toFixed(2)}. Seu saldo atualizado agora é de R$ ${summary.netBalance.toFixed(2)}.`,
      timestamp: new Date().toISOString(),
    };
  }

  if (
    (lower.includes("gastei") ||
      lower.includes("paguei") ||
      lower.includes("comprei")) &&
    parsedAmount &&
    parsedAmount > 0
  ) {
    const created = addDemoTransaction({
      description: "Despesa registrada via Consultor IA",
      amount: parsedAmount,
      type: "EXPENSE",
      category: lower.includes("uber") || lower.includes("transp")
        ? "TRANSPORT"
        : lower.includes("almo") || lower.includes("comida") || lower.includes("café")
          ? "FOOD"
          : "TECH",
    });
    const summary = getDemoSummary();
    return {
      response: `Lancei a despesa de R$ ${created.amount.toFixed(2)}. Seu saldo agora está em R$ ${summary.netBalance.toFixed(2)}.`,
      timestamp: new Date().toISOString(),
    };
  }

  const summary = getDemoSummary();
  if (lower.includes("posso comprar") && parsedAmount) {
    const remaining = round2(summary.netBalance - parsedAmount);
    const verdict =
      remaining >= 0
        ? `Sim! Após a compra de R$ ${parsedAmount.toFixed(2)}, seu saldo projetado ficaria positivo em R$ ${remaining.toFixed(2)}.`
        : `Cuidado: essa compra de R$ ${parsedAmount.toFixed(2)} deixaria seu saldo negativo em R$ ${remaining.toFixed(2)}.`;
    return {
      response: `Analisei seu resumo atual (Saldo: R$ ${summary.netBalance.toFixed(2)}). ${verdict}`,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    response: `Seu resumo atual: Receitas de R$ ${summary.totalIncome.toFixed(2)}, Despesas de R$ ${summary.totalExpense.toFixed(2)} e Saldo de R$ ${summary.netBalance.toFixed(2)} (${summary.transactionCount} lançamentos).`,
    timestamp: new Date().toISOString(),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
