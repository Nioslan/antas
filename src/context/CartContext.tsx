"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CART_STORAGE_KEY,
  cartHasPc,
  emptyCart,
  getCartSubtotal,
  type CartItem,
  type CartState,
} from "@/lib/cart";
import {
  calculateExtendedWarranty,
  EXTENDED_WARRANTY_MONTHS,
} from "@/lib/warranty";

type CartContextValue = {
  items: CartItem[];
  extendedWarranty: boolean;
  itemCount: number;
  subtotal: number;
  warrantyFee: number;
  total: number;
  hasPc: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  setExtendedWarranty: (enabled: boolean) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

function loadCart(): CartState {
  if (typeof window === "undefined") return emptyCart;
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return emptyCart;
    return JSON.parse(raw) as CartState;
  } catch {
    return emptyCart;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartState>(emptyCart);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCart(loadCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">) => {
    setCart((prev) => {
      const existing = prev.items.find((i) => i.id === item.id);
      if (existing) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i,
          ),
        };
      }
      return {
        ...prev,
        items: [...prev.items, { ...item, quantity: 1 }],
      };
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setCart((prev) => {
      const items = prev.items.filter((i) => i.id !== id);
      return {
        ...prev,
        items,
        extendedWarranty: cartHasPc(items) ? prev.extendedWarranty : false,
      };
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setCart((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
    }));
  }, []);

  const setExtendedWarranty = useCallback((enabled: boolean) => {
    setCart((prev) => ({ ...prev, extendedWarranty: enabled }));
  }, []);

  const clearCart = useCallback(() => {
    setCart(emptyCart);
  }, []);

  const subtotal = useMemo(() => getCartSubtotal(cart.items), [cart.items]);
  const hasPc = useMemo(() => cartHasPc(cart.items), [cart.items]);
  const warrantyFee = cart.extendedWarranty
    ? calculateExtendedWarranty(subtotal)
    : 0;
  const total = subtotal + warrantyFee;
  const itemCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

  const value: CartContextValue = {
    items: cart.items,
    extendedWarranty: cart.extendedWarranty,
    itemCount,
    subtotal,
    warrantyFee,
    total,
    hasPc,
    addItem,
    removeItem,
    updateQuantity,
    setExtendedWarranty,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export { EXTENDED_WARRANTY_MONTHS };
