import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { assertSupabasePublicEnv } from "@/lib/supabase/config";

export async function createSupabaseServerClient() {
  const { supabaseUrl, supabaseAnonKey } = assertSupabasePublicEnv();
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components no siempre pueden escribir cookies. Middleware y route handlers sí refrescan sesión.
        }
      },
    },
  });
}
