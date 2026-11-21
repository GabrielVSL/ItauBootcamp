import { NextRequest, NextResponse } from "next/server";
import type { CheckoutWithBudgetResponse } from "@/types/bff";
import type { TransactionRequest, TransactionResponse } from "@/types/budget";
import type { PedidoResponse } from "@/types/checkout";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";
import {
  RATE_LIMITS,
  attachSessionCookie,
  checkRateLimit,
  rateLimitErrorResponse,
  readJsonBody,
  resolveSessionContext,
  verifySameOrigin,
} from "@/lib/security";
import { validateCheckoutWithBudgetRequest } from "@/lib/validation";

/**
 * Rota Orquestrada do BFF:
 * 1. Valida e recalcula preços/peso pelo catálogo oficial no servidor.
 * 2. Executa POST /api/v1/checkout no checkout-service.
 * 3. Se retornar 201 Created e syncToBudget === true, lança a despesa
 *    automaticamente no finance-ai-service (POST /api/v1/transactions).
 * 4. Trata falhas parciais com transparência.
 */
export async function POST(request: NextRequest) {
  const originError = verifySameOrigin(request, "checkout");
  if (originError) return originError;

  const limit = checkRateLimit(request, RATE_LIMITS.write);
  if (!limit.allowed) {
    return rateLimitErrorResponse("checkout", limit.retryAfterSeconds);
  }

  const bodyResult = await readJsonBody(request, "checkout");
  if (!bodyResult.ok) return bodyResult.response;

  const validated = validateCheckoutWithBudgetRequest(bodyResult.data);
  if (!validated.ok) {
    return jsonErrorResponse(validated.error);
  }

  const session = resolveSessionContext(request);
  const payload = validated.data;

  // Etapa 1: Executar checkout no microsserviço de pedidos
  const checkoutResult = await proxyJsonRequest<PedidoResponse>(
    "checkout",
    "/api/v1/checkout",
    {
      method: "POST",
      body: payload.checkout,
      sessionId: session.sessionId,
    },
  );

  if (!checkoutResult.ok) {
    return attachSessionCookie(jsonErrorResponse(checkoutResult.error), session);
  }

  const pedido = checkoutResult.data;
  const syncRequested = payload.syncToBudget;

  if (!syncRequested || checkoutResult.status !== 201) {
    const responseBody: CheckoutWithBudgetResponse = {
      pedido,
      budgetSync: {
        requested: syncRequested,
        succeeded: false,
      },
    };
    return attachSessionCookie(
      NextResponse.json(responseBody, { status: checkoutResult.status }),
      session,
    );
  }

  // Etapa 2: Orquestrar lançamento automático no finance-ai-service
  const totalQty = pedido.itens.reduce((acc, item) => acc + item.quantidade, 0);
  const rawDescription =
    pedido.itens.length === 1 && totalQty === 1
      ? `Pedido #${pedido.pedidoId} · ${pedido.itens[0].nomeProduto}`
      : `Pedido #${pedido.pedidoId} · ${totalQty} itens na Loja`;
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
      sessionId: session.sessionId,
    },
  );

  if (!budgetResult.ok) {
    const partialResponse: CheckoutWithBudgetResponse = {
      pedido,
      budgetSync: {
        requested: true,
        succeeded: false,
        error: budgetResult.error,
      },
    };
    return attachSessionCookie(
      NextResponse.json(partialResponse, { status: 201 }),
      session,
    );
  }

  const consolidated: CheckoutWithBudgetResponse = {
    pedido,
    budgetSync: {
      requested: true,
      succeeded: true,
      transaction: budgetResult.data,
    },
  };

  return attachSessionCookie(
    NextResponse.json(consolidated, { status: 201 }),
    session,
  );
}
