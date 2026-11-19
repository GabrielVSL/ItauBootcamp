import { NextResponse } from "next/server";
import type { HealthResponse, ServiceHealth } from "@/types/bff";
import {
  getBudgetApiUrl,
  getBudgetSwaggerUrl,
  getCheckoutApiUrl,
  getCheckoutSwaggerUrl,
} from "@/lib/env";

async function probeService(
  service: "budget" | "checkout",
  name: string,
  baseUrl: string,
  probePath: string,
  swaggerUrl: string,
): Promise<ServiceHealth> {
  const started = Date.now();
  try {
    const res = await fetch(`${baseUrl}${probePath}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    const latencyMs = Date.now() - started;
    if (res.ok || res.status === 404 || res.status === 400) {
      return {
        service,
        name,
        status: "online",
        latencyMs,
        url: baseUrl,
        swaggerUrl,
      };
    }

    return {
      service,
      name,
      status: "offline",
      latencyMs,
      url: baseUrl,
      swaggerUrl,
      error: `HTTP ${res.status}`,
    };
  } catch (err) {
    return {
      service,
      name,
      status: "offline",
      latencyMs: null,
      url: baseUrl,
      swaggerUrl,
      error: err instanceof Error ? err.message : "Conexão recusada",
    };
  }
}

export async function GET() {
  const [budget, checkout] = await Promise.all([
    probeService(
      "budget",
      "Smart Budget Spring AI",
      getBudgetApiUrl(),
      "/api/v1/transactions/summary",
      getBudgetSwaggerUrl(),
    ),
    probeService(
      "checkout",
      "Checkout API Design Patterns",
      getCheckoutApiUrl(),
      "/api/v1/checkout/pedidos",
      getCheckoutSwaggerUrl(),
    ),
  ]);

  const payload: HealthResponse = {
    checkedAt: new Date().toISOString(),
    budget,
    checkout,
  };

  return NextResponse.json(payload, { status: 200 });
}
