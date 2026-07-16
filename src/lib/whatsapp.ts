import { buildCartWhatsAppMessage, type CartItem } from "@/lib/cart-core";

export const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "") || "573226450404";

export function getWhatsAppUrl(message = "Hola, quiero conocer más sobre los productos de SupraQuím y solicitar una cotización.") {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function getProductWhatsAppUrl(productName: string) {
  return getWhatsAppUrl(`Hola, estoy interesado en ${productName} de SupraQuím y quisiera recibir más información.`);
}

export function getCartWhatsAppUrl(items: CartItem[]) {
  return getWhatsAppUrl(buildCartWhatsAppMessage(items));
}
