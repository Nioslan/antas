import type { ProductLine } from "@/types/inventory";

export type CartItem = {
  id: string;
  name: string;
  price: number;
  image: string;
  line?: ProductLine;
  quantity: number;
};

export type CartState = {
  items: CartItem[];
  extendedWarranty: boolean;
};

export const CART_STORAGE_KEY = "antas-cart";

export const emptyCart: CartState = {
  items: [],
  extendedWarranty: false,
};

export function getCartSubtotal(items: CartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function cartHasPc(items: CartItem[]) {
  return items.some((item) => item.line !== undefined);
}
