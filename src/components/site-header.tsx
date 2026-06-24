"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#nosotros", label: "Nosotros" },
] as const;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl">
      <div className="shell flex h-18 items-center justify-between gap-5">
        <Link href="/" aria-label="SupraQuím, ir al inicio" className="shrink-0">
          <Image
            src="/marca/logo-horizontal.png"
            alt="SupraQuím — Surcolombiana de Envases y Químicos"
            width={2021}
            height={603}
            className="h-10 w-auto sm:h-11"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegación principal">
          {navItems.map((item) => (
            <Button key={item.href} asChild variant="ghost" size="sm">
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </nav>

        <div className="hidden lg:block">
          <Button asChild variant="accent">
            <a href={getWhatsAppUrl()} target="_blank" rel="noreferrer">
              <MessageCircle /> Contactar
            </a>
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          className="lg:hidden"
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
        >
          {isOpen ? <X /> : <Menu />}
        </Button>
      </div>

      {isOpen ? (
        <nav className="border-t border-border bg-background p-4 lg:hidden" aria-label="Navegación móvil">
          <div className="shell flex flex-col gap-2">
            {navItems.map((item) => (
              <Button key={item.href} asChild variant="ghost" className="justify-start">
                <Link href={item.href} onClick={() => setIsOpen(false)}>
                  {item.label}
                </Link>
              </Button>
            ))}
            <Button asChild variant="accent" className="mt-2">
              <a href={getWhatsAppUrl()} target="_blank" rel="noreferrer">
                <MessageCircle /> Contactar por WhatsApp
              </a>
            </Button>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
