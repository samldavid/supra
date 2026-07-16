import { NextResponse } from "next/server";
import { redirect } from "next/navigation";

import { hasSupabasePublicEnv } from "@/lib/supabase/config";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminStatus {
  configured: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userEmail?: string;
  userId?: string;
  error?: string;
}

export async function getAdminStatus(): Promise<AdminStatus> {
  if (!hasSupabasePublicEnv()) {
    return {
      configured: false,
      isAuthenticated: false,
      isAdmin: false,
      error: "Supabase no está configurado.",
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userResult, error: userError } = await supabase.auth.getUser();

    if (userError || !userResult.user) {
      return {
        configured: true,
        isAuthenticated: false,
        isAdmin: false,
      };
    }

    const { data: profile, error: profileError } = await supabase
      .from("admin_profiles")
      .select("role")
      .eq("user_id", userResult.user.id)
      .eq("role", "admin")
      .maybeSingle();

    return {
      configured: true,
      isAuthenticated: true,
      isAdmin: Boolean(profile?.role === "admin" && !profileError),
      userEmail: userResult.user.email ?? undefined,
      userId: userResult.user.id,
      error: profileError?.message,
    };
  } catch (error) {
    return {
      configured: hasSupabasePublicEnv(),
      isAuthenticated: false,
      isAdmin: false,
      error: error instanceof Error ? error.message : "Error desconocido.",
    };
  }
}

export async function requireAdminPage() {
  const status = await getAdminStatus();

  if (!status.configured || !status.isAuthenticated) {
    redirect("/login");
  }

  return status;
}

export async function requireAdminApi() {
  const status = await getAdminStatus();

  if (!status.configured) {
    return {
      status,
      response: NextResponse.json(
        { error: "Supabase no está configurado para administrar productos." },
        { status: 503 },
      ),
    };
  }

  if (!status.isAuthenticated) {
    return {
      status,
      response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }),
    };
  }

  if (!status.isAdmin) {
    return {
      status,
      response: NextResponse.json({ error: "No tienes permisos administrativos." }, { status: 403 }),
    };
  }

  return { status, response: null };
}
