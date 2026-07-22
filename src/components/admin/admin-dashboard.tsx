"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
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

import { ChemicalHazardPictogram } from "@/components/chemical-hazard-pictogram";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  chemicalHazardGroups,
  chemicalHazards,
  defaultChemicalWarning,
  getChemicalHazards,
  getChemicalHazardsByIds,
  getChemicalWarning,
  getUniqueChemicalPictograms,
  mergeChemicalSafety,
  visibleSpecifications,
  type ChemicalHazardId,
} from "@/lib/product-safety";
import type { Product } from "@/lib/product-types";
import { slugify } from "@/lib/slug";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { cn, formatPrice } from "@/lib/utils";

type StatusFilter = "todos" | "activos" | "inactivos";
type FeedbackKind = "success" | "error" | "warning" | "info";

interface Feedback {
  kind: FeedbackKind;
  message: string;
}

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
  advertenciaQuimica: string;
  riesgosQuimicos: ChemicalHazardId[];
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

interface UploadedImageResult {
  url: string;
  path?: string;
  uploaded: boolean;
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
  advertenciaQuimica: "",
  riesgosQuimicos: [],
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
  "5 L",
  "20 L",
  "500 ml",
  "250 ml",
  "1 kg",
  "500 g",
  "250 g",
  "125 g",
];

const imageMimeTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
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

const feedbackStyles: Record<FeedbackKind, string> = {
  success: "border-green-200 bg-green-50 text-green-700",
  error: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-800",
  info: "border-primary/20 bg-primary/5 text-primary",
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

function generatedProductId(nombre: string) {
  const prefix = slugify(nombre).replace(/-/g, "_").toUpperCase().slice(0, 36) || "PRODUCTO";
  return `${prefix}-${Date.now()}`;
}

function parseSpecifications(value: string) {
  if (!value.trim() || value.trim() === "{}") return {};

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed)
        .map(([key, item]) => [key.trim(), String(item).trim()])
        .filter(([key, item]) => key && item),
    );
  } catch {
    return {};
  }
}

function buildSpecifications(form: ProductFormState) {
  const parsedSpecifications = parseSpecifications(form.especificaciones);
  const baseSpecifications = Object.keys(parsedSpecifications).length
    ? parsedSpecifications
    : { Estado: "Información pendiente" };

  return JSON.stringify(mergeChemicalSafety(baseSpecifications, form.advertenciaQuimica, form.riesgosQuimicos), null, 2);
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
    advertenciaQuimica: getChemicalWarning(product),
    riesgosQuimicos: getChemicalHazards(product).map((hazard) => hazard.id),
    especificaciones: JSON.stringify(Object.fromEntries(visibleSpecifications(product)), null, 2),
    informacionPendiente: Boolean(product.informacionPendiente),
  };
}

function prepareFormForSubmit(form: ProductFormState, products: Product[], editingId: string | null): ProductFormState {
  const categoria = form.categoria.trim() || "Información pendiente";
  const presentacion = form.presentacion.trim() || "Información pendiente";
  const id = editingId ? form.id.trim() : form.id.trim() || generatedProductId(form.nombre);
  const baseSlug = form.slug.trim() || slugify(`${form.nombre} ${presentacion}`);
  const existingSlugs = new Set(
    products
      .filter((product) => product.id !== editingId)
      .map((product) => product.slug),
  );
  const slug = !editingId && existingSlugs.has(baseSlug) ? `${baseSlug}-${String(Date.now()).slice(-6)}` : baseSlug;
  const hasPendingInfo =
    form.informacionPendiente ||
    categoria === "Información pendiente" ||
    presentacion === "Información pendiente" ||
    !form.descripcion.trim() ||
    !form.precio.trim();
  const chemicalWarning = form.advertenciaQuimica.trim() || (form.riesgosQuimicos.length ? defaultChemicalWarning : "");

  return {
    ...form,
    id,
    slug,
    categoria,
    presentacion,
    nombre: form.nombre.trim(),
    descripcion: form.descripcion.trim() || "Información pendiente",
    usos: form.usos.trim() || "Información pendiente",
    caracteristicas: form.caracteristicas.trim() || "Información pendiente",
    advertenciaQuimica: chemicalWarning,
    riesgosQuimicos: form.riesgosQuimicos,
    especificaciones: buildSpecifications(form),
    informacionPendiente: hasPendingInfo,
  };
}

function formToPayload(form: ProductFormState) {
  return {
    id: form.id,
    slug: form.slug,
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
    especificaciones: buildSpecifications(form),
    informacionPendiente: form.informacionPendiente,
  };
}

async function parseJsonResponse(response: Response) {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

function FeedbackBox({ feedback, className }: { feedback: Feedback; className?: string }) {
  return (
    <div className={cn("rounded-2xl border px-4 py-3 text-sm font-semibold", feedbackStyles[feedback.kind], className)} role="status" aria-live="polite">
      {feedback.message}
    </div>
  );
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
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isHazardPickerOpen, setIsHazardPickerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [formFeedback, setFormFeedback] = useState<Feedback | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreviewUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

  useEffect(() => {
    if (!isFormOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving) {
        if (isHazardPickerOpen) {
          setIsHazardPickerOpen(false);
          return;
        }
        closeForm();
      }
    }

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFormOpen, isHazardPickerOpen, isSaving]);

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

  const selectedChemicalHazards = getChemicalHazardsByIds(form.riesgosQuimicos);
  const selectedChemicalPictograms = getUniqueChemicalPictograms(selectedChemicalHazards);

  const filteredProducts = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("es");
    return products.filter((product) => {
      const matchesQuery = !normalizedQuery || [
        product.nombre,
        product.categoria,
        product.presentacion,
        product.descripcion,
        getChemicalWarning(product),
        ...getChemicalHazards(product).map((hazard) => `${hazard.label} ${hazard.description} ${hazard.pictogramName}`),
      ]
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
        next.slug = slugify(`${next.nombre} ${next.presentacion || "Información pendiente"}`);
      }
      return next;
    });
  }

  function selectImage(file: File | null) {
    if (!file) {
      setImageFile(null);
      return;
    }

    if (file.type && !imageMimeTypes.includes(file.type)) {
      setImageFile(null);
      setFormFeedback({ kind: "error", message: "La imagen debe ser PNG, JPG o WebP." });
      return;
    }

    if (file.size > maxImageSize) {
      setImageFile(null);
      setFormFeedback({ kind: "error", message: "La imagen no puede superar 5 MB." });
      return;
    }

    setImageFile(file);
    setFormFeedback({ kind: "info", message: "Imagen seleccionada. Aún no se subió; se subirá al guardar el producto." });
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
    setForm(emptyForm);
    setIsFormOpen(true);
    setIsHazardPickerOpen(false);
    setFeedback(null);
    setFormFeedback({ kind: "info", message: "Completa nombre, descripción, precio y foto. Si aplica, añade la advertencia química en la primera sección." });
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setImageFile(null);
    setForm(productToForm(product));
    setIsFormOpen(true);
    setIsHazardPickerOpen(false);
    setFeedback(null);
    setFormFeedback({ kind: "info", message: "Edita lo necesario. La advertencia química aparece en la primera sección y lo avanzado se completa automáticamente." });
  }

  function closeForm() {
    if (isSaving) return;
    setIsFormOpen(false);
    setIsHazardPickerOpen(false);
    setImageFile(null);
    setIsDraggingImage(false);
    setFormFeedback(null);
  }

  function toggleChemicalHazard(id: ChemicalHazardId) {
    setForm((current) => {
      const selected = current.riesgosQuimicos.includes(id);
      const nextHazardIds = selected
        ? current.riesgosQuimicos.filter((item) => item !== id)
        : [...current.riesgosQuimicos, id];

      return {
        ...current,
        riesgosQuimicos: nextHazardIds,
        advertenciaQuimica: nextHazardIds.length && !current.advertenciaQuimica.trim()
          ? defaultChemicalWarning
          : current.advertenciaQuimica,
      };
    });
  }

  function clearChemicalHazards() {
    setForm((current) => ({
      ...current,
      advertenciaQuimica: "",
      riesgosQuimicos: [],
    }));
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
    setFormFeedback({ kind: "success", message: "Sugerencias aplicadas. Puedes ajustar cualquier dato antes de guardar." });
  }

  async function uploadImageIfNeeded(currentForm: ProductFormState): Promise<UploadedImageResult> {
    if (!imageFile) {
      if (!currentForm.imagen.trim()) {
        throw new Error("Sube una imagen del producto. Si no tienes foto, deja el producto sin publicar hasta tenerla.");
      }
      return { url: currentForm.imagen, uploaded: false };
    }

    const formData = new FormData();
    formData.append("file", imageFile);
    const response = await fetch("/api/admin/uploads", { method: "POST", body: formData });
    const result = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(typeof result.error === "string" ? result.error : "No fue posible subir la imagen.");
    }

    if (typeof result.url !== "string" || !result.url) {
      throw new Error("La imagen se procesó, pero Supabase no devolvió una URL válida.");
    }

    return {
      url: result.url as string,
      path: typeof result.path === "string" ? result.path : undefined,
      uploaded: true,
    };
  }

  async function refreshProductsFromDatabase(expectedProductId: string) {
    const response = await fetch("/api/admin/products", { cache: "no-store" });
    const result = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(typeof result.error === "string" ? result.error : "No fue posible refrescar el inventario.");
    }

    if (!Array.isArray(result.products)) {
      throw new Error("La base respondió, pero no devolvió el listado de productos.");
    }

    const refreshedProducts = result.products as Product[];
    setProducts(refreshedProducts);

    if (!refreshedProducts.some((product) => product.id === expectedProductId)) {
      throw new Error("El producto se guardó, pero no apareció en el inventario actualizado.");
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);

    if (!form.nombre.trim()) {
      setFormFeedback({ kind: "error", message: "Escribe el nombre del producto antes de guardar." });
      return;
    }

    setIsSaving(true);
    let imageWasUploaded = false;
    let currentStep = "preparar los datos";

    try {
      currentStep = "preparar campos automáticos";
      setFormFeedback({ kind: "info", message: "Preparando ID, slug, categoría y datos pendientes automáticamente..." });
      const preparedForm = prepareFormForSubmit(form, products, editingId);
      setForm(preparedForm);

      currentStep = imageFile ? "subir la imagen" : "validar la imagen existente";
      setFormFeedback({ kind: "info", message: imageFile ? "Subiendo imagen a Supabase..." : "Conservando la imagen actual del producto..." });
      const uploadedImage = await uploadImageIfNeeded(preparedForm);
      imageWasUploaded = uploadedImage.uploaded;

      if (imageWasUploaded) {
        setFormFeedback({ kind: "success", message: "Imagen subida a Supabase correctamente. Ahora guardo el producto en la base..." });
      }

      currentStep = "guardar en la base de datos";
      setFormFeedback({ kind: "info", message: "Guardando producto en la base de datos..." });
      const payload = {
        ...formToPayload({ ...preparedForm, imagen: uploadedImage.url }),
        uploadedImagePath: uploadedImage.path,
      };
      const response = await fetch(editingId ? `/api/admin/products/${encodeURIComponent(editingId)}` : "/api/admin/products", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await parseJsonResponse(response);

      if (!response.ok) {
        throw new Error(typeof result.error === "string" ? result.error : "No fue posible guardar el producto.");
      }

      const savedProduct = result.product as Product;
      if (!savedProduct?.id) {
        throw new Error("La base respondió, pero no devolvió el producto guardado.");
      }

      currentStep = "actualizar el inventario";
      setFormFeedback({ kind: "info", message: "Producto guardado. Actualizando inventario desde la base..." });

      try {
        await refreshProductsFromDatabase(savedProduct.id);
        setFeedback({
          kind: "success",
          message: imageWasUploaded
            ? "Listo: la imagen subió, el producto quedó en la base y el inventario ya se actualizó."
            : "Listo: el producto quedó en la base y el inventario ya se actualizó.",
        });
      } catch (refreshError) {
        setProducts((current) => editingId
          ? current.map((product) => (product.id === editingId ? savedProduct : product))
          : [savedProduct, ...current]);
        setFeedback({
          kind: "warning",
          message: `El producto se guardó en la base, pero no pude confirmar el inventario actualizado: ${refreshError instanceof Error ? refreshError.message : "error desconocido"}. Recarga la página si no lo ves.`,
        });
      }

      setEditingId(savedProduct.id);
      setForm(productToForm(savedProduct));
      setImageFile(null);
      setIsFormOpen(false);
      router.refresh();
    } catch (saveError) {
      const detail = saveError instanceof Error ? saveError.message : "Error desconocido.";
      const message = imageWasUploaded
        ? `La imagen sí se subió a Supabase, pero falló el paso de ${currentStep}: ${detail}`
        : `No se pudo completar el paso de ${currentStep}: ${detail}`;
      setFormFeedback({ kind: "error", message });
      setFeedback({ kind: "error", message });
    } finally {
      setIsSaving(false);
    }
  }

  async function toggleActive(product: Product) {
    const preparedForm = prepareFormForSubmit(
      { ...productToForm(product), activo: !(product.activo !== false) },
      products,
      product.id,
    );
    const payload = formToPayload(preparedForm);
    await persistExistingProduct(product.id, payload, product.activo !== false ? "Producto desactivado." : "Producto activado.");
  }

  async function persistExistingProduct(productId: string, payload: ReturnType<typeof formToPayload>, successMessage: string) {
    setFeedback(null);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(productId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await parseJsonResponse(response);

    if (!response.ok) {
      setFeedback({ kind: "error", message: typeof result.error === "string" ? result.error : "No fue posible actualizar el producto." });
      return;
    }

    const savedProduct = result.product as Product;
    setProducts((current) => current.map((product) => (product.id === productId ? savedProduct : product)));
    setFeedback({ kind: "success", message: successMessage });
    router.refresh();
  }

  async function deleteProduct(product: Product) {
    const confirmed = window.confirm(`¿Eliminar definitivamente "${product.nombre}"? Esta acción no se puede deshacer.`);
    if (!confirmed) return;

    setFeedback(null);
    const response = await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "DELETE" });
    const result = await parseJsonResponse(response);

    if (!response.ok) {
      setFeedback({ kind: "error", message: typeof result.error === "string" ? result.error : "No fue posible eliminar el producto." });
      return;
    }

    setProducts((current) => current.filter((item) => item.id !== product.id));
    if (editingId === product.id) closeForm();
    setFeedback({ kind: "success", message: "Producto eliminado correctamente." });
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

      {feedback ? <FeedbackBox feedback={feedback} className="mt-6" /> : null}

      <div className="mt-8">
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
                          {getChemicalHazards(product).length || getChemicalWarning(product) ? (
                            <div className="mt-1 flex flex-wrap items-center gap-1.5">
                              {getUniqueChemicalPictograms(getChemicalHazards(product)).slice(0, 3).map((code) => (
                                <ChemicalHazardPictogram key={code} code={code} size="sm" className="size-6" />
                              ))}
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-black text-amber-800">
                                Riesgo químico
                              </span>
                            </div>
                          ) : null}
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

      {isMounted && isFormOpen ? createPortal((
        <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto p-2 py-4 sm:p-4 lg:p-6" role="presentation">
          <button
            type="button"
            aria-label="Cerrar ventana de producto"
            className="absolute inset-0 bg-[#1d0823]/55 backdrop-blur-sm"
            onClick={closeForm}
            disabled={isSaving}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-product-form-title"
            className="relative flex max-h-[calc(100svh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[0_24px_80px_rgba(43,24,48,.28)] sm:max-h-[calc(100svh-3rem)] sm:rounded-[1.7rem]"
          >
            <div className="shrink-0 border-b border-border bg-white/95 p-4 backdrop-blur sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">{editingId ? "Editar producto" : "Nuevo producto"}</p>
                  <h2 id="admin-product-form-title" className="mt-1 text-2xl font-black">{editingId ? form.nombre : "Carga rápida guiada"}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Los campos técnicos se completan solos. Si algo falla, aquí verás en qué paso pasó.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  aria-label="Cerrar"
                  disabled={isSaving}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50"
                >
                  <X className="size-5" />
                </button>
              </div>

              {formFeedback ? <FeedbackBox feedback={formFeedback} className="mt-4" /> : null}
            </div>

            <form className="flex min-h-0 flex-1 flex-col" onSubmit={saveProduct} noValidate>
              <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4 pb-6 sm:p-6">
                <div className="rounded-2xl border border-accent/40 bg-accent/15 p-4 text-sm">
                  <div className="flex gap-3">
                    <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                      <p className="font-black text-foreground">Para productos como el jabón Arial</p>
                      <p className="mt-1 text-muted-foreground">
                        Escribe nombre, descripción y precio. Sube la foto, elige categoría/presentación con clic y aplica sugerencias.
                      </p>
                      <Button type="button" variant="outline" size="sm" className="mt-3 bg-white" onClick={applySuggestedDetails} disabled={isSaving}>
                        <Sparkles /> {suggestion.label}
                      </Button>
                    </div>
                  </div>
                </div>

                <section className="space-y-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.16em] text-primary">1. Datos visibles</p>
                    <p className="mt-1 text-sm text-muted-foreground">Esto es lo que verá el cliente en catálogo y ficha.</p>
                  </div>

                <div className="grid gap-3 sm:grid-cols-[1.2fr_.8fr]">
                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Nombre del producto</span>
                    <Input
                      value={form.nombre}
                      onChange={(event) => updateForm("nombre", event.target.value)}
                      placeholder="Ej: JABÓN LÍQUIDO PARA ROPA (ARIAL)"
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
                </div>

                <label className="block">
                  <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Descripción comercial</span>
                  <textarea
                    value={form.descripcion}
                    onChange={(event) => updateForm("descripcion", event.target.value)}
                    placeholder="Describe para qué sirve y qué beneficio tiene."
                    className="min-h-28 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-ring/10"
                  />
                </label>

                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" />
                    <div>
                      <p className="font-black text-amber-950">Riesgo químico, opcional</p>
                      <p className="mt-1 text-sm leading-6 text-amber-900/80">
                        Selecciona uno o varios riesgos SGA/GHS. El cliente verá sus pictogramas en el catálogo y en la ficha.
                      </p>
                    </div>
                  </div>

                  {selectedChemicalHazards.length ? (
                    <div className="mt-4 rounded-2xl border border-amber-200 bg-white p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        {selectedChemicalPictograms.map((code) => (
                          <ChemicalHazardPictogram key={code} code={code} size="sm" />
                        ))}
                        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-900">
                          {selectedChemicalHazards.length} {selectedChemicalHazards.length === 1 ? "riesgo seleccionado" : "riesgos seleccionados"}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {selectedChemicalHazards.map((hazard) => (
                          <span key={hazard.id} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">
                            {hazard.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="mt-4 rounded-2xl border border-dashed border-amber-200 bg-white/70 px-4 py-3 text-sm font-semibold text-amber-900/75">
                      Sin riesgos químicos seleccionados.
                    </p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="bg-white"
                      onClick={() => setIsHazardPickerOpen(true)}
                      disabled={isSaving}
                    >
                      <AlertTriangle /> {selectedChemicalHazards.length ? "Editar riesgos químicos" : "Añadir riesgo químico"}
                    </Button>
                    {selectedChemicalHazards.length || form.advertenciaQuimica ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearChemicalHazards}
                        disabled={isSaving}
                      >
                        Quitar riesgos
                      </Button>
                    ) : null}
                  </div>
                  <label className="mt-4 block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-amber-900/70">Nota de precaución visible</span>
                    <textarea
                      value={form.advertenciaQuimica}
                      onChange={(event) => updateForm("advertenciaQuimica", event.target.value)}
                      placeholder={defaultChemicalWarning}
                      disabled={isSaving}
                      className="min-h-20 w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-amber-900/45 focus:border-amber-400 focus:ring-4 focus:ring-amber-200/40 disabled:opacity-60"
                    />
                  </label>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">2. Foto del producto</p>
                  <p className="mt-1 text-sm text-muted-foreground">Arrastra la imagen o haz clic para seleccionarla. PNG, JPG o WebP hasta 5 MB.</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
                  <label
                    className={cn(
                      "flex min-h-48 cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/35 bg-primary/5 px-4 py-6 text-center transition hover:border-primary hover:bg-primary/8",
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
                    <UploadCloud className="size-9 text-primary" />
                    <span className="text-sm font-black text-primary">
                      {imageFile ? imageFile.name : "Subir o arrastrar imagen"}
                    </span>
                    <span className="max-w-sm text-xs font-semibold text-muted-foreground">
                      {imageFile ? `${formatFileSize(imageFile.size)} listo para guardar` : "Cuando guardes, se sube a Supabase y se guarda la URL en el producto."}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
                      className="sr-only"
                      onChange={handleImageChange}
                      disabled={isSaving}
                    />
                  </label>

                  <div className="overflow-hidden rounded-2xl border border-border bg-muted">
                    <div className="relative aspect-[4/3]">
                      {previewImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewImage} alt="Vista previa del producto" className="h-full w-full object-contain" />
                      ) : (
                        <div className="flex h-full items-center justify-center px-4 text-center text-sm font-semibold text-muted-foreground">
                          Aquí aparecerá la vista previa.
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-white px-4 py-3 text-xs font-semibold text-muted-foreground">
                      <span>{imageFile ? "Nueva imagen seleccionada" : form.imagen ? "Imagen actual" : "Sin imagen"}</span>
                      {imageFile ? (
                        <button type="button" className="font-black text-primary hover:underline" onClick={() => setImageFile(null)} disabled={isSaving}>
                          Quitar
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">3. Clasificación con clic</p>
                  <p className="mt-1 text-sm text-muted-foreground">Si no estás seguro, usa “Información pendiente”.</p>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
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
                            disabled={isSaving}
                            className={cn(
                              "rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-ring/10 disabled:opacity-60",
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
                      disabled={isSaving}
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
                            disabled={isSaving}
                            className={cn(
                              "rounded-full border px-3.5 py-2 text-sm font-black transition focus:outline-none focus:ring-4 focus:ring-ring/10 disabled:opacity-60",
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
                      disabled={isSaving}
                    />

                    <div className="mt-4 grid gap-2">
                      {[
                        { label: "Visible", description: "Aparece en el catálogo.", selected: form.activo, onClick: () => updateForm("activo", true) },
                        { label: "Guardar sin publicar", description: "Queda oculto al cliente.", selected: !form.activo, onClick: () => updateForm("activo", false) },
                        { label: "Destacado", description: "Resalta el producto.", selected: form.destacado, onClick: () => updateForm("destacado", !form.destacado) },
                        { label: "Información pendiente", description: "Marca datos por completar.", selected: form.informacionPendiente, onClick: () => updateForm("informacionPendiente", !form.informacionPendiente) },
                      ].map((item) => (
                        <button
                          key={item.label}
                          type="button"
                          aria-pressed={item.selected}
                          onClick={item.onClick}
                          disabled={isSaving}
                          className={cn(
                            "rounded-2xl border px-4 py-3 text-left transition focus:outline-none focus:ring-4 focus:ring-ring/10 disabled:opacity-60",
                            item.selected ? "border-primary bg-primary/8 text-primary" : "border-border bg-white hover:bg-primary/5",
                          )}
                        >
                          <span className="font-black">{item.label}</span>
                          <span className="mt-1 block text-xs font-semibold text-muted-foreground">{item.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">4. Detalles opcionales</p>
                  <p className="mt-1 text-sm text-muted-foreground">Si los dejas vacíos, se guardan como “Información pendiente”.</p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Usos visibles</span>
                    <textarea
                      value={form.usos}
                      onChange={(event) => updateForm("usos", event.target.value)}
                      placeholder="Uno por línea"
                      disabled={isSaving}
                      className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-ring/10 disabled:opacity-60"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Características visibles</span>
                    <textarea
                      value={form.caracteristicas}
                      onChange={(event) => updateForm("caracteristicas", event.target.value)}
                      placeholder="Una por línea"
                      disabled={isSaving}
                      className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-ring/10 disabled:opacity-60"
                    />
                  </label>
                </div>

              </section>

              <details className="rounded-2xl border border-border bg-muted/45 p-4">
                <summary className="cursor-pointer text-sm font-black text-primary">Opciones avanzadas, autogeneradas si quedan vacías</summary>
                <div className="mt-4 space-y-4">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">ID interno</span>
                      <Input value={form.id} onChange={(event) => updateForm("id", event.target.value)} readOnly={Boolean(editingId)} disabled={isSaving} />
                      <span className="mt-1 block text-xs font-semibold text-muted-foreground">Si queda vacío, se genera automático.</span>
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Slug URL</span>
                      <Input value={form.slug} onChange={(event) => updateForm("slug", event.target.value)} disabled={isSaving} />
                      <span className="mt-1 block text-xs font-semibold text-muted-foreground">Si queda vacío, se genera desde nombre y presentación.</span>
                    </label>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Stock</span>
                      <Input inputMode="numeric" value={form.stock} onChange={(event) => updateForm("stock", event.target.value.replace(/[^\d]/g, ""))} disabled={isSaving} />
                    </label>
                    <label className="block">
                      <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Orden</span>
                      <Input inputMode="numeric" value={form.orden} onChange={(event) => updateForm("orden", event.target.value.replace(/[^\d-]/g, ""))} disabled={isSaving} />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">URL o ruta de imagen</span>
                    <Input
                      value={form.imagen}
                      onChange={(event) => updateForm("imagen", event.target.value)}
                      placeholder="Se llena automáticamente al subir imagen."
                      disabled={isSaving}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-1 block text-xs font-black uppercase tracking-[.12em] text-muted-foreground">Especificaciones JSON</span>
                    <textarea
                      value={form.especificaciones}
                      onChange={(event) => updateForm("especificaciones", event.target.value)}
                      disabled={isSaving}
                      className="min-h-24 w-full rounded-xl border border-input bg-background px-4 py-3 font-mono text-xs outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-ring/10 disabled:opacity-60"
                    />
                  </label>
                </div>
                </details>
              </div>

              <div className="shrink-0 border-t border-border bg-white/95 p-3 backdrop-blur sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={closeForm} disabled={isSaving}>Cancelar</Button>
                  <Button type="submit" size="lg" disabled={isSaving}>
                    <Save /> {isSaving ? "Guardando..." : "Guardar producto"}
                  </Button>
                </div>
              </div>
            </form>
          </section>
        </div>
      ), document.body) : null}

      {isMounted && isHazardPickerOpen ? createPortal((
        <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto p-2 py-4 sm:p-4 lg:p-6" role="presentation">
          <button
            type="button"
            aria-label="Cerrar selector de riesgos químicos"
            className="absolute inset-0 bg-[#1d0823]/60 backdrop-blur-sm"
            onClick={() => setIsHazardPickerOpen(false)}
            disabled={isSaving}
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="chemical-hazard-picker-title"
            className="relative flex max-h-[calc(100svh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[1.25rem] border border-border bg-white shadow-[0_24px_80px_rgba(43,24,48,.32)] sm:max-h-[calc(100svh-3rem)] sm:rounded-[1.7rem]"
          >
            <div className="shrink-0 border-b border-border bg-white/95 p-4 backdrop-blur sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-primary">SGA / GHS</p>
                  <h2 id="chemical-hazard-picker-title" className="mt-1 text-2xl font-black">Seleccionar riesgos químicos</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                    Marca únicamente los riesgos confirmados para este producto. Puedes seleccionar varios; los pictogramas se mostrarán al cliente.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsHazardPickerOpen(false)}
                  aria-label="Cerrar"
                  disabled={isSaving}
                  className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-primary disabled:opacity-50"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                Este selector es una ayuda visual para comunicar riesgos. No reemplaza la ficha de datos de seguridad ni la clasificación técnica del proveedor.
              </div>

              <div className="mt-5 space-y-6">
                {chemicalHazardGroups.map((group) => {
                  const hazards = chemicalHazards.filter((hazard) => hazard.group === group);

                  return (
                    <section key={group} className="space-y-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[.16em] text-primary">{group}</p>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        {hazards.map((hazard) => {
                          const selected = form.riesgosQuimicos.includes(hazard.id);

                          return (
                            <button
                              key={hazard.id}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => toggleChemicalHazard(hazard.id)}
                              disabled={isSaving}
                              className={cn(
                                "flex gap-4 rounded-2xl border p-4 text-left transition focus:outline-none focus:ring-4 focus:ring-ring/10 disabled:opacity-60",
                                selected ? "border-amber-400 bg-amber-50 shadow-[0_12px_35px_rgba(217,119,6,.10)]" : "border-border bg-white hover:border-amber-300 hover:bg-amber-50/45",
                              )}
                            >
                              <ChemicalHazardPictogram code={hazard.pictogram} label={hazard.label} size="md" />
                              <span>
                                <span className="flex flex-wrap items-center gap-2">
                                  <span className="font-black text-foreground">{hazard.label}</span>
                                  <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-black text-muted-foreground">
                                    {hazard.pictogram}
                                  </span>
                                  {selected ? <CheckCircle2 className="size-4 text-amber-700" /> : null}
                                </span>
                                <span className="mt-1 block text-xs font-black uppercase tracking-[.12em] text-amber-800">
                                  {hazard.pictogramName}
                                </span>
                                <span className="mt-2 block text-sm leading-6 text-muted-foreground">{hazard.description}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <div className="shrink-0 border-t border-border bg-white/95 p-3 backdrop-blur sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-semibold text-muted-foreground">
                  {selectedChemicalHazards.length
                    ? `${selectedChemicalHazards.length} ${selectedChemicalHazards.length === 1 ? "riesgo seleccionado" : "riesgos seleccionados"}`
                    : "Ningún riesgo seleccionado"}
                </p>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" variant="outline" onClick={() => setIsHazardPickerOpen(false)} disabled={isSaving}>
                    Cancelar
                  </Button>
                  <Button type="button" onClick={() => setIsHazardPickerOpen(false)} disabled={isSaving}>
                    Guardar selección
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      ), document.body) : null}
    </section>
  );
}
