"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight } from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ChemicalHazardPictogram } from "@/components/chemical-hazard-pictogram";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { Product } from "@/lib/products";
import { getChemicalHazards, getChemicalWarning, getUniqueChemicalPictograms } from "@/lib/product-safety";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
  priority?: boolean;
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const chemicalWarning = getChemicalWarning(product);
  const chemicalHazards = getChemicalHazards(product);
  const chemicalPictograms = getUniqueChemicalPictograms(chemicalHazards);

  return (
    <motion.article layout whileHover={{ y: -5 }} transition={{ duration: 0.22 }} className="h-full">
      <Card className="group flex h-full flex-col overflow-hidden transition hover:border-primary/20 hover:shadow-[0_20px_55px_rgba(75,15,85,.12)]">
        <Link href={`/catalogo/${product.slug}`} className="relative block aspect-[4/3] overflow-hidden bg-[#faf8fb]">
          <Image
            src={product.imagen}
            alt={`Ficha de ${product.nombre}, presentación ${product.presentacion}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
            priority={priority}
          />
        </Link>
        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-center justify-between gap-3">
            <Badge className="max-w-[70%] truncate">{product.categoria}</Badge>
            <span className="text-xs font-bold text-muted-foreground">
              {product.presentacion || "Información pendiente"}
            </span>
          </div>
          <h3 className="mt-4 text-xl font-black tracking-tight text-foreground">{product.nombre}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {product.descripcion || "Información pendiente"}
          </p>
          {chemicalWarning || chemicalHazards.length ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-black text-amber-800">
              {chemicalPictograms.length ? (
                chemicalPictograms.slice(0, 4).map((code) => (
                  <ChemicalHazardPictogram key={code} code={code} size="sm" />
                ))
              ) : (
                <AlertTriangle className="size-4" />
              )}
              <span>Uso con precaución</span>
              {chemicalPictograms.length > 4 ? <span>+{chemicalPictograms.length - 4}</span> : null}
            </div>
          ) : null}
          <div className="mt-auto flex flex-col gap-3 pt-5">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[.12em] text-muted-foreground">Precio</p>
              <p className="mt-1 text-lg font-black text-primary">
                {product.precio === null ? "Información pendiente" : formatPrice(product.precio)}
              </p>
            </div>
            <div className="flex gap-2">
              <AddToCartButton product={product} compact size="sm" className="flex-1" />
              <Button asChild variant="outline" size="icon" aria-label={`Ver ${product.nombre}`}>
                <Link href={`/catalogo/${product.slug}`}>
                  <ArrowUpRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </motion.article>
  );
}
