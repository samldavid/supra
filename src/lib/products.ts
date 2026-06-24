import productsData from "@/data/generated-products.json";

export interface Product {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  precio: number | null;
  presentacion: string;
  descripcion: string;
  usos: string[];
  caracteristicas: string[];
  especificaciones: Record<string, string>;
  imagen: string;
  destacado?: boolean;
  informacionPendiente?: boolean;
  extraccionIncompleta?: boolean;
  textoVisual?: string;
  sourceFile?: string;
  sourceHash?: string;
}

export const products = productsData as unknown as Product[];

const preferredCategories = [
  "Materias primas",
  "Productos de limpieza",
  "Envases",
  "Fragancias",
  "Insumos industriales",
  "Químicos especializados",
] as const;

export const categories = [
  ...preferredCategories,
  ...Array.from(new Set(products.map((product) => product.categoria))).filter(
    (category) => !preferredCategories.includes(category as (typeof preferredCategories)[number]),
  ),
];

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getRelatedProducts(product: Product, limit = 3) {
  const sameCategory = products.filter(
    (item) => item.slug !== product.slug && item.categoria === product.categoria,
  );
  const others = products.filter(
    (item) => item.slug !== product.slug && item.categoria !== product.categoria,
  );

  return [...sameCategory, ...others].slice(0, limit);
}

export function getCategoryCount(category: string) {
  return products.filter((product) => product.categoria === category).length;
}
