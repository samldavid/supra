import { MessageCircle } from "lucide-react";

import { getWhatsAppUrl } from "@/lib/whatsapp";

export function FloatingWhatsApp() {
  return (
    <a
      href={getWhatsAppUrl()}
      target="_blank"
      rel="noreferrer"
      aria-label="Contactar a SupraQuím por WhatsApp"
      className="fixed right-4 bottom-4 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_10px_30px_rgba(37,211,102,.35)] transition hover:-translate-y-1 hover:scale-105 focus-visible:ring-4 focus-visible:ring-[#25D366]/30 sm:right-6 sm:bottom-6"
    >
      <MessageCircle className="size-7" />
    </a>
  );
}
