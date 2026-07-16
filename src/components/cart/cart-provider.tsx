"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import {
  addCartItem,
  CART_STORAGE_KEY,
  getCartTotals,
  parseStoredCart,
  removeCartItem,
  toCartProduct,
  updateCartItemQuantity,
  type CartItem,
} from "@/lib/cart-core";
import type { Product } from "@/lib/product-types";

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  totalItems: number;
  total: number;
  hasPendingPrices: boolean;
  openCart: () => void;
  closeCart: () => void;
  addProduct: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    setItems(parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY)));
    setHasHydrated(true);
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [hasHydrated, items]);

  const addProduct = useCallback((product: Product, quantity = 1) => {
    setItems((current) => addCartItem(current, toCartProduct(product), quantity));
    setIsOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(() => {
    const totals = getCartTotals(items);

    return {
      items,
      isOpen,
      totalItems: totals.totalItems,
      total: totals.total,
      hasPendingPrices: totals.hasPendingPrices,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      addProduct,
      updateQuantity: (productId, quantity) => setItems((current) => updateCartItemQuantity(current, productId, quantity)),
      removeProduct: (productId) => setItems((current) => removeCartItem(current, productId)),
      clearCart: () => setItems([]),
    };
  }, [addProduct, isOpen, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart debe usarse dentro de CartProvider.");
  }

  return context;
}
