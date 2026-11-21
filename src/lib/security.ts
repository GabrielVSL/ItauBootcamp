import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import type { BackendServiceName, NormalizedApiError } from "@/types/bff";

export const SESSION_COOKIE_NAME = "portal_session_id";
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 24h (alinhado à retenção dos microsserviços)
const SESSION_ID_REGEX = /^[a-zA-Z0-9_-]{8,64}$/;

export interface SessionResolution {
  sessionId: string;
  isNew: boolean;
}

/**
 * Resolve (ou gera) um identificador de sessão isolado por visitante via cookie HttpOnly,
 * encaminhado server-side como header X-Session-Id para ambos os microsserviços.
 */
export function resolveSessionContext(request: NextRequest): SessionResolution {
  const existing = request.cookies.get(SESSION_COOKIE_NAME)?.value?.trim();
  if (existing && SESSION_ID_REGEX.test(existing)) {
    return { sessionId: existing, isNew: false };
  }
  return { sessionId: randomUUID(), isNew: true };
}

export function attachSessionCookie(
  response: NextResponse,
  session: SessionResolution,
): NextResponse {
  if (!session.isNew) return response;
  response.cookies.set(SESSION_COOKIE_NAME, session.sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return response;
}

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 5000;

function cleanupExpiredBuckets(now: number): void {
  if (rateLimitStore.size < MAX_BUCKETS) return;
  for (const [key, bucket] of rateLimitStore.entries()) {
    if (bucket.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
  // Evicção FIFO caso ainda exceda o teto com chaves não expiradas (anti-memory-flood)
  while (rateLimitStore.size >= MAX_BUCKETS) {
    const oldestKey = rateLimitStore.keys().next().value;
    if (oldestKey === undefined) break;
    rateLimitStore.delete(oldestKey);
  }
}

export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp.slice(0, 64);
  return "local";
}

export interface RateLimitConfig {
  bucket: string;
  limit: number;
  windowMs: number;
}

export const RATE_LIMITS = {
  aiChat: { bucket: "ai-chat", limit: 15, windowMs: 60_000 },
  aiVoice: { bucket: "ai-voice", limit: 8, windowMs: 60_000 },
  write: { bucket: "write", limit: 30, windowMs: 60_000 },
} as const satisfies Record<string, RateLimitConfig>;

export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig,
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const ip = getClientIp(request);
  const key = `${config.bucket}:${ip}`;
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, config.limit - 1),
      retryAfterSeconds: Math.ceil(config.windowMs / 1000),
    };
  }

  if (current.count >= config.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((current.resetAt - now) / 1000),
    );
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  current.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, config.limit - current.count),
    retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
  };
}

export function rateLimitErrorResponse(
  service: BackendServiceName,
  retryAfterSeconds: number,
): NextResponse {
  const error: NormalizedApiError = {
    status: 429,
    title: "Muitas requisições",
    message: `Limite temporário atingido. Aguarde ${retryAfterSeconds}s antes de tentar novamente.`,
    details: [],
    service,
  };
  return NextResponse.json(error, {
    status: 429,
    headers: { "Retry-After": String(retryAfterSeconds) },
  });
}

/**
 * Proteção básica contra CSRF em rotas de mutação (POST/PUT/PATCH/DELETE):
 * se o navegador enviar o header Origin, garante que ele corresponda ao Host atual.
 */
export function verifySameOrigin(
  request: NextRequest,
  service: BackendServiceName,
): NextResponse | null {
  const origin = request.headers.get("origin");
  if (!origin) {
    const fetchSite = request.headers.get("sec-fetch-site")?.trim().toLowerCase();
    if (fetchSite === "cross-site") {
      const error: NormalizedApiError = {
        status: 403,
        title: "Origem não autorizada",
        message: "A requisição cross-site foi bloqueada pela política de segurança.",
        details: [],
        service,
      };
      return NextResponse.json(error, { status: 403 });
    }
    return null;
  }

  const host =
    request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return null;

  try {
    const originHost = new URL(origin).host.toLowerCase();
    const expectedHost = host.split(",")[0].trim().toLowerCase();
    if (originHost !== expectedHost) {
      const error: NormalizedApiError = {
        status: 403,
        title: "Origem não autorizada",
        message: "A requisição foi bloqueada pela política de mesma origem.",
        details: [],
        service,
      };
      return NextResponse.json(error, { status: 403 });
    }
  } catch {
    const error: NormalizedApiError = {
      status: 403,
      title: "Origem inválida",
      message: "O cabeçalho Origin enviado na requisição é inválido.",
      details: [],
      service,
    };
    return NextResponse.json(error, { status: 403 });
  }

  return null;
}

export async function readJsonBody(
  request: NextRequest,
  service: BackendServiceName,
  maxBytes = 64 * 1024,
): Promise<
  { ok: true; data: unknown } | { ok: false; response: NextResponse }
> {
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const declaredSize = Number(contentLengthHeader);
    if (Number.isFinite(declaredSize) && declaredSize > maxBytes) {
      const error: NormalizedApiError = {
        status: 413,
        title: "Payload muito grande",
        message: `O corpo da requisição excede o limite máximo de ${Math.round(maxBytes / 1024)} KB.`,
        details: [],
        service,
      };
      return { ok: false, response: NextResponse.json(error, { status: 413 }) };
    }
  }

  let rawText: string;
  try {
    rawText = await request.text();
  } catch {
    const error: NormalizedApiError = {
      status: 400,
      title: "Corpo inválido",
      message: "Não foi possível ler o corpo da requisição.",
      details: [],
      service,
    };
    return { ok: false, response: NextResponse.json(error, { status: 400 }) };
  }

  if (Buffer.byteLength(rawText, "utf8") > maxBytes) {
    const error: NormalizedApiError = {
      status: 413,
      title: "Payload muito grande",
      message: `O corpo da requisição excede o limite máximo de ${Math.round(maxBytes / 1024)} KB.`,
      details: [],
      service,
    };
    return { ok: false, response: NextResponse.json(error, { status: 413 }) };
  }

  try {
    return { ok: true, data: JSON.parse(rawText) as unknown };
  } catch {
    const error: NormalizedApiError = {
      status: 400,
      title: "JSON inválido",
      message: "O corpo da requisição não pôde ser interpretado como JSON.",
      details: [],
      service,
    };
    return { ok: false, response: NextResponse.json(error, { status: 400 }) };
  }
}
