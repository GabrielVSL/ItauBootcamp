import { NextRequest, NextResponse } from "next/server";
import type { PedidoResponse } from "@/types/checkout";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";
import { attachSessionCookie, resolveSessionContext } from "@/lib/security";
import { validateOrderId } from "@/lib/validation";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const validated = validateOrderId(id);
  if (!validated.ok) {
    return jsonErrorResponse(validated.error);
  }

  const session = resolveSessionContext(request);
  const result = await proxyJsonRequest<PedidoResponse>(
    "checkout",
    `/api/v1/checkout/pedidos/${encodeURIComponent(validated.data)}`,
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
