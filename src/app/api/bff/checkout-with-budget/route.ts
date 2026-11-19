import { NextRequest, NextResponse } from "next/server";
import type {
  CheckoutWithBudgetRequest,
  CheckoutWithBudgetResponse,
} from "@/types/bff";
import type { TransactionRequest, TransactionResponse } from "@/types/budget";
import type { PedidoResponse } from "@/types/checkout";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";

/**
 * Rota Orquestrada do BFF:
 * 1. Executa POST /api/v1/checkout na Checkout API Design Patterns.
 * 2. Se retornar 201 Created e syncToBudget === true, lança a despesa
 *    automaticamente no Smart Budget Spring AI (POST /api/v1/transactions).
 * 3. Trata falhas parciais com elegância (pedido confirmado mesmo que o Budget esteja offline).
 */
export async function POST(request: NextRequest) {
  let payload: CheckoutWithBudgetRequest;
  try {
    payload = (await request.json()) as CheckoutWithBudgetRequest;
  } catch {
    return jsonErrorResponse({
      status: 400,
      title: "Payload inválido",
      message:
        "Envie { checkout, syncToBudget, budgetCategory } no corpo da requisição.",
      details: [],
      service: "checkout",
    });
  }

  // Etapa 1: Executar checkout no microsserviço de pedidos
  const checkoutResult = await proxyJsonRequest<PedidoResponse>(
    "checkout",
    "/api/v1/checkout",
    {
      method: "POST",
      body: payload.checkout,
    },
  );

  if (!checkoutResult.ok) {
    return jsonErrorResponse(checkoutResult.error);
  }

  const pedido = checkoutResult.data;
  const syncRequested = Boolean(payload.syncToBudget);

  if (!syncRequested || checkoutResult.status !== 201) {
    const responseBody: CheckoutWithBudgetResponse = {
      pedido,
      budgetSync: {
        requested: syncRequested,
        succeeded: false,
      },
    };
    return NextResponse.json(responseBody, { status: checkoutResult.status });
  }

  // Etapa 2: Orquestrar lançamento automático no Smart Budget
  const itemsSummary = pedido.itens
    .map((item) => `${item.quantidade}x ${item.nomeProduto}`)
    .join(", ");

  const rawDescription = `Compra Loja — Pedido #${pedido.pedidoId} (${itemsSummary})`;
  const description =
    rawDescription.length > 240
      ? `${rawDescription.slice(0, 237)}...`
      : rawDescription;

  const transactionBody: TransactionRequest = {
    description,
    amount: pedido.valorTotal,
    type: "EXPENSE",
    category: payload.budgetCategory ?? "TECH",
  };

  const budgetResult = await proxyJsonRequest<TransactionResponse>(
    "budget",
    "/api/v1/transactions",
    {
      method: "POST",
      body: transactionBody,
    },
  );

  if (!budgetResult.ok) {
    // Falha parcial controlada: o pedido foi confirmado com sucesso!
    const partialResponse: CheckoutWithBudgetResponse = {
      pedido,
      budgetSync: {
        requested: true,
        succeeded: false,
        error: budgetResult.error,
      },
    };
    return NextResponse.json(partialResponse, { status: 201 });
  }

  const consolidated: CheckoutWithBudgetResponse = {
    pedido,
    budgetSync: {
      requested: true,
      succeeded: true,
      transaction: budgetResult.data,
    },
  };

  return NextResponse.json(consolidated, { status: 201 });
}
