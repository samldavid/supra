"use client";

import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";

export function CartButton({ compact = false }: { compact?: boolean }) {
  const { openCart, totalItems } = useCart();

  return (
    <Button type="button" variant="outline" size={compact ? "icon" : "default"} onClick={openCart} aria-label="Abrir carrito">
      <span className="relative inline-flex">
        <ShoppingCart />
        {totalItems > 0 ? (
          <span className="absolute -top-2 -right-2 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
            {totalItems}
          </span>
        ) : null}
      </span>
      {compact ? null : "Carrito"}
    </Button>
  );
}
