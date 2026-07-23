import type { Metadata } from "next";
import { FlaskConical } from "lucide-react";

import { CatalogExplorer } from "@/components/catalog-explorer";
import { Badge } from "@/components/ui/badge";
import { getCategories, getProducts } from "@/lib/products";

export const metadata: Metadata = {
  title: "Catálogo de productos",
  description:
    "Consulta precios, presentaciones, usos y características de materias primas y productos químicos SupraQuím.",
  alternates: { canonical: "/catalogo" },
  openGraph: {
    title: "Catálogo de productos SupraQuím",
    description: "Busca, filtra y consulta productos químicos y materias primas.",
    url: "/catalogo",
  },
};

interface CatalogPageProps {
  searchParams: Promise<{ categoria?: string; q?: string }>;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const products = await getProducts();
  const categories = getCategories(products);
  const { categoria, q } = await searchParams;
  const initialCategory = categoria && categories.includes(categoria)
    ? categoria
    : "Todos";
  const initialQuery = q?.trim() ?? "";

  return (
    <>
      <section className="brand-grid border-b border-border bg-white py-14 sm:py-18">
        <div className="shell">
          <Badge variant="accent"><FlaskConical className="size-3.5" /> Catálogo digital</Badge>
          <h1 className="mt-5 max-w-3xl text-balance text-4xl font-black tracking-[-.05em] text-foreground sm:text-6xl">
            Encuentra el producto que tu fórmula necesita
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
            Busca por nombre, uso o categoría. Consulta presentaciones y precios sin salir del catálogo.
          </p>
        </div>
      </section>
      <section className="py-10 sm:py-14">
        <div className="shell">
          <CatalogExplorer
            key={`${initialCategory}:${initialQuery}`}
            products={products}
            categories={categories}
            initialCategory={initialCategory}
            initialQuery={initialQuery}
          />
        </div>
      </section>
    </>
  );
}
