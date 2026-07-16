export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
  "";
export const productImagesBucket = process.env.NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET?.trim() || "product-images";

export function hasSupabasePublicEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function assertSupabasePublicEnv() {
  if (!hasSupabasePublicEnv()) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}
