import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { productImagesBucket } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const allowedTypes = new Map([
  ["image/png", "png"],
  ["image/jpeg", "jpg"],
  ["image/webp", "webp"],
]);

const maxFileSize = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Debes subir una imagen." }, { status: 400 });
  }

  const extension = allowedTypes.get(file.type);

  if (!extension) {
    return NextResponse.json({ error: "Solo se permiten imágenes PNG, JPG o WebP." }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "La imagen no puede superar 5 MB." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const safePath = `products/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(productImagesBucket).upload(safePath, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { data } = supabase.storage.from(productImagesBucket).getPublicUrl(safePath);

  return NextResponse.json({ url: data.publicUrl, path: safePath });
}
