export const GITHUB_BUDGET_REPO =
  "https://github.com/GabrielVSL/Smart-Budget-Spring-AI";
export const GITHUB_CHECKOUT_REPO =
  "https://github.com/GabrielVSL/Checkout-Api-Design-Patterns";

function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
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

export function getBudgetSwaggerUrl(): string {
  return (
    process.env.NEXT_PUBLIC_BUDGET_SWAGGER_URL?.trim() ||
    `${getBudgetApiUrl()}/swagger-ui/index.html`
  );
}

export function getCheckoutSwaggerUrl(): string {
  return (
    process.env.NEXT_PUBLIC_CHECKOUT_SWAGGER_URL?.trim() ||
    `${getCheckoutApiUrl()}/swagger-ui/index.html`
  );
}
