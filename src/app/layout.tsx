import type { Metadata, Viewport } from "next";

import { FloatingWhatsApp } from "@/components/floating-whatsapp";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "SupraQuím | Químicos, materias primas y soluciones",
    template: "%s | SupraQuím",
  },
  description:
    "Catálogo digital de SupraQuím: materias primas, químicos, productos de limpieza e insumos para hogar, negocio e industria.",
  keywords: [
    "productos químicos Colombia",
    "materias primas",
    "productos de limpieza",
    "insumos químicos",
    "SupraQuím",
  ],
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "SupraQuím",
    title: "SupraQuím — La química de la limpieza inteligente",
    description:
      "Productos químicos, materias primas y soluciones profesionales para hogar, negocio e industria.",
    images: [{ url: "/marca/logo-completo.png", width: 1200, height: 1044 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SupraQuím",
    description: "La química de la limpieza inteligente.",
    images: ["/marca/logo-completo.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/marca/isotipo.png",
    apple: "/marca/isotipo.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#870087",
  colorScheme: "light",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="antialiased">
        <div className="page-background" aria-hidden="true" />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
        <FloatingWhatsApp />
      </body>
    </html>
  );
}
