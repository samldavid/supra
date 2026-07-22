import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  MessageCircle,
  PackageCheck,
  ReceiptText,
  Tag,
} from "lucide-react";

import { AddToCartButton } from "@/components/cart/add-to-cart-button";
import { ChemicalHazardPictogram } from "@/components/chemical-hazard-pictogram";
import { ProductCard } from "@/components/product-card";
import { ProductImageZoom } from "@/components/product-image-zoom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  chemicalHazardGroups,
  getChemicalHazards,
  getChemicalWarning,
  getUniqueChemicalPictograms,
  visibleSpecifications,
} from "@/lib/product-safety";
import { getProductBySlug, getProducts, getRelatedProducts } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { getProductWhatsAppUrl } from "@/lib/whatsapp";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const products = await getProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const products = await getProducts();
  const product = getProductBySlug(products, slug);
  if (!product) return {};

  return {
    title: `${product.nombre} ${product.presentacion}`,
    description: `${product.descripcion || "Información pendiente."} Consulta precio, usos y características en SupraQuím.`,
    alternates: { canonical: `/catalogo/${product.slug}` },
    openGraph: {
      type: "website",
      title: `${product.nombre} — ${product.presentacion}`,
      description: product.descripcion || "Información pendiente",
      url: `/catalogo/${product.slug}`,
      images: [{ url: product.imagen }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const products = await getProducts();
  const product = getProductBySlug(products, slug);
  if (!product) notFound();

  const related = getRelatedProducts(products, product);
  const whatsappUrl = getProductWhatsAppUrl(`${product.nombre} (${product.presentacion})`);
  const chemicalWarning = getChemicalWarning(product);
  const chemicalHazards = getChemicalHazards(product);
  const chemicalPictograms = getUniqueChemicalPictograms(chemicalHazards);
  const chemicalHazardGroupsToShow = chemicalHazardGroups
    .map((group) => ({
      group,
      hazards: chemicalHazards.filter((hazard) => hazard.group === group),
    }))
    .filter((item) => item.hazards.length);
  const specificationEntries = visibleSpecifications(product);
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${product.nombre} ${product.presentacion}`,
    image: product.imagen,
    description: product.descripcion || "Información pendiente",
    sku: product.id,
    brand: { "@type": "Brand", name: "SupraQuím" },
    ...(product.precio === null ? {} : { offers: {
      "@type": "Offer",
      priceCurrency: "COP",
      price: product.precio,
      availability: "https://schema.org/InStock",
      url: `/catalogo/${product.slug}`,
    } }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <div className="shell py-7 sm:py-10">
        <nav aria-label="Migas de pan" className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          <Link href="/" className="hover:text-primary">Inicio</Link>
          <ChevronRight className="size-3.5" />
          <Link href="/catalogo" className="hover:text-primary">Catálogo</Link>
          <ChevronRight className="size-3.5" />
          <span className="text-foreground">{product.nombre}</span>
        </nav>

        <div className="mt-7 grid items-start gap-9 lg:grid-cols-[1.08fr_.92fr] lg:gap-12">
          <ProductImageZoom
            src={product.imagen}
            alt={`Ficha gráfica de ${product.nombre}, ${product.presentacion}`}
          />
          <div className="lg:sticky lg:top-28">
            <Badge>{product.categoria}</Badge>
            <h1 className="mt-5 text-balance text-4xl font-black tracking-[-.05em] sm:text-5xl">{product.nombre}</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              {product.descripcion || "Información pendiente"}
            </p>

            {product.informacionPendiente ? (
              <div className="mt-5 rounded-2xl border border-accent/60 bg-accent/10 px-4 py-3 text-sm font-semibold text-foreground">
                Información pendiente de validación editorial. Los datos mostrados fueron extraídos de la tarjeta publicada.
              </div>
            ) : null}

            {chemicalWarning || chemicalHazards.length ? (
              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-[0_12px_35px_rgba(217,119,6,.08)]">
                <p className="flex items-center gap-2 font-black">
                  <AlertTriangle className="size-5 shrink-0" /> Riesgo químico / SGA
                </p>
                {chemicalPictograms.length ? (
                  <div className="mt-4 flex flex-wrap gap-3">
                    {chemicalPictograms.map((code) => (
                      <ChemicalHazardPictogram key={code} code={code} size="lg" />
                    ))}
                  </div>
                ) : null}
                {chemicalWarning ? <p className="mt-3 leading-6 font-semibold">{chemicalWarning}</p> : null}
                {chemicalHazardGroupsToShow.length ? (
                  <div className="mt-4 grid gap-3">
                    {chemicalHazardGroupsToShow.map(({ group, hazards }) => (
                      <div key={group} className="rounded-xl border border-amber-200 bg-white/75 p-3">
                        <p className="text-xs font-black uppercase tracking-[.12em] text-amber-800">{group}</p>
                        <ul className="mt-2 grid gap-2">
                          {hazards.map((hazard) => (
                            <li key={hazard.id} className="flex items-start gap-3 text-sm leading-6">
                              <ChemicalHazardPictogram code={hazard.pictogram} label={hazard.label} size="sm" />
                              <span>
                                <span className="font-black">{hazard.label}</span>
                                <span className="block text-amber-900/80">{hazard.description}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : null}

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
                  <PackageCheck className="size-4 text-primary" /> Presentación
                </p>
                <p className="mt-2 text-lg font-black">{product.presentacion || "Información pendiente"}</p>
              </div>
              <div className="rounded-2xl bg-primary/7 p-4">
                <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-muted-foreground">
                  <Tag className="size-4 text-primary" /> Precio de referencia
                </p>
                <p className="mt-2 text-2xl font-black text-primary">
                  {product.precio === null ? "Información pendiente" : formatPrice(product.precio)}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <AddToCartButton product={product} size="lg" className="flex-1" />
              <Button asChild variant="accent" size="lg" className="flex-1">
                <a href={whatsappUrl} target="_blank" rel="noreferrer">
                  <MessageCircle /> Solicitar cotización
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/catalogo"><ArrowLeft /> Volver</Link>
              </Button>
            </div>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              El precio puede cambiar según disponibilidad y cantidad. Confirma tu cotización por WhatsApp.
            </p>
          </div>
        </div>

        <section className="mt-16 grid gap-6 lg:grid-cols-2">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex size-11 items-center justify-center rounded-xl bg-primary/8 text-primary">
                <CheckCircle2 className="size-5" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight">Usos recomendados</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {(product.usos.length ? product.usos : ["Información pendiente"]).map((use) => (
                  <li key={use} className="flex items-start gap-3 rounded-xl bg-muted/70 p-3 text-sm font-semibold">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {use}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="flex size-11 items-center justify-center rounded-xl bg-accent/20 text-[#705400]">
                <ReceiptText className="size-5" />
              </div>
              <h2 className="mt-5 text-2xl font-black tracking-tight">Características</h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {(product.caracteristicas.length ? product.caracteristicas : ["Información pendiente"]).map((feature) => (
                  <li key={feature} className="flex items-start gap-3 rounded-xl bg-muted/70 p-3 text-sm font-semibold">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" /> {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_12px_40px_rgba(41,22,51,.06)]">
          <div className="border-b border-border px-6 py-5 sm:px-8">
            <h2 className="text-2xl font-black tracking-tight">Especificaciones</h2>
            <p className="mt-1 text-sm text-muted-foreground">Información general de la presentación publicada.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-left text-sm">
              <tbody>
                {specificationEntries.map(([label, value], index) => (
                  <tr key={label} className={index % 2 ? "bg-muted/45" : "bg-white"}>
                    <th scope="row" className="w-2/5 px-6 py-4 font-black text-foreground sm:px-8">{label}</th>
                    <td className="px-6 py-4 text-muted-foreground sm:px-8">{value}</td>
                  </tr>
                ))}
                {!specificationEntries.length ? (
                  <tr className="bg-white">
                    <th scope="row" className="w-2/5 px-6 py-4 font-black text-foreground sm:px-8">Información técnica</th>
                    <td className="px-6 py-4 text-muted-foreground sm:px-8">Información pendiente</td>
                  </tr>
                ) : null}
                <tr className={specificationEntries.length % 2 ? "bg-muted/45" : "bg-white"}>
                  <th scope="row" className="px-6 py-4 font-black sm:px-8">Código</th>
                  <td className="px-6 py-4 font-mono text-muted-foreground sm:px-8">{product.id}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16">
          <div className="flex items-end justify-between gap-5">
            <div>
              <p className="text-sm font-black uppercase tracking-[.16em] text-primary">También te puede servir</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em]">Productos relacionados</h2>
            </div>
            <Button asChild variant="outline" className="hidden sm:inline-flex">
              <Link href="/catalogo">Ver todo</Link>
            </Button>
          </div>
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </section>
      </div>
    </>
  );
}
