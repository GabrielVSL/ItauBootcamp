import { NextResponse } from "next/server";
import type { BackendServiceName, NormalizedApiError } from "@/types/bff";
import {
  getBudgetApiUrl,
  getCheckoutApiUrl,
  getInternalApiKey,
} from "./env";

const MAX_UPSTREAM_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB (comporta áudio TTS em base64)

export type ProxyResult<T> =
  | { ok: true; status: number; data: T }
  | { ok: false; status: number; error: NormalizedApiError };

function getBaseUrl(service: BackendServiceName): string {
  return service === "budget" ? getBudgetApiUrl() : getCheckoutApiUrl();
}

function getServiceDisplayName(service: BackendServiceName): string {
  return service === "budget" ? "Smart Budget Spring AI" : "Checkout API";
}

function extractDetails(rawDetails: unknown): string[] {
  if (!rawDetails) return [];
  if (Array.isArray(rawDetails)) {
    return rawDetails
      .slice(0, 10)
      .map((item) => {
        if (typeof item === "string") return item.slice(0, 300);
        if (item && typeof item === "object") {
          return Object.entries(item as Record<string, unknown>)
            .slice(0, 10)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(", ")
            .slice(0, 300);
        }
        return String(item).slice(0, 300);
      })
      .filter(Boolean);
  }
  if (typeof rawDetails === "object") {
    return Object.entries(rawDetails as Record<string, unknown>)
      .slice(0, 10)
      .map(([key, value]) => `${key}: ${String(value)}`.slice(0, 300));
  }
  if (typeof rawDetails === "string") {
    return [rawDetails.slice(0, 300)];
  }
  return [];
}

/**
 * Normaliza erros vindos de ambos os microsserviços sem vazar payloads brutos,
 * stack traces ou URLs internas para o navegador:
 * - Smart-Budget (EN): { timestamp, status, error, message, path, details }
 * - Checkout-API (PT): { timestamp, status, erro, mensagem, path, detalhes }
 */
export function normalizeUpstreamError(
  service: BackendServiceName,
  status: number,
  payload: unknown,
  fallbackMessage?: string,
): NormalizedApiError {
  const serviceName = getServiceDisplayName(service);

  if (service === "budget" && status === 502) {
    return {
      status: 502,
      title: "Assistente de IA temporariamente indisponível",
      message:
        "Não foi possível consultar o provedor de IA agora. As demais funcionalidades financeiras continuam operando normalmente.",
      details: [],
      service,
    };
  }

  if (status >= 500) {
    return {
      status,
      title: `Erro interno em ${serviceName}`,
      message:
        fallbackMessage ||
        `O serviço ${serviceName} encontrou um erro interno ao processar a solicitação.`,
      details: [],
      service,
    };
  }

  if (payload && typeof payload === "object") {
    const obj = payload as Record<string, unknown>;
    const rawTitle =
      (typeof obj.error === "string" && obj.error) ||
      (typeof obj.erro === "string" && obj.erro) ||
      (typeof obj.title === "string" && obj.title) ||
      `Erro HTTP ${status}`;

    const rawMessage =
      (typeof obj.message === "string" && obj.message) ||
      (typeof obj.mensagem === "string" && obj.mensagem) ||
      fallbackMessage ||
      `A requisição ao serviço ${serviceName} falhou com status ${status}.`;

    const details = extractDetails(obj.details ?? obj.detalhes);

    return {
      status: typeof obj.status === "number" ? obj.status : status,
      title: rawTitle.slice(0, 140),
      message: rawMessage.slice(0, 400),
      details,
      service,
    };
  }

  return {
    status,
    title: `Erro HTTP ${status} (${serviceName})`,
    message:
      typeof payload === "string" && payload.trim().length > 0
        ? payload.trim().slice(0, 300)
        : fallbackMessage ||
          `Falha ao processar resposta do serviço ${serviceName}.`,
    details: [],
    service,
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    const declared = Number(contentLength);
    if (Number.isFinite(declared) && declared > MAX_UPSTREAM_RESPONSE_BYTES) {
      throw new Error("UPSTREAM_RESPONSE_TOO_LARGE");
    }
  }

  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  if (Buffer.byteLength(text, "utf8") > MAX_UPSTREAM_RESPONSE_BYTES) {
    throw new Error("UPSTREAM_RESPONSE_TOO_LARGE");
  }

  if (!text) return null;
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  }
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildUpstreamHeaders(
  sessionId?: string,
  extra?: Record<string, string>,
): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...extra,
  };
  const apiKey = getInternalApiKey();
  if (apiKey) {
    headers["X-Internal-Api-Key"] = apiKey;
  }
  if (sessionId) {
    headers["X-Session-Id"] = sessionId;
  }
  return headers;
}

export async function proxyJsonRequest<T>(
  service: BackendServiceName,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    timeoutMs?: number;
    sessionId?: string;
  } = {},
): Promise<ProxyResult<T>> {
  const baseUrl = getBaseUrl(service);
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? 12000;

  try {
    const extraHeaders: Record<string, string> = {};
    let serializedBody: string | undefined;
    if (options.body !== undefined) {
      extraHeaders["Content-Type"] = "application/json";
      serializedBody = JSON.stringify(options.body);
    }

    const response = await fetch(url, {
      method,
      headers: buildUpstreamHeaders(options.sessionId, extraHeaders),
      body: serializedBody,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const parsed = await parseResponseBody(response);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: normalizeUpstreamError(service, response.status, parsed),
      };
    }

    return {
      ok: true,
      status: response.status,
      data: parsed as T,
    };
  } catch (err) {
    const isTimeout =
      err instanceof Error &&
      (err.name === "TimeoutError" || err.name === "AbortError");
    const isTooLarge =
      err instanceof Error && err.message === "UPSTREAM_RESPONSE_TOO_LARGE";
    const serviceName = getServiceDisplayName(service);

    if (process.env.NODE_ENV !== "production") {
      console.error(`[BFF proxy:${service}] Falha em ${method} ${path}:`, err);
    }

    return {
      ok: false,
      status: isTooLarge ? 502 : 503,
      error: {
        status: isTooLarge ? 502 : 503,
        title: isTooLarge
          ? `Resposta inválida de ${serviceName}`
          : isTimeout
            ? `Tempo esgotado ao chamar ${serviceName}`
            : `${serviceName} indisponível`,
        message: isTooLarge
          ? `O serviço ${serviceName} retornou uma resposta acima do limite permitido.`
          : isTimeout
            ? `O serviço ${serviceName} não respondeu dentro do limite de ${Math.round(timeoutMs / 1000)}s.`
            : `Não foi possível conectar ao serviço ${serviceName} no momento. Tente novamente ou use o Modo Demo.`,
        details: [],
        service,
      },
    };
  }
}

export async function proxyMultipartRequest<T>(
  service: BackendServiceName,
  path: string,
  formData: FormData,
  timeoutMs = 35000,
  sessionId?: string,
): Promise<ProxyResult<T>> {
  const baseUrl = getBaseUrl(service);
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: buildUpstreamHeaders(sessionId),
      body: formData,
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });

    const parsed = await parseResponseBody(response);

    if (!response.ok) {
      return {
        ok: false,
        status: response.status,
        error: normalizeUpstreamError(service, response.status, parsed),
      };
    }

    return {
      ok: true,
      status: response.status,
      data: parsed as T,
    };
  } catch (err) {
    const serviceName = getServiceDisplayName(service);
    if (process.env.NODE_ENV !== "production") {
      console.error(`[BFF multipart:${service}] Falha em POST ${path}:`, err);
    }
    return {
      ok: false,
      status: 503,
      error: {
        status: 503,
        title: `${serviceName} indisponível para áudio`,
        message: `Não foi possível enviar o áudio para ${serviceName} no momento.`,
        details: [],
        service,
      },
    };
  }
}

export function jsonErrorResponse(error: NormalizedApiError): NextResponse {
  return NextResponse.json(error, { status: error.status });
}
