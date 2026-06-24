import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <section className="shell flex min-h-[65vh] flex-col items-center justify-center py-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FlaskConical className="size-8" />
      </div>
      <p className="mt-6 text-sm font-black uppercase tracking-[.18em] text-primary">Error 404</p>
      <h1 className="mt-3 text-4xl font-black tracking-[-.05em] sm:text-5xl">Este producto no está en la mezcla</h1>
      <p className="mt-4 max-w-md text-muted-foreground">La página que buscas cambió de lugar o ya no está disponible.</p>
      <Button asChild className="mt-7">
        <Link href="/catalogo"><ArrowLeft /> Volver al catálogo</Link>
      </Button>
    </section>
  );
}
