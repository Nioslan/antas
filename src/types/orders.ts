import type { ProductLine } from "@/types/inventory";

export type PaymentMethod = "cash" | "transfer" | "card" | "other";

export type OrderStatus = "paid" | "pending" | "cancelled";

export type OrderCustomer = {
  name: string;
  phone: string;
  email?: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  line?: ProductLine;
  unitPrice: number;
  quantity: number;
  warrantyMonths: number;
  warrantyEndsAt: string | null;
};

export type OrderPayment = {
  method: PaymentMethod;
  amount: number;
  paidAt: string;
  note?: string;
};

export type OrderWarrantySummary = {
  extended: boolean;
  includedMonths: number;
  months: number;
  startsAt: string;
  endsAt: string | null;
};

export type Order = {
  id: string;
  number: string;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  extendedWarranty: boolean;
  warrantyFee: number;
  total: number;
  payment: OrderPayment;
  status: OrderStatus;
  warranty: OrderWarrantySummary;
  note?: string;
  soldAt: string;
  createdAt: string;
};

export type CreateOrderInput = {
  customer: OrderCustomer;
  items: { productId: string; quantity: number }[];
  extendedWarranty?: boolean;
  paymentMethod?: PaymentMethod;
  paymentNote?: string;
  note?: string;
  soldAt?: string;
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  card: "Tarjeta",
  other: "Otro",
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  paid: "Pagado",
  pending: "Pendiente",
  cancelled: "Cancelado",
};
