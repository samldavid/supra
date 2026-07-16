import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Gauge, Handshake, MessageCircle, ShieldCheck } from "lucide-react";

import { CategoryGrid } from "@/components/category-grid";
import { Hero } from "@/components/hero";
import { ProductCard } from "@/components/product-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCategories, getCategoryCount, getProducts } from "@/lib/products";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const values = [
  {
    icon: ShieldCheck,
    title: "Selección confiable",
    description: "Información clara y presentaciones pensadas para comprar con seguridad.",
  },
  {
    icon: Gauge,
    title: "Consulta ágil",
    description: "Encuentra por nombre, uso o categoría sin perder tiempo entre listas eternas.",
  },
  {
    icon: Handshake,
    title: "Asesoría cercana",
    description: "Resolvemos dudas y cotizamos contigo directamente por WhatsApp.",
  },
] as const;

export default async function HomePage() {
  const products = await getProducts();
  const categories = getCategories(products);
  const featuredProducts = products.filter((product) => product.destacado).slice(0, 4);
  const categoryCounts = Object.fromEntries(
    categories.map((category) => [category, getCategoryCount(products, category)]),
  );
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SupraQuím",
    alternateName: "Surcolombiana de Envases y Químicos",
    logo: "/marca/logo-completo.png",
    telephone: "+57 322 645 0404",
    areaServed: "Colombia",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <Hero productCount={products.length} />

      <section id="categorias" className="scroll-mt-24 py-20 sm:py-24">
        <div className="shell">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              eyebrow="Explora por categoría"
              title="Todo lo que necesitas, mejor organizado"
              description="Navega por familias de producto y llega más rápido a la solución adecuada para tu proceso."
            />
            <Button asChild variant="outline" className="w-fit">
              <Link href="/catalogo">Ver catálogo completo <ArrowRight /></Link>
            </Button>
          </div>
          <div className="mt-10">
            <CategoryGrid counts={categoryCounts} />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-white py-20 sm:py-24">
        <div className="shell">
          <SectionHeading
            eyebrow="Selección SupraQuím"
            title="Productos para poner tus ideas en marcha"
            description="Una muestra de nuestras materias primas más consultadas, con información y precio visibles."
          />
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.id} product={product} priority={index < 2} />
            ))}
          </div>
          <div className="mt-9 flex justify-center">
            <Button asChild size="lg">
              <Link href="/catalogo">Explorar los {products.length} productos <ArrowRight /></Link>
            </Button>
          </div>
        </div>
      </section>

      <section id="nosotros" className="scroll-mt-24 py-20 sm:py-24">
        <div className="shell grid items-center gap-12 lg:grid-cols-[.9fr_1.1fr]">
          <div className="relative mx-auto flex aspect-square w-full max-w-[29rem] items-center justify-center overflow-hidden rounded-[2rem] bg-[#2b0633]">
            <div className="absolute inset-0 brand-grid opacity-25" />
            <div className="absolute top-0 right-0 h-2 w-1/2 bg-accent" />
            <Image
              src="/marca/isotipo.png"
              alt="Isotipo oficial de SupraQuím"
              width={921}
              height={1139}
              className="relative z-10 h-[68%] w-auto object-contain drop-shadow-2xl"
            />
          </div>
          <div>
            <SectionHeading
              eyebrow="Química cercana"
              title="Claridad técnica sin complicarte la compra"
              description="SupraQuím conecta materias primas, productos e insumos con personas y negocios que quieren formular, producir y crecer con confianza."
            />
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {values.map((value) => {
                const Icon = value.icon;
                return (
                  <Card key={value.title} className="shadow-none">
                    <CardContent className="p-5">
                      <Icon className="size-6 text-primary" />
                      <h3 className="mt-4 font-black">{value.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{value.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            <ul className="mt-7 grid gap-3 text-sm font-semibold text-foreground sm:grid-cols-2">
              {[
                "Información fácil de consultar",
                "Precios de referencia visibles",
                "Presentaciones para cada necesidad",
                "Atención directa y humana",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-primary" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="pb-20 sm:pb-24">
        <div className="shell overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-white shadow-[0_25px_70px_rgba(80,0,91,.2)] sm:px-10 lg:px-14">
          <div className="grid items-center gap-8 lg:grid-cols-[1fr_auto]">
            <div>
              <p className="text-sm font-black uppercase tracking-[.18em] text-accent">¿No sabes cuál elegir?</p>
              <h2 className="mt-3 max-w-2xl text-balance text-3xl font-black tracking-[-.04em] sm:text-4xl">
                Cuéntanos qué quieres formular y te orientamos.
              </h2>
              <p className="mt-4 max-w-xl text-white/70">Atención directa, sin formularios largos ni vueltas innecesarias.</p>
            </div>
            <Button asChild variant="accent" size="lg">
              <a href={getWhatsAppUrl()} target="_blank" rel="noreferrer">
                <MessageCircle /> Hablar con SupraQuím
              </a>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
