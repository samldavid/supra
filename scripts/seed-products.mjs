import { existsSync, readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productsPath = path.join(projectRoot, "src", "data", "generated-products.json");

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  const content = readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const match = line.match(/^\s*([^#=]+)=(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const value = match[2];
    process.env[key] ??= value;
  }
}

loadEnvFile(path.join(projectRoot, ".env.local"));
loadEnvFile(path.join(projectRoot, ".env"));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("[seed] Faltan NEXT_PUBLIC_SUPABASE_URL/SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function toDbProduct(product, index) {
  return {
    id: product.id,
    slug: product.slug,
    nombre: product.nombre,
    categoria: product.categoria,
    precio: product.precio,
    presentacion: product.presentacion,
    descripcion: product.descripcion ?? "",
    usos: product.usos ?? [],
    caracteristicas: product.caracteristicas ?? [],
    especificaciones: product.especificaciones ?? {},
    imagen: product.imagen,
    destacado: Boolean(product.destacado),
    activo: product.activo ?? true,
    stock: product.stock ?? null,
    orden: product.orden ?? index + 1,
    informacion_pendiente: Boolean(product.informacionPendiente),
    extraccion_incompleta: Boolean(product.extraccionIncompleta),
    texto_visual: product.textoVisual ?? null,
    source_file: product.sourceFile ?? null,
    source_hash: product.sourceHash ?? null,
  };
}

const products = JSON.parse(await readFile(productsPath, "utf8")).map(toDbProduct);
const { error } = await supabase.from("products").upsert(products, { onConflict: "id" });

if (error) {
  console.error("[seed] No fue posible insertar productos.");
  console.error(error);
  process.exit(1);
}

console.log(`[seed] ${products.length} productos insertados/actualizados en Supabase.`);
