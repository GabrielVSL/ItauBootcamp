import { NextResponse } from "next/server";
import type { HealthResponse, ServiceHealth } from "@/types/bff";
import {
  getBudgetApiUrl,
  getCheckoutApiUrl,
  getPublicBudgetSwaggerUrl,
  getPublicCheckoutSwaggerUrl,
} from "@/lib/env";

const HEALTH_CACHE_TTL_MS = 10_000;
let cachedHealth: { expiresAt: number; payload: HealthResponse } | null = null;

async function probeService(
  service: "budget" | "checkout",
  name: string,
  baseUrl: string,
  probePath: string,
  swaggerUrl: string | null,
): Promise<ServiceHealth> {
  const started = Date.now();
  try {
    const res = await fetch(`${baseUrl}${probePath}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });

    const latencyMs = Date.now() - started;
    if (res.ok) {
      return {
        service,
        name,
        status: "online",
        latencyMs,
        swaggerUrl,
      };
    }

    return {
      service,
      name,
      status: "offline",
      latencyMs,
      swaggerUrl,
      error: `HTTP ${res.status}`,
    };
  } catch {
    return {
      service,
      name,
      status: "offline",
      latencyMs: null,
      swaggerUrl,
      error: "Serviço indisponível",
    };
  }
}

export async function GET() {
  const now = Date.now();
  if (cachedHealth && cachedHealth.expiresAt > now) {
    return NextResponse.json(cachedHealth.payload, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  }

  const [budget, checkout] = await Promise.all([
    probeService(
      "budget",
      "Smart Budget Spring AI",
      getBudgetApiUrl(),
      "/health",
      getPublicBudgetSwaggerUrl(),
    ),
    probeService(
      "checkout",
      "Checkout API Design Patterns",
      getCheckoutApiUrl(),
      "/health",
      getPublicCheckoutSwaggerUrl(),
    ),
  ]);

  const payload: HealthResponse = {
    checkedAt: new Date().toISOString(),
    budget,
    checkout,
  };

  cachedHealth = {
    expiresAt: now + HEALTH_CACHE_TTL_MS,
    payload,
  };

  return NextResponse.json(payload, {
    status: 200,
    headers: { "Cache-Control": "no-store" },
  });
}
