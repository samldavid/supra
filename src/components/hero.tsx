"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, CheckCircle2, MessageCircle, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getWhatsAppUrl } from "@/lib/whatsapp";

const trustPoints = ["Precios claros", "Atención cercana", "Presentaciones prácticas"] as const;

interface HeroProps {
  productCount: number;
}

export function Hero({ productCount }: HeroProps) {
  const shouldReduceMotion = useReducedMotion();
  const lift = shouldReduceMotion ? 0 : 18;

  return (
    <section className="brand-grid relative overflow-hidden border-b border-border bg-white">
      <div className="absolute -top-24 -left-32 size-96 rounded-full bg-primary/8 blur-3xl" />
      <div className="absolute right-0 bottom-0 h-1.5 w-1/3 bg-accent" />
      <div className="shell grid min-h-[calc(100svh-4.5rem)] items-center gap-12 py-16 lg:grid-cols-[1.02fr_.98fr] lg:py-20">
        <motion.div
          initial={{ opacity: 0, y: lift }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: "easeOut" }}
          className="relative z-10"
        >
          <Badge variant="accent" className="px-4 py-2">
            <Sparkles className="size-3.5" /> Soluciones para formular, limpiar y crear
          </Badge>
          <h1 className="mt-6 max-w-3xl text-balance text-5xl leading-[.96] font-black tracking-[-0.055em] text-foreground sm:text-6xl lg:text-7xl">
            La fórmula <span className="text-primary">exacta</span>
          </h1>
          <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground sm:text-xl">
            Productos químicos, envases y soluciones profesionales para hogar, negocio e industria.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/catalogo">
                Ver catálogo <ArrowRight />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href={getWhatsAppUrl()} target="_blank" rel="noreferrer">
                <MessageCircle /> Contactar
              </a>
            </Button>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm font-semibold text-muted-foreground">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-primary" /> {point}
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.12, duration: 0.6, ease: "easeOut" }}
          className="relative mx-auto w-full max-w-[38rem]"
        >
          <div className="absolute inset-[12%] rounded-full bg-primary/10 blur-3xl" />
          <div className="relative aspect-square">
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-[2%] right-[2%] z-10 w-[72%] overflow-hidden rounded-[1.75rem] border border-border bg-white p-2 shadow-[0_24px_70px_rgba(71,15,81,.16)]"
            >
              <Image
                src="/productos/texapon-70-1000g.png"
                alt="Ficha de Texapon 70 SupraQuím"
                width={1448}
                height={1086}
                className="h-auto w-full rounded-[1.25rem]"
                priority
              />
            </motion.div>
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, 8, 0] }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-[5%] left-0 z-20 w-[57%] overflow-hidden rounded-[1.5rem] border border-border bg-white p-2 shadow-[0_20px_55px_rgba(71,15,81,.18)]"
            >
              <Image
                src="/productos/base-para-crema-500g.png"
                alt="Ficha de base para crema SupraQuím"
                width={1448}
                height={1086}
                className="h-auto w-full rounded-[1rem]"
                priority
              />
            </motion.div>
            <div className="absolute right-[1%] bottom-[2%] z-30 rounded-2xl bg-[#2b0633] px-5 py-4 text-white shadow-xl">
              <p className="text-2xl font-black text-accent">{productCount}</p>
              <p className="text-xs font-semibold text-white/65">presentaciones</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
