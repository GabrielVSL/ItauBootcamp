import { NextRequest, NextResponse } from "next/server";
import type { TransactionResponse } from "@/types/budget";
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
import {
  validateTransactionFilters,
  validateTransactionRequest,
} from "@/lib/validation";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const filters = validateTransactionFilters(
    searchParams.get("category"),
    searchParams.get("type"),
  );

  if (!filters.ok) {
    return jsonErrorResponse(filters.error);
  }

  const session = resolveSessionContext(request);
  const query = new URLSearchParams();
  if (filters.data.category) query.set("category", filters.data.category);
  if (filters.data.type) query.set("type", filters.data.type);

  const qs = query.toString();
  const path = `/api/v1/transactions${qs ? `?${qs}` : ""}`;

  const result = await proxyJsonRequest<TransactionResponse[]>("budget", path, {
    method: "GET",
    sessionId: session.sessionId,
  });

  if (!result.ok) {
    return attachSessionCookie(jsonErrorResponse(result.error), session);
  }

  return attachSessionCookie(
    NextResponse.json(result.data, { status: result.status }),
    session,
  );
}

export async function POST(request: NextRequest) {
  const originError = verifySameOrigin(request, "budget");
  if (originError) return originError;

  const limit = checkRateLimit(request, RATE_LIMITS.write);
  if (!limit.allowed) {
    return rateLimitErrorResponse("budget", limit.retryAfterSeconds);
  }

  const bodyResult = await readJsonBody(request, "budget");
  if (!bodyResult.ok) return bodyResult.response;

  const validated = validateTransactionRequest(bodyResult.data);
  if (!validated.ok) {
    return jsonErrorResponse(validated.error);
  }

  const session = resolveSessionContext(request);
  const result = await proxyJsonRequest<TransactionResponse>(
    "budget",
    "/api/v1/transactions",
    {
      method: "POST",
      body: validated.data,
      sessionId: session.sessionId,
    },
  );

  if (!result.ok) {
    return attachSessionCookie(jsonErrorResponse(result.error), session);
  }

  return attachSessionCookie(
    NextResponse.json(result.data, { status: result.status }),
    session,
  );
}
