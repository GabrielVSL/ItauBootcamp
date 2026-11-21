export const GITHUB_BUDGET_REPO =
  "https://github.com/GabrielVSL/finance-ai-service";
export const GITHUB_CHECKOUT_REPO =
  "https://github.com/GabrielVSL/checkout-service";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function sanitizePublicHttpUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.toString();
    }
    return null;
  } catch {
    return null;
  }
}

export function getBudgetApiUrl(): string {
  return stripTrailingSlash(
    process.env.BUDGET_API_URL?.trim() || "http://localhost:8080",
  );
}

export function getCheckoutApiUrl(): string {
  return stripTrailingSlash(
    process.env.CHECKOUT_API_URL?.trim() || "http://localhost:8081",
  );
}

/**
 * Chave secreta compartilhada (server-only) enviada no header X-Internal-Api-Key
 * para autenticar chamadas do BFF nos microsserviços Java em produção.
 */
export function getInternalApiKey(): string | null {
  const key = process.env.INTERNAL_API_KEY?.trim();
  return key && key.length > 0 ? key : null;
}

/**
 * Só expõe URL do Swagger ao navegador quando configurada explicitamente
 * via NEXT_PUBLIC_*, evitando vazar URLs/IPs internos do servidor.
 */
export function getPublicBudgetSwaggerUrl(): string | null {
  return sanitizePublicHttpUrl(process.env.NEXT_PUBLIC_BUDGET_SWAGGER_URL);
}

export function getPublicCheckoutSwaggerUrl(): string | null {
  return sanitizePublicHttpUrl(process.env.NEXT_PUBLIC_CHECKOUT_SWAGGER_URL);
}
