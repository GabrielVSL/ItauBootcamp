import { NextRequest, NextResponse } from "next/server";
import type { PedidoResponse } from "@/types/checkout";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const result = await proxyJsonRequest<PedidoResponse>(
    "checkout",
    `/api/v1/checkout/pedidos/${encodeURIComponent(id)}`,
    { method: "GET" },
  );

  if (!result.ok) {
    return jsonErrorResponse(result.error);
  }

  return NextResponse.json(result.data, { status: result.status });
}
