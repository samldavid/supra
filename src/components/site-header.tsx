"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, MessageCircle, Search, X } from "lucide-react";

import { CartButton } from "@/components/cart/cart-button";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const navItems = [
  { href: "/", label: "Inicio" },
  { href: "/#categorias", label: "Categorías" },
  { href: "/catalogo", label: "Catálogo" },
  { href: "/#nosotros", label: "Nosotros" },
] as const;

interface HeaderSearchProps {
  className?: string;
  onSearch?: () => void;
}

function HeaderSearch({ className, onSearch }: HeaderSearchProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const query = searchTerm.trim();
    const nextUrl = query ? `/catalogo?q=${encodeURIComponent(query)}` : "/catalogo";
    router.push(nextUrl);
    onSearch?.();
  }

  return (
    <form action="/catalogo" method="get" onSubmit={handleSubmit} className={cn("relative", className)}>
      <label className="relative block">
        <span className="sr-only">Buscar productos en el catálogo</span>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-primary" />
        <Input
          name="q"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Buscar producto"
          autoComplete="off"
          className="h-10 rounded-full bg-white/85 pr-12 pl-10 text-xs font-semibold shadow-sm"
        />
        <button
          type="submit"
          className="absolute top-1/2 right-1.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white transition hover:bg-primary/90 focus-visible:ring-4 focus-visible:ring-ring/20 focus-visible:outline-none"
          aria-label="Buscar en el catálogo"
        >
          <Search className="size-3.5" />
        </button>
      </label>
    </form>
  );
}

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

        <HeaderSearch className="hidden min-w-[13rem] max-w-xs flex-1 lg:block xl:max-w-sm" />

        <div className="hidden items-center gap-3 lg:flex">
          <CartButton />
          <Button asChild variant="accent">
            <a href={getWhatsAppUrl()} target="_blank" rel="noreferrer">
              <MessageCircle /> Contactar
            </a>
          </Button>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <CartButton compact />
          <Button
            variant="outline"
            size="icon"
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
            onClick={() => setIsOpen((value) => !value)}
          >
            {isOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>

      {isOpen ? (
        <nav className="border-t border-border bg-background p-4 lg:hidden" aria-label="Navegación móvil">
          <div className="shell flex flex-col gap-2">
            <HeaderSearch className="mb-2" onSearch={() => setIsOpen(false)} />
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
