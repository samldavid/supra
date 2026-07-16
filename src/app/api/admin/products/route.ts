import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { normalizeProductInput } from "@/lib/product-schema";
import { mapProductRow, type ProductDbRow } from "@/lib/product-types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function toDbPayload(input: ReturnType<typeof normalizeProductInput>): ProductDbRow {
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
    created_at: null,
    updated_at: null,
  };
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

  try {
    const input = normalizeProductInput(await request.json());
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .insert(toDbPayload(input))
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ product: mapProductRow(data as ProductDbRow) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Datos inválidos." },
      { status: 400 },
    );
  }
}
