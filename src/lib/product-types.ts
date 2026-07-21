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
  advertenciaQuimica?: string;
  imagen: string;
  destacado?: boolean;
  activo?: boolean;
  stock?: number | null;
  orden?: number | null;
  informacionPendiente?: boolean;
  extraccionIncompleta?: boolean;
  textoVisual?: string;
  sourceFile?: string;
  sourceHash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductDbRow {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  precio: number | null;
  presentacion: string;
  descripcion: string | null;
  usos: string[] | null;
  caracteristicas: string[] | null;
  especificaciones: Record<string, string> | null;
  imagen: string;
  destacado: boolean | null;
  activo: boolean | null;
  stock: number | null;
  orden: number | null;
  informacion_pendiente: boolean | null;
  extraccion_incompleta: boolean | null;
  texto_visual: string | null;
  source_file: string | null;
  source_hash: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export function mapProductRow(row: ProductDbRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    nombre: row.nombre,
    categoria: row.categoria,
    precio: row.precio,
    presentacion: row.presentacion,
    descripcion: row.descripcion ?? "",
    usos: row.usos ?? [],
    caracteristicas: row.caracteristicas ?? [],
    especificaciones: row.especificaciones ?? {},
    imagen: row.imagen,
    destacado: Boolean(row.destacado),
    activo: row.activo ?? true,
    stock: row.stock,
    orden: row.orden,
    informacionPendiente: Boolean(row.informacion_pendiente),
    extraccionIncompleta: Boolean(row.extraccion_incompleta),
    textoVisual: row.texto_visual ?? undefined,
    sourceFile: row.source_file ?? undefined,
    sourceHash: row.source_hash ?? undefined,
    createdAt: row.created_at ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

export function mapProductToDb(product: Product): ProductDbRow {
  return {
    id: product.id,
    slug: product.slug,
    nombre: product.nombre,
    categoria: product.categoria,
    precio: product.precio,
    presentacion: product.presentacion,
    descripcion: product.descripcion,
    usos: product.usos,
    caracteristicas: product.caracteristicas,
    especificaciones: product.especificaciones,
    imagen: product.imagen,
    destacado: Boolean(product.destacado),
    activo: product.activo ?? true,
    stock: product.stock ?? null,
    orden: product.orden ?? null,
    informacion_pendiente: Boolean(product.informacionPendiente),
    extraccion_incompleta: Boolean(product.extraccionIncompleta),
    texto_visual: product.textoVisual ?? null,
    source_file: product.sourceFile ?? null,
    source_hash: product.sourceHash ?? null,
    created_at: product.createdAt ?? null,
    updated_at: product.updatedAt ?? null,
  };
}
