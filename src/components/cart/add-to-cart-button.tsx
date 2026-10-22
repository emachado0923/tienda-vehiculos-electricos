"use client";

import { useState } from "react";
import { useCart } from "./cart-provider";
import type { CartItem } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  product: Omit<CartItem, "quantity">;
  withQuantity?: boolean;
  className?: string;
};

export function AddToCartButton({ product, withQuantity = false, className }: Props) {
  const { addItem } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const outOfStock = product.stock <= 0;

  function handleAdd() {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {withQuantity && !outOfStock && (
        <input
          type="number"
          min={1}
          max={product.stock}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value) || 1)))}
          className="input w-20"
          aria-label="Cantidad"
        />
      )}
      <button type="button" onClick={handleAdd} disabled={outOfStock} className="btn-primary flex-1">
        {outOfStock ? "Agotado" : added ? "✓ Agregado" : "Agregar al carrito"}
      </button>
    </div>
  );
}
