import Image from "next/image";
import Link from "next/link";
import { MessageCircle } from "lucide-react";

import { getWhatsAppUrl } from "@/lib/whatsapp";

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#2b0633] text-white">
      <div className="shell grid gap-10 py-12 md:grid-cols-[1.3fr_1fr_1fr]">
        <div>
          <Image
            src="/marca/logo-horizontal.png"
            alt="SupraQuím"
            width={2021}
            height={603}
            className="h-12 w-auto brightness-0 invert"
          />
          <p className="mt-5 max-w-sm text-sm leading-6 text-white/65">
            Materias primas, químicos y soluciones para hacer crecer tus fórmulas, tu negocio y tus ideas.
          </p>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ffcc00]">Explora</p>
          <div className="mt-5 flex flex-col gap-3 text-sm text-white/70">
            <Link href="/catalogo" className="transition hover:text-white">Catálogo</Link>
            <Link href="/#categorias" className="transition hover:text-white">Categorías</Link>
            <Link href="/#nosotros" className="transition hover:text-white">Sobre SupraQuím</Link>
          </div>
        </div>
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-[#ffcc00]">Hablemos</p>
          <a
            href={getWhatsAppUrl()}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-white transition hover:text-[#ffcc00]"
          >
            <MessageCircle className="size-5" /> +57 322 645 0404
          </a>
          <p className="mt-3 text-sm text-white/55">Atención en Colombia</p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="shell flex flex-col gap-2 py-5 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SupraQuím. Todos los derechos reservados.</p>
          <p>Surcolombiana de Envases y Químicos</p>
        </div>
      </div>
    </footer>
  );
}
