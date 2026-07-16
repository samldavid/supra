import { createSupabaseServerClient } from "@/lib/supabase/server";
import { mapProductRow, type Product, type ProductDbRow } from "@/lib/product-types";

export async function getAdminProducts(): Promise<Product[]> {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("orden", { ascending: true, nullsFirst: false })
    .order("nombre", { ascending: true })
    .order("presentacion", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as ProductDbRow[]).map(mapProductRow);
}
