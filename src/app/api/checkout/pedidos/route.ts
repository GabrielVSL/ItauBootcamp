import { NextRequest, NextResponse } from "next/server";
import type { PedidoResponse } from "@/types/checkout";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";
import { attachSessionCookie, resolveSessionContext } from "@/lib/security";

export async function GET(request: NextRequest) {
  const session = resolveSessionContext(request);
  const result = await proxyJsonRequest<PedidoResponse[]>(
    "checkout",
    "/api/v1/checkout/pedidos",
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
