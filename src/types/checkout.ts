export type ModalidadeFrete = "SEDEX" | "PAC";
export type FormaPagamento = "PIX" | "CARTAO_CREDITO" | "BOLETO";
export type StatusPedido = "CONFIRMADO" | "CANCELADO";

export interface CheckoutItemRequest {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
}

export interface CheckoutRequest {
  clienteNome: string;
  clienteEmail: string;
  itens: CheckoutItemRequest[];
  modalidadeFrete: string; // Aceita ModalidadeFrete ou valores inválidos no Lab de Design Patterns (ex: "DRONE")
  formaPagamento: FormaPagamento;
  cupomDesconto: string | null;
  pesoTotalKg: number;
}

export interface PedidoItemResponse {
  produtoId: string;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface PedidoResponse {
  pedidoId: number | string;
  clienteNome: string;
  clienteEmail: string;
  modalidadeFrete: string;
  formaPagamento: FormaPagamento;
  cupomAplicado: string | null;
  valorItens: number;
  valorFrete: number;
  valorDesconto: number;
  valorTotal: number;
  status: StatusPedido;
  criadoEm: string;
  itens: PedidoItemResponse[];
}
