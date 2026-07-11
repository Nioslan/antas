"use client";

import { useState } from "react";
import { Check, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useCart } from "@/context/CartContext";
import type { ProductLine } from "@/types/inventory";
import { cn } from "@/lib/utils";

type AddToCartButtonProps = {
  id: string;
  name: string;
  price: number;
  image: string;
  line?: ProductLine;
  disabled?: boolean;
  className?: string;
};

export function AddToCartButton({
  id,
  name,
  price,
  image,
  line,
  disabled,
  className,
}: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  function handleClick() {
    addItem({ id, name, price, image, line });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className={cn("flex flex-col gap-2 sm:flex-row", className)}>
      <Button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        className="gap-2"
      >
        {added ? (
          <>
            <Check className="h-4 w-4" />
            Agregado
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4" />
            Agregar al carrito
          </>
        )}
      </Button>
      <Button href="/carrito" variant="secondary">
        Ver carrito
      </Button>
    </div>
  );
}
