import type { Product } from "@/lib/product-types";

export const CART_STORAGE_KEY = "supraquim.cart.v1";

export interface CartProductSnapshot {
  id: string;
  slug: string;
  nombre: string;
  presentacion: string;
  precio: number | null;
  imagen: string;
}

export interface CartItem extends CartProductSnapshot {
  quantity: number;
}

export function toCartProduct(product: Product): CartProductSnapshot {
  return {
    id: product.id,
    slug: product.slug,
    nombre: product.nombre,
    presentacion: product.presentacion,
    precio: product.precio,
    imagen: product.imagen,
  };
}

export function normalizeQuantity(quantity: number) {
  if (!Number.isFinite(quantity)) return 1;
  return Math.min(999, Math.max(1, Math.trunc(quantity)));
}

export function addCartItem(items: CartItem[], product: CartProductSnapshot, quantity = 1): CartItem[] {
  const safeQuantity = normalizeQuantity(quantity);
  const existing = items.find((item) => item.id === product.id);

  if (existing) {
    return items.map((item) =>
      item.id === product.id
        ? { ...item, ...product, quantity: normalizeQuantity(item.quantity + safeQuantity) }
        : item,
    );
  }

  return [...items, { ...product, quantity: safeQuantity }];
}

export function updateCartItemQuantity(items: CartItem[], productId: string, quantity: number): CartItem[] {
  const safeQuantity = normalizeQuantity(quantity);
  return items.map((item) => (item.id === productId ? { ...item, quantity: safeQuantity } : item));
}

export function removeCartItem(items: CartItem[], productId: string): CartItem[] {
  return items.filter((item) => item.id !== productId);
}

export function getItemSubtotal(item: CartItem) {
  return (item.precio ?? 0) * item.quantity;
}

export function getCartTotals(items: CartItem[]) {
  return items.reduce(
    (totals, item) => ({
      totalItems: totals.totalItems + item.quantity,
      total: totals.total + getItemSubtotal(item),
      hasPendingPrices: totals.hasPendingPrices || item.precio === null,
    }),
    { totalItems: 0, total: 0, hasPendingPrices: false },
  );
}

function formatCartPrice(price: number) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(price);
}

export function parseStoredCart(value: string | null): CartItem[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === "object" && typeof item.id === "string")
      .map((item) => ({
        id: String(item.id),
        slug: String(item.slug ?? ""),
        nombre: String(item.nombre ?? "Producto"),
        presentacion: String(item.presentacion ?? "Información pendiente"),
        precio: typeof item.precio === "number" && Number.isFinite(item.precio) ? item.precio : null,
        imagen: String(item.imagen ?? ""),
        quantity: normalizeQuantity(Number(item.quantity ?? 1)),
      }));
  } catch {
    return [];
  }
}

export function buildCartWhatsAppMessage(items: CartItem[]) {
  const { total, hasPendingPrices } = getCartTotals(items);
  const productLines = items
    .map((item, index) => {
      const unitPrice = item.precio === null ? "Información pendiente" : formatCartPrice(item.precio);
      const subtotal = item.precio === null ? "Información pendiente" : formatCartPrice(getItemSubtotal(item));

      return `${index + 1}. ${item.nombre}
   Presentación: ${item.presentacion || "Información pendiente"}
   Cantidad: ${item.quantity}
   Precio unitario: ${unitPrice}
   Subtotal: ${subtotal}`;
    })
    .join("\n\n");

  return `Hola, quiero solicitar los siguientes productos de SupraQuím:

${productLines}

Total estimado: ${hasPendingPrices ? `${formatCartPrice(total)} + productos con precio pendiente` : formatCartPrice(total)}

Quedo atento a la confirmación de disponibilidad, envío y precio final.`;
}
