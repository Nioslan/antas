"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { cn } from "@/lib/utils";

type CartLinkProps = {
  className?: string;
  children: React.ReactNode;
};

export function CartLink({ className, children }: CartLinkProps) {
  const { itemCount } = useCart();

  return (
    <Link href="/carrito" aria-label="Carrito" className={cn("relative", className)}>
      {children}
      {itemCount > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-cyan px-1 text-[10px] font-bold text-black">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Link>
  );
}
