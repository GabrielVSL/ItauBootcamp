import { NextResponse } from "next/server";
import type { FinancialSummaryResponse } from "@/types/budget";
import { jsonErrorResponse, proxyJsonRequest } from "@/lib/bff-proxy";

export async function GET() {
  const result = await proxyJsonRequest<FinancialSummaryResponse>(
    "budget",
    "/api/v1/transactions/summary",
    { method: "GET" },
  );

  if (!result.ok) {
    return jsonErrorResponse(result.error);
  }

  return NextResponse.json(result.data, { status: result.status });
}
