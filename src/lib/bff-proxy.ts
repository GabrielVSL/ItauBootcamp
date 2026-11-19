import { NextResponse } from "next/server";
import type { BackendServiceName, NormalizedApiError } from "@/types/bff";
import { getBudgetApiUrl, getCheckoutApiUrl } from "./env";

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
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object") {
          return Object.entries(item as Record<string, unknown>)
            .map(([k, v]) => `${k}: ${String(v)}`)
            .join(", ");
        }
        return String(item);
      })
      .filter(Boolean);
  }
  if (typeof rawDetails === "object") {
    return Object.entries(rawDetails as Record<string, unknown>).map(
      ([key, value]) => `${key}: ${String(value)}`,
    );
  }
  if (typeof rawDetails === "string") {
    return [rawDetails];
  }
  return [];
}

/**
 * Normaliza erros vindos de ambos os microsserviços:
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
    const record =
      payload && typeof payload === "object"
        ? (payload as Record<string, unknown>)
        : {};
    const upstreamMsg =
      typeof record.message === "string"
        ? record.message
        : typeof record.mensagem === "string"
          ? record.mensagem
          : null;

    return {
      status: 502,
      title: "Assistente de IA temporariamente indisponível (502)",
      message:
        "O Smart Budget não conseguiu se comunicar com a OpenAI. Verifique se a variável OPENAI_API_KEY está configurada no backend — todas as outras funcionalidades financeiras continuam operando normalmente.",
      details: upstreamMsg ? [`Detalhe técnico: ${upstreamMsg}`] : [],
      service,
      raw: payload,
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
      title: rawTitle,
      message: rawMessage,
      details,
      service,
      raw: payload,
    };
  }

  return {
    status,
    title: `Erro HTTP ${status} (${serviceName})`,
    message:
      typeof payload === "string" && payload.trim().length > 0
        ? payload.trim()
        : fallbackMessage ||
          `Falha ao processar resposta do serviço ${serviceName}.`,
    details: [],
    service,
    raw: payload,
  };
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
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

export async function proxyJsonRequest<T>(
  service: BackendServiceName,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
    body?: unknown;
    timeoutMs?: number;
  } = {},
): Promise<ProxyResult<T>> {
  const baseUrl = getBaseUrl(service);
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";
  const timeoutMs = options.timeoutMs ?? 12000;

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    let serializedBody: string | undefined;
    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
      serializedBody = JSON.stringify(options.body);
    }

    const response = await fetch(url, {
      method,
      headers,
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
    const serviceName = getServiceDisplayName(service);

    return {
      ok: false,
      status: 503,
      error: {
        status: 503,
        title: isTimeout
          ? `Tempo esgotado ao chamar ${serviceName}`
          : `${serviceName} indisponível`,
        message: isTimeout
          ? `O microsserviço ${serviceName} (${baseUrl}) não respondeu dentro do limite de ${Math.round(timeoutMs / 1000)}s.`
          : `Não foi possível conectar ao microsserviço ${serviceName} em ${baseUrl}. Verifique se a aplicação Java está em execução ou ative o Modo Demo.`,
        details: err instanceof Error ? [err.message] : [],
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
): Promise<ProxyResult<T>> {
  const baseUrl = getBaseUrl(service);
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const response = await fetch(url, {
      method: "POST",
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
    return {
      ok: false,
      status: 503,
      error: {
        status: 503,
        title: `${serviceName} indisponível para áudio`,
        message: `Não foi possível enviar o áudio para ${serviceName} em ${baseUrl}.`,
        details: err instanceof Error ? [err.message] : [],
        service,
      },
    };
  }
}

export function jsonErrorResponse(error: NormalizedApiError): NextResponse {
  return NextResponse.json(error, { status: error.status });
}
