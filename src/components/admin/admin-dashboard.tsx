"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  ExternalLink,
  LogOut,
  Pencil,
  Plus,
  Power,
  Save,
  Search,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Product } from "@/lib/product-types";
import { slugify } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, formatPrice } from "@/lib/utils";

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

interface ProductSuggestion {
  label: string;
  category: string;
  presentation: string;
  usos: string[];
  caracteristicas: string[];
  especificaciones: Record<string, string>;
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

const preferredCategories = [
  "Productos de limpieza",
  "Materias primas",
  "Insumos industriales",
  "Químicos especializados",
  "Envases",
  "Fragancias",
  "Información pendiente",
];

const categoryHints = new Map([
  ["Productos de limpieza", "Jabones, detergentes y cuidado del hogar."],
  ["Materias primas", "Bases e ingredientes para formular."],
  ["Insumos industriales", "Soluciones para procesos y producción."],
  ["Químicos especializados", "Productos de uso técnico específico."],
  ["Envases", "Presentación y protección de producto."],
  ["Fragancias", "Aromas e identidad sensorial."],
  ["Información pendiente", "Para guardar sin inventar datos."],
]);

const presentationOptions = [
  "1 galón",
  "1 litro",
  "500 ml",
  "250 ml",
  "1 kg",
  "500 g",
  "250 g",
  "125 g",
];

const imageMimeTypes = ["image/png", "image/jpeg", "image/webp"];
const maxImageSize = 5 * 1024 * 1024;

const cleaningSuggestion: ProductSuggestion = {
  label: "Sugerencias para producto de limpieza",
  category: "Productos de limpieza",
  presentation: "1 galón",
  usos: ["Lavado de ropa", "Remoción de manchas", "Limpieza profunda", "Uso doméstico o comercial"],
  caracteristicas: ["Alto rendimiento", "Aroma fresco", "Fácil dosificación", "Listo para usar"],
  especificaciones: {
    Tipo: "Jabón líquido",
    Uso: "Ropa",
    Color: "Información pendiente",
    Fragancia: "Información pendiente",
  },
};

const generalSuggestion: ProductSuggestion = {
  label: "Sugerencias básicas",
  category: "Información pendiente",
  presentation: "Información pendiente",
  usos: ["Información pendiente"],
  caracteristicas: ["Información pendiente"],
  especificaciones: {
    Tipo: "Información pendiente",
    Uso: "Información pendiente",
  },
};

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}

function getSuggestion(nombre: string, categoria: string): ProductSuggestion {
  const searchable = normalizeText(`${nombre} ${categoria}`);

  if (/(limpieza|jabon|detergente|ropa|lavar|lava ropa|shampoo|desinfectante)/.test(searchable)) {
    return cleaningSuggestion;
  }

  return generalSuggestion;
}

function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(0)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

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
  const categoria = form.categoria.trim() || "Información pendiente";
  const presentacion = form.presentacion.trim() || "Información pendiente";
  const hasPendingInfo =
    form.informacionPendiente ||
    categoria === "Información pendiente" ||
    presentacion === "Información pendiente" ||
    !form.descripcion.trim() ||
    !form.precio.trim();

  return {
    id: form.id.trim() || `PROD-${Date.now()}`,
    slug: form.slug.trim() || slugify(`${form.nombre} ${presentacion}`),
    nombre: form.nombre.trim(),
    categoria,
    precio: form.precio,
    presentacion,
    descripcion: form.descripcion.trim(),
    imagen: form.imagen,
    activo: form.activo,
    destacado: form.destacado,
    stock: form.stock,
    orden: form.orden,
    usos: form.usos,
    caracteristicas: form.caracteristicas,
    especificaciones: form.especificaciones.trim() || "{}",
    informacionPendiente: hasPendingInfo,
  };
}

export function AdminDashboard({ initialProducts, userEmail }: { initialProducts: Product[]; userEmail: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todas");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormState>(emptyForm);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.categoria))).sort((a, b) => a.localeCompare(b, "es")),
    [products],
  );

  const categoryOptions = useMemo(
    () => Array.from(new Set([...preferredCategories, ...categories].filter(Boolean))),
    [categories],
  );

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

  const suggestion = useMemo(() => getSuggestion(form.nombre, form.categoria), [form.categoria, form.nombre]);
  const previewImage = imagePreviewUrl || form.imagen;
  const formattedPreviewPrice = form.precio.trim() ? formatPrice(Number(form.precio.replace(/[^\d.-]/g, "")) || 0) : "Pendiente";

  function updateForm<K extends keyof ProductFormState>(key: K, value: ProductFormState[K]) {
    setForm((current) => {
      const next = { ...current, [key]: value };
      if ((key === "nombre" || key === "presentacion") && !editingId) {
        next.slug = slugify(`${next.nombre} ${next.presentacion}`);
      }
      return next;
    });
  }

  function selectImage(file: File | null) {
    if (!file) {
      setImageFile(null);
      return;
    }

    if (!imageMimeTypes.includes(file.type)) {
      setImageFile(null);
      setError("La imagen debe ser PNG, JPG o WebP.");
      return;
    }

    if (file.size > maxImageSize) {
      setImageFile(null);
      setError("La imagen no puede superar 5 MB.");
      return;
    }

    setImageFile(file);
    setError("");
    setNotice("Imagen lista para subir. Se guardará al guardar el producto.");
  }

  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    selectImage(event.target.files?.[0] ?? null);
    event.target.value = "";
  }

  function handleImageDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingImage(false);
    selectImage(event.dataTransfer.files?.[0] ?? null);
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

  function applySuggestedDetails() {
    setForm((current) => {
      const nextPresentation = current.presentacion.trim() || suggestion.presentation;
      const nextCategory = current.categoria.trim() || suggestion.category;
      return {
        ...current,
        categoria: nextCategory,
        presentacion: nextPresentation,
        usos: current.usos.trim() ? current.usos : suggestion.usos.join("\n"),
        caracteristicas: current.caracteristicas.trim() ? current.caracteristicas : suggestion.caracteristicas.join("\n"),
        especificaciones: current.especificaciones.trim() && current.especificaciones.trim() !== "{}"
          ? current.especificaciones
          : JSON.stringify({ ...suggestion.especificaciones, Presentación: nextPresentation }, null, 2),
        informacionPendiente: current.informacionPendiente || nextCategory === "Información pendiente" || nextPresentation === "Información pendiente",
        slug: editingId ? current.slug : slugify(`${current.nombre} ${nextPresentation}`),
      };
    });
    setNotice("Sugerencias aplicadas. Puedes ajustar cualquier dato antes de guardar.");
    setError("");
  }

  async function uploadImageIfNeeded() {
    if (!imageFile) {
      if (!form.imagen.trim()) {
        throw new Error("Sube una imagen del producto o pega una URL pública en opciones avanzadas.");
      }
      return form.imagen;
    }

    const formData = new FormData();
    formData.append("file", imageFile);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error ?? "No fue posible subir la imagen.");
    }

    return result.url as string;
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice("");
    setError("");

    if (!form.nombre.trim()) {
      setError("Escribe el nombre del producto antes de guardar.");
      return;
    }

    setIsSaving(true);

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

      <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_32rem]">
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
          <CardContent className="p-0">
            <div className="rounded-t-[1.5rem] border-b border-border bg-gradient-to-br from-primary/8 via-white to-accent/12 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">{editingId ? "Editar producto" : "Nuevo producto"}</p>
                  <h2 className="mt-1 text-2xl font-black">{editingId ? form.nombre : "Carga rápida guiada"}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Escribe los datos principales, sube la foto y completa lo demás con clics.
                  </p>
                </div>
                {editingId ? (
                  <button type="button" onClick={startCreate} aria-label="Cancelar edición" className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-primary">
                    <X className="size-5" />
                  </button>
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-accent/40 bg-accent/15 p-4 text-sm">
                <div className="flex gap-3">
                  <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                  <div>
                    <p className="font-black text-foreground">Modo sencillo para productos nuevos</p>
                    <p className="mt-1 text-muted-foreground">
                      Para el jabón Arial: nombre, descripción, precio 15000, foto, categoría “Productos de limpieza” y presentación “1 galón”.
                    </p>
                    <Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={applySuggestedDetails}>
                      <Sparkles /> {suggestion.label}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <form className="space-y-6 p-5" onSubmit={saveProduct}>
              <section className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">1. Datos visibles</p>
                  <p className="mt-1 text-sm text-muted-foreground">Estos son los textos principales que verá el cliente.</p>
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Nombre del producto</span>
                  <Input
                    value={form.nombre}
                    onChange={(event) => updateForm("nombre", event.target.value)}
                    placeholder="Ej: JABÓN LÍQUIDO PARA ROPA (ARIAL)"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Descripción comercial</span>
                  <textarea
                    value={form.descripcion}
                    onChange={(event) => updateForm("descripcion", event.target.value)}
                    placeholder="Describe para qué sirve y qué beneficio tiene."
                    className="min-h-28 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-ring/10"
                  />
                </label>

                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Precio de referencia COP</span>
                  <Input
                    inputMode="numeric"
                    value={form.precio}
                    onChange={(event) => updateForm("precio", event.target.value.replace(/[^\d]/g, ""))}
                    placeholder="Ej: 15000"
                  />
                  <span className="mt-1 block text-xs font-semibold text-muted-foreground">Vista previa: {formattedPreviewPrice}</span>
                </label>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">2. Foto del producto</p>
                  <p className="mt-1 text-sm text-muted-foreground">Arrastra la imagen o haz clic para seleccionarla. PNG, JPG o WebP hasta 5 MB.</p>
                </div>

                <label
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/35 bg-primary/5 px-4 py-6 text-center transition hover:border-primary hover:bg-primary/8",
                    isDraggingImage && "border-primary bg-primary/10",
                  )}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setIsDraggingImage(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setIsDraggingImage(false)}
                  onDrop={handleImageDrop}
                >
                  <UploadCloud className="size-8 text-primary" />
                  <span className="text-sm font-black text-primary">
                    {imageFile ? imageFile.name : "Subir o arrastrar imagen"}
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">
                    {imageFile ? `${formatFileSize(imageFile.size)} listo para guardar` : "La URL se genera automáticamente en Supabase al guardar."}
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>

                {previewImage ? (
                  <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                    <div className="relative aspect-[4/3]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={previewImage} alt="Vista previa del producto" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-white px-4 py-3 text-xs font-semibold text-muted-foreground">
                      <span>{imageFile ? "Nueva imagen seleccionada" : "Imagen actual"}</span>
                      {imageFile ? (
                        <button type="button" className="font-black text-primary hover:underline" onClick={() => setImageFile(null)}>
                          Quitar selección
                        </button>
                      ) : null}
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">3. Clasificación con clic</p>
                  <p className="mt-1 text-sm text-muted-foreground">Si no estás seguro, usa “Información pendiente” y no se inventan datos.</p>
                </div>

                <div>
                  <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Categoría</span>
                  <div className="grid gap-2">
                    {categoryOptions.map((option) => {
                      const selected = form.categoria === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => updateForm("categoria", option)}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-ring/10",
                            selected ? "border-primary bg-primary/8 text-primary" : "border-border bg-white hover:border-primary/30 hover:bg-primary/5",
                          )}
                        >
                          <span className="flex items-center justify-between gap-3">
                            <span className="font-black">{option}</span>
                            {selected ? <CheckCircle2 className="size-5" /> : null}
                          </span>
                          <span className="mt-1 block text-xs font-semibold text-muted-foreground">{categoryHints.get(option) ?? "Categoría existente del catálogo."}</span>
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    value={form.categoria}
                    onChange={(event) => updateForm("categoria", event.target.value)}
                    placeholder="O escribe otra categoría"
                    className="mt-3"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Presentación</span>
                  <div className="flex flex-wrap gap-2">
                    {presentationOptions.map((option) => {
                      const selected = form.presentacion === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => updateForm("presentacion", option)}
                          className={cn(
                            "rounded-full border px-3.5 py-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-ring/10",
                            selected ? "border-primary bg-primary text-white" : "border-border bg-white text-foreground hover:border-primary/30 hover:bg-primary/5",
                          )}
                        >
                          {option}
                        </button>
                      );
                    })}
                  </div>
                  <Input
                    value={form.presentacion}
                    onChange={(event) => updateForm("presentacion", event.target.value)}
                    placeholder="O escribe otra presentación"
                    className="mt-3"
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">4. Detalles opcionales</p>
                  <p className="mt-1 text-sm text-muted-foreground">Puedes usar el botón de sugerencias y luego ajustar lo que haga falta.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Usos visibles</span>
                    <textarea
                      value={form.usos}
                      onChange={(event) => updateForm("usos", event.target.value)}
                      placeholder="Uno por línea"
                      className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-ring/10"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Características visibles</span>
                    <textarea
                      value={form.caracteristicas}
                      onChange={(event) => updateForm("caracteristicas", event.target.value)}
                      placeholder="Una por línea"
                      className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-ring/10"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-3">
                <p className="text-xs font-black uppercase tracking-[.16em] text-primary">5. Estado en la tienda</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    type="button"
                    aria-pressed={form.activo}
                    onClick={() => updateForm("activo", true)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-ring/10",
                      form.activo ? "border-green-300 bg-green-50 text-green-700" : "border-border bg-white hover:bg-muted",
                    )}
                  >
                    <span className="font-black">Visible</span>
                    <span className="mt-1 block text-xs font-semibold text-muted-foreground">Aparece en el catálogo.</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={!form.activo}
                    onClick={() => updateForm("activo", false)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-ring/10",
                      !form.activo ? "border-border bg-muted text-muted-foreground" : "border-border bg-white hover:bg-muted",
                    )}
                  >
                    <span className="font-black">Guardar sin publicar</span>
                    <span className="mt-1 block text-xs font-semibold text-muted-foreground">Queda oculto al cliente.</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={form.destacado}
                    onClick={() => updateForm("destacado", !form.destacado)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-ring/10",
                      form.destacado ? "border-accent bg-accent/20 text-accent-foreground" : "border-border bg-white hover:bg-accent/10",
                    )}
                  >
                    <span className="font-black">Destacado</span>
                    <span className="mt-1 block text-xs font-semibold text-muted-foreground">Resalta el producto cuando aplique.</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={form.informacionPendiente}
                    onClick={() => updateForm("informacionPendiente", !form.informacionPendiente)}
                    className={cn(
                      "rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-ring/10",
                      form.informacionPendiente ? "border-primary bg-primary/8 text-primary" : "border-border bg-white hover:bg-primary/5",
                    )}
                  >
                    <span className="font-black">Información pendiente</span>
                    <span className="mt-1 block text-xs font-semibold text-muted-foreground">Marca datos por completar.</span>
                  </button>
                </div>
              </section>

              <details className="rounded-2xl border border-border bg-muted/45 p-4">
                <summary className="cursor-pointer text-sm font-black text-primary">Opciones avanzadas</summary>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">ID interno</span>
                      <Input value={form.id} onChange={(event) => updateForm("id", event.target.value)} readOnly={Boolean(editingId)} required />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Slug URL</span>
                      <Input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} />
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Stock</span>
                      <Input inputMode="numeric" value={form.stock} onChange={(event) => updateForm("stock", event.target.value.replace(/[^\d]/g, ""))} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Orden</span>
                      <Input inputMode="numeric" value={form.orden} onChange={(event) => updateForm("orden", event.target.value.replace(/[^\d-]/g, ""))} />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">URL o ruta de imagen</span>
                    <Input
                      value={form.imagen}
                      onChange={(event) => updateForm("imagen", event.target.value)}
                      placeholder="Se llena automáticamente al subir imagen."
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Especificaciones JSON</span>
                    <textarea
                      value={form.especificaciones}
                      onChange={(event) => updateForm("especificaciones", event.target.value)}
                      className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-xs outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-ring/10"
                    />
                  </label>
                </div>
              </details>

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
