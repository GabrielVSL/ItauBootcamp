export type TransactionType = "INCOME" | "EXPENSE";

export type TransactionCategory =
  | "FOOD"
  | "TRANSPORT"
  | "SALARY"
  | "TECH"
  | "HOUSING"
  | "HEALTH"
  | "ENTERTAINMENT"
  | "OTHER";

export const TRANSACTION_TYPES: readonly TransactionType[] = [
  "INCOME",
  "EXPENSE",
] as const;

export const TRANSACTION_CATEGORIES: readonly TransactionCategory[] = [
  "FOOD",
  "TRANSPORT",
  "SALARY",
  "TECH",
  "HOUSING",
  "HEALTH",
  "ENTERTAINMENT",
  "OTHER",
] as const;

export interface TransactionResponse {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  createdAt: string;
}

export interface TransactionRequest {
  description: string;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
}

export interface FinancialSummaryResponse {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  deficitAlert: boolean;
  alertMessage: string;
  transactionCount: number;
}

export interface ChatRequest {
  message: string;
  generateAudio: boolean;
}

export interface AssistantResponse {
  transcribedText?: string | null;
  response: string;
  audioBase64?: string | null;
  timestamp: string;
}
