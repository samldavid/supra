import { z } from "zod";

import { slugify } from "@/lib/slug";

function nullableNumber(value: unknown) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function nullableInteger(value: unknown) {
  const parsed = nullableNumber(value);
  return parsed === null ? null : Math.trunc(parsed);
}

function stringList(value: unknown) {
  if (Array.isArray(value)) return value.map(String).map((item) => item.trim()).filter(Boolean);
  if (typeof value !== "string") return [];
  return value
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function recordFromJson(value: unknown) {
  if (!value) return {};
  if (typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string") return {};
  try {
    const parsed = JSON.parse(value);
    return typeof parsed === "object" && parsed && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export const productInputSchema = z.object({
  id: z.string().trim().min(1, "El ID es obligatorio.").max(80),
  slug: z.string().trim().max(120).optional().default(""),
  nombre: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(160),
  categoria: z.string().trim().min(2, "La categoría es obligatoria.").max(120),
  precio: z.preprocess(nullableInteger, z.number().int().nonnegative().nullable()),
  presentacion: z.string().trim().min(1, "La presentación es obligatoria.").max(80),
  descripcion: z.string().trim().max(800).optional().default(""),
  imagen: z.string().trim().min(1, "La imagen es obligatoria.").max(500),
  activo: z.boolean().optional().default(true),
  destacado: z.boolean().optional().default(false),
  stock: z.preprocess(nullableInteger, z.number().int().nonnegative().nullable()).optional().default(null),
  orden: z.preprocess(nullableInteger, z.number().int().nullable()).optional().default(null),
  usos: z.preprocess(stringList, z.array(z.string().max(120))).optional().default([]),
  caracteristicas: z.preprocess(stringList, z.array(z.string().max(160))).optional().default([]),
  especificaciones: z.preprocess(recordFromJson, z.record(z.string(), z.string())).optional().default({}),
  informacionPendiente: z.boolean().optional().default(false),
});

export type ProductInput = z.infer<typeof productInputSchema>;

export function normalizeProductInput(input: unknown): ProductInput {
  const parsed = productInputSchema.parse(input);
  const slug = parsed.slug || slugify(`${parsed.nombre} ${parsed.presentacion}`);

  return {
    ...parsed,
    slug,
  };
}
