const WHATSAPP_NUMBER = "573226450404";

export function getWhatsAppUrl(productName?: string) {
  const message = productName
    ? `Hola, estoy interesado en ${productName} de SupraQuím y quisiera recibir más información.`
    : "Hola, quiero conocer más sobre los productos de SupraQuím y solicitar una cotización.";

  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
