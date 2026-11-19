import { NextRequest, NextResponse } from "next/server";
import type { CheckoutRequest, PedidoResponse } from "@/types/checkout";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";

export async function POST(request: NextRequest) {
  let body: CheckoutRequest;
  try {
    body = (await request.json()) as CheckoutRequest;
  } catch {
    return jsonErrorResponse({
      status: 400,
      title: "JSON inválido",
      message: "O corpo do checkout não pôde ser interpretado como JSON.",
      details: [],
      service: "checkout",
    });
  }

  const result = await proxyJsonRequest<PedidoResponse>(
    "checkout",
    "/api/v1/checkout",
    {
      method: "POST",
      body,
    },
  );

  if (!result.ok) {
    return jsonErrorResponse(result.error);
  }

  return NextResponse.json(result.data, { status: result.status });
}
