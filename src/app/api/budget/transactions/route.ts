import { NextRequest, NextResponse } from "next/server";
import type { TransactionRequest, TransactionResponse } from "@/types/budget";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = new URLSearchParams();
  const category = searchParams.get("category");
  const type = searchParams.get("type");

  if (category) query.set("category", category);
  if (type) query.set("type", type);

  const qs = query.toString();
  const path = `/api/v1/transactions${qs ? `?${qs}` : ""}`;

  const result = await proxyJsonRequest<TransactionResponse[]>("budget", path, {
    method: "GET",
  });

  if (!result.ok) {
    return jsonErrorResponse(result.error);
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(request: NextRequest) {
  let body: TransactionRequest;
  try {
    body = (await request.json()) as TransactionRequest;
  } catch {
    return jsonErrorResponse({
      status: 400,
      title: "JSON inválido",
      message: "O corpo da requisição não pôde ser interpretado como JSON.",
      details: [],
      service: "budget",
    });
  }

  const result = await proxyJsonRequest<TransactionResponse>(
    "budget",
    "/api/v1/transactions",
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
