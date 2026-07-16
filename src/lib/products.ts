import fallbackProductsData from "@/data/generated-products.json";
import { hasSupabasePublicEnv, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";
import { mapProductRow, type Product, type ProductDbRow } from "@/lib/product-types";

export type { Product, ProductDbRow } from "@/lib/product-types";

const preferredCategories = [
  "Materias primas",
  "Productos de limpieza",
  "Envases",
  "Fragancias",
  "Insumos industriales",
  "Químicos especializados",
] as const;

export const fallbackProducts = fallbackProductsData as unknown as Product[];

interface GetProductsOptions {
  includeInactive?: boolean;
  cache?: RequestCache;
  revalidate?: number;
}

function sortProducts(products: Product[]) {
  return [...products].sort((a, b) => {
    const orderA = a.orden ?? Number.POSITIVE_INFINITY;
    const orderB = b.orden ?? Number.POSITIVE_INFINITY;
    return orderA - orderB || a.nombre.localeCompare(b.nombre, "es") || a.presentacion.localeCompare(b.presentacion, "es");
  });
}

export async function getProducts(options: GetProductsOptions = {}) {
  const { includeInactive = false, cache, revalidate = 60 } = options;

  if (!hasSupabasePublicEnv()) {
    const localProducts = includeInactive ? fallbackProducts : fallbackProducts.filter((product) => product.activo !== false);
    return sortProducts(localProducts);
  }

  const params = new URLSearchParams({
    select: "*",
    order: "orden.asc.nullslast,nombre.asc,presentacion.asc",
  });

  if (!includeInactive) {
    params.set("activo", "eq.true");
  }

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/products?${params.toString()}`, {
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
      cache,
      next: cache ? undefined : { revalidate },
    });

    if (!response.ok) {
      throw new Error(`Supabase respondió ${response.status}`);
    }

    const rows = (await response.json()) as ProductDbRow[];
    return rows.map(mapProductRow);
  } catch (error) {
    console.warn("[productos] No fue posible consultar Supabase; usando fallback local.", error);
    const localProducts = includeInactive ? fallbackProducts : fallbackProducts.filter((product) => product.activo !== false);
    return sortProducts(localProducts);
  }
}

export function getCategories(products: Product[]) {
  return [
    ...preferredCategories,
    ...Array.from(new Set(products.map((product) => product.categoria))).filter(
      (category) => !preferredCategories.includes(category as (typeof preferredCategories)[number]),
    ),
  ];
}

export function getProductBySlug(products: Product[], slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(products: Product[], product: Product, limit = 3) {
  const sameCategory = products.filter(
    (item) => item.slug !== product.slug && item.categoria === product.categoria,
  );
  const others = products.filter(
    (item) => item.slug !== product.slug && item.categoria !== product.categoria,
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export function getCategoryCount(products: Product[], category: string) {
  return products.filter((product) => product.categoria === category).length;
}
