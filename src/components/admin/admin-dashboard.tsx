"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ExternalLink,
  ImagePlus,
  LogOut,
  Pencil,
  Plus,
  Power,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/product-types";
import { slugify } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { formatPrice } from "@/lib/utils";

type StatusFilter = "todos" | "activos" | "inactivos";

interface ProductFormState {
  id: string;
  slug: string;
  nombre: string;
  categoria: string;
  precio: string;
  presentacion: string;
  descripcion: string;
  imagen: string;
  activo: boolean;
  destacado: boolean;
  stock: string;
  orden: string;
  usos: string;
  caracteristicas: string;
  especificaciones: string;
  informacionPendiente: boolean;
}

const emptyForm: ProductFormState = {
  id: "",
  slug: "",
  nombre: "",
  categoria: "",
  precio: "",
  presentacion: "",
  descripcion: "",
  imagen: "",
  activo: true,
  destacado: false,
  stock: "",
  orden: "",
  usos: "",
  caracteristicas: "",
  especificaciones: "{}",
  informacionPendiente: false,
};

function productToForm(product: Product): ProductFormState {
  return {
    id: product.id,
    slug: product.slug,
    nombre: product.nombre,
    categoria: product.categoria,
    precio: product.precio === null ? "" : String(product.precio),
    presentacion: product.presentacion,
    descripcion: product.descripcion,
    imagen: product.imagen,
    activo: product.activo ?? true,
    destacado: Boolean(product.destacado),
    stock: product.stock === null || product.stock === undefined ? "" : String(product.stock),
    orden: product.orden === null || product.orden === undefined ? "" : String(product.orden),
    usos: product.usos.join("\n"),
    caracteristicas: product.caracteristicas.join("\n"),
    especificaciones: JSON.stringify(product.especificaciones ?? {}, null, 2),
    informacionPendiente: Boolean(product.informacionPendiente),
  };
}

function formToPayload(form: ProductFormState) {
  return {
    id: form.id.trim() || `PROD-${Date.now()}`,
    slug: form.slug.trim() || slugify(`${form.nombre} ${form.presentacion}`),
    nombre: form.nombre,
    categoria: form.categoria,
    precio: form.precio,
    presentacion: form.presentacion,
    descripcion: form.descripcion,
    imagen: form.imagen,
    activo: form.activo,
    destacado: form.destacado,
    stock: form.stock,
    orden: form.orden,
    usos: form.usos,
    caracteristicas: form.caracteristicas,
    especificaciones: form.especificaciones,
    informacionPendiente: form.informacionPendiente,
  };
}

export function AdminDashboard({ initialProducts, userEmail }: { initialProducts: Product[]; userEmail: string }) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const categories = useMemo(() => Array.from(new Set(products.map((product) => product.categoria))).sort((a, b) => a.localeCompare(b, "es")), [products]);
  const metrics = useMemo(() => ({
    total: products.length,
    active: products.filter((product) => product.activo !== false).length,
    inactive: products.filter((product) => product.activo === false).length,
    categories: categories.length,
  }), [categories.length, products]);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return products.filter((product) => {
      const matchesQuery = !normalizedQuery || [product.nombre, product.categoria, product.presentacion, product.descripcion]
        .join(" ")
        .toLocaleLowerCase("es")
        .includes(normalizedQuery);
      const matchesCategory = category === "Todas" || product.categoria === category;
      const matchesStatus =
        statusFilter === "todos" ||
        (statusFilter === "activos" && product.activo !== false) ||
        (statusFilter === "inactivos" && product.activo === false);
      return matchesQuery && matchesCategory && matchesStatus;
    });
  }, [category, products, query, statusFilter]);

  function updateForm<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if ((key === "nombre" || key === "presentacion") && !current.slug) {
        next.slug = slugify(`${next.nombre} ${next.presentacion}`);
      }
      return next;
    });
  }

  function startCreate() {
    setEditingId(null);
    setImageFile(null);
    setForm({ ...emptyForm, id: `PROD-${Date.now()}` });
    setNotice("");
    setError("");
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setImageFile(null);
    setForm(productToForm(product));
    setNotice("");
    setError("");
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) return form.imagen;

    const formData = new FormData();
    formData.append("file", imageFile);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "No fue posible subir la imagen.");
    }

    return result.url as string;
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setNotice("");
    setError("");

    try {
      const imageUrl = await uploadImageIfNeeded();
      const payload = { ...formToPayload({ ...form, imagen: imageUrl }) };
      const response = await fetch(editingId ? `/api/admin/products/${encodeURIComponent(editingId)}` : "/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "No fue posible guardar el producto.");
      }

      const savedProduct = result.product as Product;
      setProducts((current) => editingId
        ? current.map((product) => (product.id === editingId ? savedProduct : product))
        : [savedProduct, ...current]);
      setEditingId(savedProduct.id);
      setForm(productToForm(savedProduct));
      setImageFile(null);
      setNotice("Producto guardado correctamente.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "No fue posible guardar el producto.");
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    const payload = formToPayload({ ...productToForm(product), activo: !(product.activo !== false) });
    await persistExistingProduct(product.id, payload, product.activo !== false ? "Producto desactivado." : "Producto activado.");
  }

  async function persistExistingProduct(productId: string, payload: ReturnType<typeof formToPayload>, successMessage: string) {
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "No fue posible actualizar el producto.");
      return;
    }

    const savedProduct = result.product as Product;
    setProducts((current) => current.map((product) => (product.id === productId ? savedProduct : product)));
    setNotice(successMessage);
    router.refresh();
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(`¿Eliminar definitivamente "${product.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
    const result = await response.json();

    if (!response.ok) {
      setError(result.error ?? "No fue posible eliminar el producto.");
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    if (editingId === product.id) startCreate();
    setNotice("Producto eliminado correctamente.");
    router.refresh();
  }

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <section className="shell py-8 sm:py-10">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-black uppercase tracking-[.16em] text-primary">Panel administrativo</p>
          <h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-5xl">Productos SupraQuím</h1>
          <p className="mt-3 text-sm text-muted-foreground">Sesión: {userEmail}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/catalogo" target="_blank" rel="noreferrer"><ExternalLink /> Ver catálogo</Link>
          </Button>
          <Button type="button" variant="accent" onClick={startCreate}><Plus /> Añadir producto</Button>
          <Button type="button" variant="outline" onClick={signOut}><LogOut /> Cerrar sesión</Button>
        </div>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Total", metrics.total],
          ["Activos", metrics.active],
          ["Inactivos", metrics.inactive],
          ["Categorías", metrics.categories],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardContent className="p-5">
              <p className="text-xs font-black uppercase tracking-[.16em] text-muted-foreground">{label}</p>
              <p className="mt-2 text-3xl font-black text-primary">{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {(notice || error) ? (
        <div className={`mt-6 rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "border border-red-200 bg-red-50 text-red-700" : "border border-green-200 bg-green-50 text-green-700"}`} role="status">
          {error || notice}
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 xl:grid-cols-[1fr_28rem]">
        <div>
          <div className="rounded-[1.5rem] border border-border bg-white p-4 shadow-[0_12px_40px_rgba(41,22,51,.06)]">
            <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto]">
              <label className="relative block">
                <span className="sr-only">Buscar productos</span>
                <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, categoría o descripción" className="pl-11" />
              </label>
              <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-xl border border-input bg-background px-4 text-sm font-bold outline-none">
                <option value="Todas">Todas las categorías</option>
                {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="h-12 rounded-xl border border-input bg-background px-4 text-sm font-bold outline-none">
                <option value="todos">Todos</option>
                <option value="activos">Activos</option>
                <option value="inactivos">Inactivos</option>
              </select>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-border bg-white shadow-[0_12px_40px_rgba(41,22,51,.06)]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[56rem] text-left text-sm">
                <thead className="bg-muted text-xs font-black uppercase tracking-[.12em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative size-14 overflow-hidden rounded-xl bg-muted">
                            {product.imagen ? <Image src={product.imagen} alt={product.nombre} fill sizes="56px" className="object-cover" /> : null}
                          </div>
                          <div>
                            <p className="font-black">{product.nombre}</p>
                            <p className="text-xs font-semibold text-muted-foreground">{product.presentacion}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{product.categoria}</td>
                      <td className="px-4 py-3 font-black text-primary">{product.precio === null ? "Pendiente" : formatPrice(product.precio)}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-1 text-xs font-black ${product.activo === false ? "bg-muted text-muted-foreground" : "bg-green-100 text-green-700"}`}>
                          {product.activo === false ? "Inactivo" : "Activo"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => startEdit(product)}><Pencil /> Editar</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => toggleActive(product)}><Power /> {product.activo === false ? "Activar" : "Desactivar"}</Button>
                          <Button type="button" variant="outline" size="sm" onClick={() => deleteProduct(product)}><Trash2 /> Eliminar</Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredProducts.length ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-muted-foreground">No hay productos con esos filtros.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[.16em] text-primary">{editingId ? "Editar producto" : "Nuevo producto"}</p>
                <h2 className="mt-1 text-2xl font-black">{editingId ? form.nombre : "Crear producto"}</h2>
              </div>
              {editingId ? (
                <button type="button" onClick={startCreate} aria-label="Cancelar edición" className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-primary">
                  <X className="size-5" />
                </button>
              ) : null}
            </div>

            <form className="mt-5 space-y-4" onSubmit={saveProduct}>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">ID</span>
                  <Input value={form.id} onChange={(event) => updateForm("id", event.target.value)} readOnly={Boolean(editingId)} required />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Slug</span>
                  <Input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Nombre</span>
                <Input value={form.nombre} onChange={(event) => updateForm("nombre", event.target.value)} required />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Categoría</span>
                  <Input value={form.categoria} onChange={(event) => updateForm("categoria", event.target.value)} required list="admin-categories" />
                  <datalist id="admin-categories">{categories.map((item) => <option key={item} value={item} />)}</datalist>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Presentación</span>
                  <Input value={form.presentacion} onChange={(event) => updateForm("presentacion", event.target.value)} required />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Descripción</span>
                <textarea value={form.descripcion} onChange={(event) => updateForm("descripcion", event.target.value)} className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-ring/10" />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Precio COP</span>
                  <Input inputMode="numeric" value={form.precio} onChange={(event) => updateForm("precio", event.target.value)} />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Stock</span>
                  <Input inputMode="numeric" value={form.stock} onChange={(event) => updateForm("stock", event.target.value)} />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Imagen</span>
                <Input value={form.imagen} onChange={(event) => updateForm("imagen", event.target.value)} placeholder="/productos/archivo.png o URL pública" required />
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-primary/30 bg-primary/4 px-4 py-3 text-sm font-bold text-primary">
                <ImagePlus className="size-5" />
                <span>{imageFile ? imageFile.name : "Subir nueva imagen"}</span>
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} />
              </label>
              {(imageFile || form.imagen) ? (
                <div className="relative aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageFile ? URL.createObjectURL(imageFile) : form.imagen} alt="Vista previa del producto" className="h-full w-full object-contain" />
                </div>
              ) : null}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Usos, uno por línea</span>
                  <textarea value={form.usos} onChange={(event) => updateForm("usos", event.target.value)} className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-ring/10" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Características</span>
                  <textarea value={form.caracteristicas} onChange={(event) => updateForm("caracteristicas", event.target.value)} className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-ring/10" />
                </label>
              </div>
              <label className="block">
                <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Especificaciones JSON</span>
                <textarea value={form.especificaciones} onChange={(event) => updateForm("especificaciones", event.target.value)} className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-xs outline-none focus:border-primary/50 focus:ring-4 focus:ring-ring/10" />
              </label>
              <div className="grid gap-2 text-sm font-semibold sm:grid-cols-2">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.activo} onChange={(event) => updateForm("activo", event.target.checked)} /> Activo</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.destacado} onChange={(event) => updateForm("destacado", event.target.checked)} /> Destacado</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.informacionPendiente} onChange={(event) => updateForm("informacionPendiente", event.target.checked)} /> Información pendiente</label>
                <label className="flex items-center gap-2">
                  Orden
                  <input value={form.orden} onChange={(event) => updateForm("orden", event.target.value)} className="h-9 w-20 rounded-lg border border-input bg-background px-2 outline-none" />
                </label>
              </div>
              <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
                <Save /> {isSaving ? "Guardando…" : "Guardar producto"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
