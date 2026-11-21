import { NextRequest, NextResponse } from "next/server";
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
import { validateAndEnrichCheckoutRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const originError = verifySameOrigin(request, "checkout");
  if (originError) return originError;

  const limit = checkRateLimit(request, RATE_LIMITS.write);
  if (!limit.allowed) {
    return rateLimitErrorResponse("checkout", limit.retryAfterSeconds);
  }

  const bodyResult = await readJsonBody(request, "checkout");
  if (!bodyResult.ok) return bodyResult.response;

  const validated = validateAndEnrichCheckoutRequest(bodyResult.data);
  if (!validated.ok) {
    return jsonErrorResponse(validated.error);
  }

  const session = resolveSessionContext(request);
  const result = await proxyJsonRequest<PedidoResponse>(
    "checkout",
    "/api/v1/checkout",
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
