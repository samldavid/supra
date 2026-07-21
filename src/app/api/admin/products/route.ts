import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { normalizeProductInput } from "@/lib/product-schema";
import { mapProductRow, type ProductDbRow } from "@/lib/product-types";
import { productImagesBucket } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ProductInsertPayload = Omit<ProductDbRow, "created_at" | "updated_at">;

function toDbPayload(input: ReturnType<typeof normalizeProductInput>): ProductInsertPayload {
  return {
    id: input.id,
    slug: input.slug,
    nombre: input.nombre,
    categoria: input.categoria,
    precio: input.precio,
    presentacion: input.presentacion,
    descripcion: input.descripcion,
    usos: input.usos,
    caracteristicas: input.caracteristicas,
    especificaciones: input.especificaciones,
    imagen: input.imagen,
    destacado: input.destacado,
    activo: input.activo,
    stock: input.stock ?? null,
    orden: input.orden ?? null,
    informacion_pendiente: input.informacionPendiente,
    extraccion_incompleta: false,
    texto_visual: null,
    source_file: null,
    source_hash: null,
  };
}

function isSafeUploadedImagePath(path: unknown): path is string {
  return typeof path === "string" && path.startsWith("products/") && !path.includes("..");
}

async function removeUploadedImageIfNeeded(path: unknown) {
  if (!isSafeUploadedImagePath(path)) return;

  const supabase = await createSupabaseServerClient();
  await supabase.storage.from(productImagesBucket).remove([path]);
}

export async function GET() {
  const { response } = await requireAdminApi();
  if (response) return response;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("orden", { ascending: true, nullsFirst: false })
    .order("nombre", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: ((data ?? []) as ProductDbRow[]).map(mapProductRow) });
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  let rawPayload: Record<string, unknown> | null = null;

  try {
    rawPayload = await request.json();
    const input = normalizeProductInput(rawPayload);
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .insert(toDbPayload(input))
      .select("*")
      .single();

    if (error) {
      await removeUploadedImageIfNeeded(rawPayload?.uploadedImagePath);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ product: mapProductRow(data as ProductDbRow) }, { status: 201 });
  } catch (error) {
    await removeUploadedImageIfNeeded(rawPayload?.uploadedImagePath);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Datos inválidos." },
      { status: 400 },
    );
  }
}
