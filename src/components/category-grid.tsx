"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Boxes,
  Factory,
  FlaskConical,
  Flower2,
  Microscope,
  SprayCan,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

interface CategoryItem {
  name: string;
  description: string;
  icon: LucideIcon;
  count: number;
}

interface CategoryGridProps {
  counts: Record<string, number>;
}

export function CategoryGrid({ counts }: CategoryGridProps) {
  const defaultItems: CategoryItem[] = [
    { name: "Materias primas", description: "La base de cada gran fórmula.", icon: FlaskConical, count: counts["Materias primas"] ?? 0 },
    { name: "Productos de limpieza", description: "Desempeño para cada superficie.", icon: SprayCan, count: counts["Productos de limpieza"] ?? 0 },
    { name: "Envases", description: "Presenta y protege tu producto.", icon: Boxes, count: counts.Envases ?? 0 },
    { name: "Fragancias", description: "Identidad sensorial para tu fórmula.", icon: Flower2, count: counts.Fragancias ?? 0 },
    { name: "Insumos industriales", description: "Soluciones para procesos exigentes.", icon: Factory, count: counts["Insumos industriales"] ?? 0 },
    { name: "Químicos especializados", description: "Precisión para resultados superiores.", icon: Microscope, count: counts["Químicos especializados"] ?? 0 },
  ];
  const knownNames = new Set(defaultItems.map((category) => category.name));
  const categoryItems: CategoryItem[] = [
    ...defaultItems,
    ...Object.entries(counts)
      .filter(([name, count]) => count > 0 && !knownNames.has(name))
      .map(([name, count]) => ({
        name,
        description: name === "Información pendiente"
          ? "Tarjetas nuevas pendientes de clasificación editorial."
          : "Explora los productos de esta categoría.",
        icon: FlaskConical,
        count,
      })),
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {categoryItems.map((category, index) => {
        const Icon = category.icon;
        return (
          <motion.div
            key={category.name}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: index * 0.045, duration: 0.4 }}
            whileHover={{ y: -5 }}
          >
            <Link href={`/catalogo?categoria=${encodeURIComponent(category.name)}`} className="group block h-full">
              <Card className="h-full overflow-hidden transition group-hover:border-primary/25 group-hover:shadow-[0_18px_45px_rgba(81,0,93,.1)]">
                <CardContent className="relative p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-13 items-center justify-center rounded-2xl bg-primary/8 text-primary transition group-hover:bg-primary group-hover:text-white">
                      <Icon className="size-6" />
                    </div>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                      {category.count ? `${category.count} productos` : "Próximamente"}
                    </span>
                  </div>
                  <h3 className="mt-6 text-xl font-black tracking-tight text-foreground">{category.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{category.description}</p>
                  <div className="absolute right-0 bottom-0 h-1 w-16 bg-accent transition-all group-hover:w-full" />
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
