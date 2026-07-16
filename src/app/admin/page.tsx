import type { Metadata } from "next";
import Link from "next/link";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { Button } from "@/components/ui/button";
import { getAdminProducts } from "@/lib/admin-products";
import { requireAdminPage } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Panel administrativo",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const status = await requireAdminPage();

  if (!status.isAdmin) {
    return (
      <section className="shell flex min-h-[65vh] items-center justify-center py-16 text-center">
        <div className="max-w-md rounded-[1.5rem] border border-border bg-white p-8 shadow-[0_12px_40px_rgba(41,22,51,.06)]">
          <p className="text-sm font-black uppercase tracking-[.16em] text-primary">Acceso bloqueado</p>
          <h1 className="mt-3 text-3xl font-black">No tienes permisos administrativos</h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Tu sesión es válida, pero tu usuario no está autorizado en la tabla de administradores.
          </p>
          <Button asChild className="mt-6">
            <Link href="/login">Volver al acceso</Link>
          </Button>
        </div>
      </section>
    );
  }

  const products = await getAdminProducts();

  return <AdminDashboard initialProducts={products} userEmail={status.userEmail ?? "Administrador"} />;
}
