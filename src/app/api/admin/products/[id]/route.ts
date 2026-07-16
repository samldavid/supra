import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { normalizeProductInput } from "@/lib/product-schema";
import { mapProductRow, type ProductDbRow } from "@/lib/product-types";
import { productImagesBucket } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

function storagePathFromPublicUrl(image: string) {
  const marker = `/storage/v1/object/public/${productImagesBucket}/`;
  const index = image.indexOf(marker);
  return index >= 0 ? image.slice(index + marker.length) : null;
}

export async function PATCH(request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;

  try {
    const input = normalizeProductInput({ ...(await request.json()), id });
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .update({
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
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ product: mapProductRow(data as ProductDbRow) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Datos inválidos." },
      { status: 400 },
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const { id } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: existing } = await supabase.from("products").select("imagen").eq("id", id).maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const storagePath = existing?.imagen ? storagePathFromPublicUrl(String(existing.imagen)) : null;
  if (storagePath) {
    await supabase.storage.from(productImagesBucket).remove([storagePath]);
  }

  return NextResponse.json({ ok: true });
}
