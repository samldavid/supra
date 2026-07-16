"use client";

import { ShoppingCart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import type { Product } from "@/lib/product-types";

interface AddToCartButtonProps {
  product: Product;
  className?: string;
  size?: "default" | "sm" | "lg";
  compact?: boolean;
}

export function AddToCartButton({ product, className, size = "default", compact = false }: AddToCartButtonProps) {
  const { addProduct } = useCart();

  return (
    <Button
      type="button"
      variant="accent"
      size={size}
      className={className}
      onClick={() => addProduct(product)}
      aria-label={`Añadir ${product.nombre} al carrito`}
    >
      <ShoppingCart />
      {compact ? "Añadir" : "Añadir al carrito"}
    </Button>
  );
}
