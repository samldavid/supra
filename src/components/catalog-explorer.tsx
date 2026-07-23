"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Search, SlidersHorizontal, X } from "lucide-react";

import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getChemicalHazards } from "@/lib/product-safety";
import type { Product } from "@/lib/products";

interface CatalogExplorerProps {
  products: Product[];
  categories: string[];
  initialCategory?: string;
  initialQuery?: string;
}

type SortOption = "featured" | "price-asc" | "price-desc" | "name";

export function CatalogExplorer({
  products,
  categories,
  initialCategory = "Todos",
  initialQuery = "",
}: CatalogExplorerProps) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [sort, setSort] = useState<SortOption>("featured");
  const deferredQuery = useDeferredValue(query.trim().toLocaleLowerCase("es"));

  const filteredProducts = useMemo(() => {
    const result = products.filter((product) => {
      const searchable = [
        product.nombre,
        product.categoria,
        product.descripcion,
        product.presentacion,
        ...product.usos,
        ...product.caracteristicas,
        ...Object.values(product.especificaciones ?? {}),
        ...getChemicalHazards(product).map((hazard) => `${hazard.label} ${hazard.pictogramName}`),
      ]
        .join(" ")
        .toLocaleLowerCase("es");
      const matchesQuery = !deferredQuery || searchable.includes(deferredQuery);
      const matchesCategory = category === "Todos" || product.categoria === category;
      return matchesQuery && matchesCategory;
    });

    return [...result].sort((a, b) => {
      if (sort === "price-asc") return (a.precio ?? Number.POSITIVE_INFINITY) - (b.precio ?? Number.POSITIVE_INFINITY);
      if (sort === "price-desc") return (b.precio ?? Number.NEGATIVE_INFINITY) - (a.precio ?? Number.NEGATIVE_INFINITY);
      if (sort === "name") return a.nombre.localeCompare(b.nombre, "es");
      return Number(Boolean(b.destacado)) - Number(Boolean(a.destacado));
    });
  }, [category, deferredQuery, products, sort]);

  function clearFilters() {
    setQuery("");
    setCategory("Todos");
    setSort("featured");
  }

  return (
    <div>
      <div className="rounded-[1.5rem] border border-border bg-white p-4 shadow-[0_12px_40px_rgba(41,22,51,.06)] sm:p-5">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Buscar productos</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Busca por nombre, uso, categoría…"
              className="h-13 pl-12 pr-11"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute top-1/2 right-3 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Limpiar búsqueda"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <label className="relative flex items-center gap-2 rounded-xl border border-input bg-background px-4">
            <SlidersHorizontal className="size-4 text-primary" />
            <span className="sr-only">Ordenar catálogo</span>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOption)}
              className="h-13 min-w-40 bg-transparent text-sm font-bold outline-none"
            >
              <option value="featured">Destacados</option>
              <option value="price-asc">Menor precio</option>
              <option value="price-desc">Mayor precio</option>
              <option value="name">Nombre A–Z</option>
            </select>
          </label>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Filtrar por categoría">
          {["Todos", ...categories].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              aria-pressed={category === item}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                category === item
                  ? "bg-primary text-white shadow-md"
                  : "border border-border bg-background text-muted-foreground hover:border-primary/25 hover:text-primary"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-7 flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted-foreground">
          <span className="font-black text-foreground">{filteredProducts.length}</span>{" "}
          {filteredProducts.length === 1 ? "producto encontrado" : "productos encontrados"}
        </p>
        {(query || category !== "Todos" || sort !== "featured") && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X /> Limpiar filtros
          </Button>
        )}
      </div>

      {filteredProducts.length ? (
        <motion.div layout className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                layout
                key={product.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.2 }}
              >
                <ProductCard product={product} priority={index < 3} />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <div className="mt-5 rounded-[1.5rem] border border-dashed border-primary/25 bg-primary/4 px-6 py-16 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Search className="size-6" />
          </div>
          <h2 className="mt-5 text-xl font-black">No encontramos una coincidencia</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            Prueba con otro nombre, uso o categoría. También puedes escribirnos y te ayudamos a encontrarlo.
          </p>
          <Button className="mt-5" variant="outline" onClick={clearFilters}>Ver todo el catálogo</Button>
        </div>
      )}
    </div>
  );
}
