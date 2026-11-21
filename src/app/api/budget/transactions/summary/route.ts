import { NextRequest, NextResponse } from "next/server";
import type { FinancialSummaryResponse } from "@/types/budget";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";
import { attachSessionCookie, resolveSessionContext } from "@/lib/security";

export async function GET(request: NextRequest) {
  const session = resolveSessionContext(request);
  const result = await proxyJsonRequest<FinancialSummaryResponse>(
    "budget",
    "/api/v1/transactions/summary",
    { method: "GET", sessionId: session.sessionId },
  );

  if (!result.ok) {
    return attachSessionCookie(jsonErrorResponse(result.error), session);
  }

  return attachSessionCookie(
    NextResponse.json(result.data, { status: result.status }),
    session,
  );
}
