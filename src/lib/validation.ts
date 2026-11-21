import {
  TRANSACTION_CATEGORIES,
  TRANSACTION_TYPES,
  type ChatRequest,
  type TransactionCategory,
  type TransactionRequest,
  type TransactionType,
} from "@/types/budget";
import type {
  CheckoutItemRequest,
  CheckoutRequest,
  FormaPagamento,
  ModalidadeFrete,
} from "@/types/checkout";
import type {
  BackendServiceName,
  CheckoutWithBudgetRequest,
  NormalizedApiError,
} from "@/types/bff";
import { CATALOG_PRODUCTS } from "./catalog";

export type ValidationResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: NormalizedApiError };

const VALID_CATEGORIES = new Set<string>(TRANSACTION_CATEGORIES);
const VALID_TYPES = new Set<string>(TRANSACTION_TYPES);
const VALID_FREIGHTS = new Set<ModalidadeFrete>(["PAC", "SEDEX"]);
const VALID_PAYMENTS = new Set<FormaPagamento>([
  "PIX",
  "CARTAO_CREDITO",
  "BOLETO",
]);
const CATALOG_BY_ID = new Map(CATALOG_PRODUCTS.map((p) => [p.produtoId, p]));

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const COUPON_REGEX = /^[A-Z0-9_-]{1,32}$/;
const ORDER_ID_REGEX =
  /^(?:\d{1,12}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export const MAX_VOICE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_AUDIO_MIMES: Record<string, string> = {
  "audio/webm": "webm",
  "audio/mp4": "m4a",
  "audio/x-m4a": "m4a",
  "audio/m4a": "m4a",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/ogg": "ogg",
  "audio/flac": "flac",
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validationError(
  service: BackendServiceName,
  message: string,
  details: string[] = [],
  status = 400,
): { ok: false; error: NormalizedApiError } {
  return {
    ok: false,
    error: {
      status,
      title: "Dados inválidos",
      message,
      details,
      service,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function validateTransactionFilters(
  category: string | null,
  type: string | null,
): ValidationResult<{
  category?: TransactionCategory;
  type?: TransactionType;
}> {
  const result: { category?: TransactionCategory; type?: TransactionType } = {};

  if (category !== null && category.trim() !== "") {
    const normalized = category.trim().toUpperCase();
    if (!VALID_CATEGORIES.has(normalized)) {
      return validationError("budget", "Filtro de categoria inválido.", [
        `Categorias aceitas: ${TRANSACTION_CATEGORIES.join(", ")}.`,
      ]);
    }
    result.category = normalized as TransactionCategory;
  }

  if (type !== null && type.trim() !== "") {
    const normalized = type.trim().toUpperCase();
    if (!VALID_TYPES.has(normalized)) {
      return validationError("budget", "Filtro de tipo inválido.", [
        `Tipos aceitos: ${TRANSACTION_TYPES.join(", ")}.`,
      ]);
    }
    result.type = normalized as TransactionType;
  }

  return { ok: true, data: result };
}

export function validateTransactionRequest(
  raw: unknown,
): ValidationResult<TransactionRequest> {
  if (!isPlainObject(raw)) {
    return validationError("budget", "O corpo deve ser um objeto JSON válido.");
  }

  const details: string[] = [];

  const description =
    typeof raw.description === "string" ? raw.description.trim() : "";
  if (description.length < 1 || description.length > 200) {
    details.push("Descrição deve ter entre 1 e 200 caracteres.");
  }

  const amount = typeof raw.amount === "number" ? raw.amount : Number.NaN;
  if (!Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
    details.push("Valor deve ser um número positivo até R$ 10.000.000,00.");
  }

  const type = typeof raw.type === "string" ? raw.type.trim().toUpperCase() : "";
  if (!VALID_TYPES.has(type)) {
    details.push("Tipo deve ser INCOME ou EXPENSE.");
  }

  const category =
    typeof raw.category === "string" ? raw.category.trim().toUpperCase() : "";
  if (!VALID_CATEGORIES.has(category)) {
    details.push("Categoria informada não é suportada.");
  }

  if (details.length > 0) {
    return validationError(
      "budget",
      "Verifique os campos da transação antes de enviar.",
      details,
    );
  }

  return {
    ok: true,
    data: {
      description,
      amount: round2(amount),
      type: type as TransactionType,
      category: category as TransactionCategory,
    },
  };
}

export function validateChatRequest(
  raw: unknown,
): ValidationResult<ChatRequest> {
  if (!isPlainObject(raw)) {
    return validationError("budget", "O corpo deve ser um objeto JSON válido.");
  }

  const message = typeof raw.message === "string" ? raw.message.trim() : "";
  if (message.length < 1 || message.length > 1000) {
    return validationError(
      "budget",
      "A mensagem deve ter entre 1 e 1.000 caracteres.",
    );
  }

  const generateAudio =
    typeof raw.generateAudio === "boolean" ? raw.generateAudio : false;

  const history: NonNullable<ChatRequest["history"]> = [];
  if (Array.isArray(raw.history)) {
    for (const entry of raw.history.slice(-8)) {
      if (!isPlainObject(entry)) continue;
      const role = entry.role === "user" || entry.role === "assistant"
        ? entry.role
        : null;
      const content =
        typeof entry.content === "string" ? entry.content.trim() : "";
      if (role && content.length > 0) {
        history.push({
          role,
          content: content.slice(0, 600),
        });
      }
    }
  }

  return {
    ok: true,
    data: {
      message,
      generateAudio,
      ...(history.length > 0 ? { history } : {}),
    },
  };
}

export function validateVoiceUpload(
  audio: FormDataEntryValue | null,
): ValidationResult<{ blob: Blob; safeFilename: string }> {
  if (!audio || !(audio instanceof Blob)) {
    return validationError(
      "budget",
      'Envie um arquivo de áudio válido no campo "audio".',
    );
  }

  if (audio.size <= 0) {
    return validationError("budget", "O arquivo de áudio está vazio.");
  }

  if (audio.size > MAX_VOICE_BYTES) {
    return validationError(
      "budget",
      "O arquivo de áudio excede o limite máximo de 5 MB.",
      [],
      413,
    );
  }

  const baseMime = (audio.type || "").split(";")[0].trim().toLowerCase();
  const ext = ALLOWED_AUDIO_MIMES[baseMime];
  if (!ext) {
    return validationError(
      "budget",
      "Formato de áudio não suportado.",
      ["Envie um áudio em formato WebM, MP3, M4A, WAV, OGG ou FLAC."],
      415,
    );
  }

  return {
    ok: true,
    data: {
      blob: audio,
      safeFilename: `gravacao.${ext}`,
    },
  };
}

export function validateOrderId(id: string): ValidationResult<string> {
  const trimmed = id.trim();
  if (!ORDER_ID_REGEX.test(trimmed)) {
    return validationError("checkout", "Identificador de pedido inválido.");
  }
  return { ok: true, data: trimmed };
}

/**
 * Valida o checkout em runtime e sobrescreve preço, nome e peso total
 * com base no catálogo oficial do servidor — impedindo adulteração de
 * valores (price/weight tampering) pelo navegador.
 */
export function validateAndEnrichCheckoutRequest(
  raw: unknown,
): ValidationResult<CheckoutRequest> {
  if (!isPlainObject(raw)) {
    return validationError("checkout", "O corpo do checkout deve ser JSON.");
  }

  const details: string[] = [];

  const clienteNome =
    typeof raw.clienteNome === "string" ? raw.clienteNome.trim() : "";
  if (clienteNome.length < 2 || clienteNome.length > 120) {
    details.push("Nome do cliente deve ter entre 2 e 120 caracteres.");
  }

  const clienteEmail =
    typeof raw.clienteEmail === "string"
      ? raw.clienteEmail.trim().toLowerCase()
      : "";
  if (clienteEmail.length > 160 || !EMAIL_REGEX.test(clienteEmail)) {
    details.push("Informe um e-mail válido.");
  }

  const modalidadeFrete =
    typeof raw.modalidadeFrete === "string"
      ? raw.modalidadeFrete.trim().toUpperCase()
      : "";
  if (!VALID_FREIGHTS.has(modalidadeFrete as ModalidadeFrete)) {
    details.push("Modalidade de frete deve ser PAC ou SEDEX.");
  }

  const formaPagamento =
    typeof raw.formaPagamento === "string"
      ? raw.formaPagamento.trim().toUpperCase()
      : "";
  if (!VALID_PAYMENTS.has(formaPagamento as FormaPagamento)) {
    details.push("Forma de pagamento deve ser PIX, CARTAO_CREDITO ou BOLETO.");
  }

  let cupomDesconto: string | null = null;
  if (raw.cupomDesconto !== null && raw.cupomDesconto !== undefined) {
    if (typeof raw.cupomDesconto !== "string") {
      details.push("Cupom de desconto inválido.");
    } else {
      const normalizedCoupon = raw.cupomDesconto.trim().toUpperCase();
      if (normalizedCoupon.length > 0) {
        if (!COUPON_REGEX.test(normalizedCoupon)) {
          details.push("Cupom contém caracteres não permitidos.");
        } else {
          cupomDesconto = normalizedCoupon;
        }
      }
    }
  }

  if (!Array.isArray(raw.itens) || raw.itens.length === 0) {
    details.push("O pedido precisa conter ao menos 1 item.");
  } else if (raw.itens.length > 30) {
    details.push("O pedido excede o limite de 30 itens distintos.");
  }

  const enrichedItens: CheckoutItemRequest[] = [];
  let computedWeightKg = 0;

  if (Array.isArray(raw.itens) && raw.itens.length <= 30) {
    for (const item of raw.itens) {
      if (!isPlainObject(item)) {
        details.push("Item de pedido com formato inválido.");
        continue;
      }
      const produtoId =
        typeof item.produtoId === "string" ? item.produtoId.trim() : "";
      const catalogItem = CATALOG_BY_ID.get(produtoId);
      if (!catalogItem) {
        details.push(`Produto "${produtoId || "desconhecido"}" não existe no catálogo.`);
        continue;
      }

      const quantidade =
        typeof item.quantidade === "number" ? item.quantidade : Number.NaN;
      if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
        details.push(
          `Quantidade inválida para "${catalogItem.nomeProduto}" (use entre 1 e 99).`,
        );
        continue;
      }

      enrichedItens.push({
        produtoId: catalogItem.produtoId,
        nomeProduto: catalogItem.nomeProduto,
        quantidade,
        precoUnitario: catalogItem.precoUnitario,
      });
      computedWeightKg += catalogItem.pesoKg * quantidade;
    }
  }

  if (details.length > 0 || enrichedItens.length === 0) {
    return validationError(
      "checkout",
      "Os dados do checkout são inválidos.",
      details,
    );
  }

  return {
    ok: true,
    data: {
      clienteNome,
      clienteEmail,
      itens: enrichedItens,
      modalidadeFrete: modalidadeFrete as ModalidadeFrete,
      formaPagamento: formaPagamento as FormaPagamento,
      cupomDesconto,
      pesoTotalKg: round2(computedWeightKg),
    },
  };
}

export function validateCheckoutWithBudgetRequest(
  raw: unknown,
): ValidationResult<CheckoutWithBudgetRequest> {
  if (!isPlainObject(raw)) {
    return validationError(
      "checkout",
      "Envie { checkout, syncToBudget, budgetCategory } no corpo da requisição.",
    );
  }

  const checkoutResult = validateAndEnrichCheckoutRequest(raw.checkout);
  if (!checkoutResult.ok) {
    return checkoutResult;
  }

  const syncToBudget = Boolean(raw.syncToBudget);
  let budgetCategory: TransactionCategory = "TECH";

  if (raw.budgetCategory !== undefined && raw.budgetCategory !== null) {
    const normalized =
      typeof raw.budgetCategory === "string"
        ? raw.budgetCategory.trim().toUpperCase()
        : "";
    if (!VALID_CATEGORIES.has(normalized)) {
      return validationError("checkout", "Categoria financeira inválida.");
    }
    budgetCategory = normalized as TransactionCategory;
  }

  return {
    ok: true,
    data: {
      checkout: checkoutResult.data,
      syncToBudget,
      budgetCategory,
    },
  };
}
