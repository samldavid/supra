"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Ingresa correo y contraseña.");
      return;
    }

    if (!configured) {
      setError("Supabase aún no está configurado. Revisa las variables de entorno.");
      return;
    }

    setIsLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

      if (authError) {
        setError("Correo o contraseña inválidos.");
        return;
      }

      const response = await fetch("/api/admin/me", { cache: "no-store" });

      if (!response.ok) {
        await supabase.auth.signOut();
        setError("Tu usuario existe, pero no tiene permisos administrativos.");
        return;
      }

      router.replace("/admin");
      router.refresh();
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "No fue posible iniciar sesión.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6 sm:p-8">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <LockKeyhole className="size-7" />
        </div>
        <div className="mt-6 text-center">
          <p className="text-xs font-black uppercase tracking-[.16em] text-primary">Administración SupraQuím</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">Iniciar sesión</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">Acceso exclusivo para administradores. No hay registro público.</p>
        </div>

        {!configured ? (
          <div className="mt-6 rounded-2xl border border-accent/50 bg-accent/10 px-4 py-3 text-sm font-semibold">
            Falta configurar Supabase en las variables de entorno antes de usar el acceso administrativo.
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Correo electrónico</span>
            <span className="relative block">
              <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="pl-11"
                disabled={isLoading}
                required
              />
            </span>
          </label>
          <label className="block">
            <span className="mb-2 block text-sm font-bold">Contraseña</span>
            <Input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isLoading}
              required
            />
          </label>

          {error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700" role="alert">
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading || !configured}>
            {isLoading ? "Validando…" : "Entrar al panel"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
