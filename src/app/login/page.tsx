import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { getAdminStatus } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Acceso administrativo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const status = await getAdminStatus();

  if (status.isAdmin) {
    redirect("/admin");
  }

  return (
    <section className="shell flex min-h-[calc(100svh-4.5rem)] items-center justify-center py-12">
      <LoginForm configured={status.configured} />
    </section>
  );
}
