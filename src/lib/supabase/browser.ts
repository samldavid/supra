"use client";

import { createBrowserClient } from "@supabase/ssr";

import { assertSupabasePublicEnv } from "@/lib/supabase/config";

export function createSupabaseBrowserClient() {
  const { supabaseUrl, supabaseAnonKey } = assertSupabasePublicEnv();
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
