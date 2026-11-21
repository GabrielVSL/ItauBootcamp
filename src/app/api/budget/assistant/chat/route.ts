import { NextRequest, NextResponse } from "next/server";
import type { AssistantResponse } from "@/types/budget";
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
import { validateChatRequest } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const originError = verifySameOrigin(request, "budget");
  if (originError) return originError;

  const limit = checkRateLimit(request, RATE_LIMITS.aiChat);
  if (!limit.allowed) {
    return rateLimitErrorResponse("budget", limit.retryAfterSeconds);
  }

  const bodyResult = await readJsonBody(request, "budget", 16 * 1024);
  if (!bodyResult.ok) return bodyResult.response;

  const validated = validateChatRequest(bodyResult.data);
  if (!validated.ok) {
    return jsonErrorResponse(validated.error);
  }

  const session = resolveSessionContext(request);
  const result = await proxyJsonRequest<AssistantResponse>(
    "budget",
    "/api/v1/assistant/chat",
    {
      method: "POST",
      body: validated.data,
      timeoutMs: 35000,
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
