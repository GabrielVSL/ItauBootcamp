import type { TransactionCategory, TransactionResponse } from "./budget";
import type { CheckoutRequest, PedidoResponse } from "./checkout";

export type BackendServiceName = "budget" | "checkout";

export interface NormalizedApiError {
  status: number;
  title: string;
  message: string;
  details: string[];
  service: BackendServiceName;
}

export interface ServiceHealth {
  service: BackendServiceName;
  name: string;
  status: "online" | "offline";
  latencyMs: number | null;
  swaggerUrl: string | null;
  error?: string;
}

export interface HealthResponse {
  checkedAt: string;
  budget: ServiceHealth;
  checkout: ServiceHealth;
}

export interface CheckoutWithBudgetRequest {
  checkout: CheckoutRequest;
  syncToBudget: boolean;
  budgetCategory?: TransactionCategory;
}

export interface CheckoutWithBudgetResponse {
  pedido: PedidoResponse;
  budgetSync: {
    requested: boolean;
    succeeded: boolean;
    transaction?: TransactionResponse;
    error?: NormalizedApiError;
  };
}
