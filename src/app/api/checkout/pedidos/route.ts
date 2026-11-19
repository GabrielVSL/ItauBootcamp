import { NextResponse } from "next/server";
import type { PedidoResponse } from "@/types/checkout";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";

export async function GET() {
  const result = await proxyJsonRequest<PedidoResponse[]>(
    "checkout",
    "/api/v1/checkout/pedidos",
    { method: "GET" },
  );

  if (!result.ok) {
    return jsonErrorResponse(result.error);
  }

  return NextResponse.json(result.data, { status: result.status });
}
