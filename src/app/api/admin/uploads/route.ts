import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requireAdminApi } from "@/lib/admin-auth";
import { productImagesBucket } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const allowedTypes = new Map([
  ["image/png", { extension: "png", contentType: "image/png" }],
  ["image/jpeg", { extension: "jpg", contentType: "image/jpeg" }],
  ["image/jpg", { extension: "jpg", contentType: "image/jpeg" }],
  ["image/webp", { extension: "webp", contentType: "image/webp" }],
]);

const typeByExtension = new Map([
  ["png", { extension: "png", contentType: "image/png" }],
  ["jpg", { extension: "jpg", contentType: "image/jpeg" }],
  ["webp", { extension: "webp", contentType: "image/webp" }],
]);

const maxFileSize = 5 * 1024 * 1024;

function bytesStartWith(bytes: Uint8Array, signature: number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

async function detectImageExtension(file: File) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());

  if (bytesStartWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return "png";
  }

  if (bytesStartWith(bytes, [0xff, 0xd8, 0xff])) {
    return "jpg";
  }

  const riff = String.fromCharCode(...bytes.slice(0, 4));
  const webp = String.fromCharCode(...bytes.slice(8, 12));

  if (riff === "RIFF" && webp === "WEBP") {
    return "webp";
  }

  return null;
}

export async function POST(request: Request) {
  const { response } = await requireAdminApi();
  if (response) return response;

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Debes subir una imagen." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "La imagen está vacía. Selecciona otro archivo." }, { status: 400 });
  }

  if (file.size > maxFileSize) {
    return NextResponse.json({ error: "La imagen no puede superar 5 MB." }, { status: 400 });
  }

  const detectedExtension = await detectImageExtension(file);
  if (!detectedExtension) {
    return NextResponse.json({ error: "El archivo no parece ser una imagen válida PNG, JPG o WebP." }, { status: 400 });
  }

  const declaredType = file.type ? allowedTypes.get(file.type) : null;
  const detectedType = typeByExtension.get(detectedExtension);

  if (!detectedType) {
    return NextResponse.json({ error: "Solo se permiten imágenes PNG, JPG o WebP." }, { status: 400 });
  }

  if (declaredType && declaredType.extension !== detectedExtension) {
    return NextResponse.json({ error: "La extensión real de la imagen no coincide con el tipo del archivo." }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const safePath = `products/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${detectedType.extension}`;
  const { error } = await supabase.storage.from(productImagesBucket).upload(safePath, file, {
    contentType: detectedType.contentType,
    upsert: false,
  });

  if (error) {
    return NextResponse.json({ error: `Supabase no pudo guardar la imagen: ${error.message}` }, { status: 400 });
  }

  const { data } = supabase.storage.from(productImagesBucket).getPublicUrl(safePath);

  return NextResponse.json({ url: data.publicUrl, path: safePath });
}
