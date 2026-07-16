"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/utils";
import { getCartWhatsAppUrl } from "@/lib/whatsapp";

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    totalItems,
    total,
    hasPendingPrices,
    updateQuantity,
    removeProduct,
    clearCart,
  } = useCart();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-label="Carrito de compras">
      <button
        type="button"
        aria-label="Cerrar carrito"
        className="absolute inset-0 bg-[#210026]/45 backdrop-blur-sm"
        onClick={closeCart}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-[30rem] flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-primary">Pedido por WhatsApp</p>
            <h2 className="text-2xl font-black tracking-tight">Tu carrito</h2>
          </div>
          <Button type="button" variant="outline" size="icon" onClick={closeCart} aria-label="Cerrar carrito">
            <X />
          </Button>
        </div>

        {items.length ? (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <p className="mb-4 rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-foreground">
                Este carrito no procesa pagos. El pedido se enviará a SupraQuím por WhatsApp para confirmar disponibilidad, envío y precio final.
              </p>
              <ul className="space-y-4">
                {items.map((item) => (
                  <li key={item.id} className="rounded-2xl border border-border bg-white p-3 shadow-[0_10px_30px_rgba(41,22,51,.05)]">
                    <div className="grid grid-cols-[5.5rem_1fr] gap-3">
                      <Link href={`/catalogo/${item.slug}`} onClick={closeCart} className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                        {item.imagen ? (
                          <Image src={item.imagen} alt={item.nombre} fill sizes="88px" className="object-cover" />
                        ) : (
                          <span className="grid h-full place-items-center text-primary"><ShoppingBag /></span>
                        )}
                      </Link>
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black leading-tight text-foreground">{item.nombre}</h3>
                            <p className="mt-1 text-xs font-bold text-muted-foreground">{item.presentacion}</p>
                          </div>
                          <button
                            type="button"
                            className="rounded-lg p-1 text-muted-foreground hover:bg-muted hover:text-primary"
                            onClick={() => removeProduct(item.id)}
                            aria-label={`Eliminar ${item.nombre}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <div className="inline-flex items-center rounded-xl border border-border bg-background">
                            <button
                              type="button"
                              className="p-2 text-primary disabled:text-muted-foreground"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label={`Disminuir cantidad de ${item.nombre}`}
                            >
                              <Minus className="size-4" />
                            </button>
                            <span className="min-w-8 text-center text-sm font-black">{item.quantity}</span>
                            <button
                              type="button"
                              className="p-2 text-primary"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              aria-label={`Aumentar cantidad de ${item.nombre}`}
                            >
                              <Plus className="size-4" />
                            </button>
                          </div>
                          <p className="text-right text-sm font-black text-primary">
                            {item.precio === null ? "Precio pendiente" : formatPrice((item.precio ?? 0) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-border bg-white px-5 py-4">
              <div className="flex items-center justify-between text-sm font-semibold text-muted-foreground">
                <span>{totalItems} {totalItems === 1 ? "artículo" : "artículos"}</span>
                <button type="button" className="font-bold text-primary hover:underline" onClick={clearCart}>
                  Vaciar carrito
                </button>
              </div>
              <div className="mt-2 flex items-end justify-between">
                <span className="font-black text-foreground">Total estimado</span>
                <span className="text-2xl font-black text-primary">{formatPrice(total)}</span>
              </div>
              {hasPendingPrices ? (
                <p className="mt-1 text-xs text-muted-foreground">Hay productos con precio pendiente; SupraQuím lo confirmará por WhatsApp.</p>
              ) : null}
              <Button asChild variant="accent" size="lg" className="mt-4 w-full">
                <a href={getCartWhatsAppUrl(items)} target="_blank" rel="noreferrer">
                  Realizar pedido por WhatsApp
                </a>
              </Button>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center px-8 text-center">
            <div>
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
                <ShoppingBag className="size-8" />
              </div>
              <h3 className="mt-5 text-2xl font-black">Tu carrito está vacío</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Añade productos desde el catálogo y arma tu pedido para enviarlo por WhatsApp.</p>
              <Button asChild className="mt-5" onClick={closeCart}>
                <Link href="/catalogo">Explorar catálogo</Link>
              </Button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
