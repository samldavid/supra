import type { Product } from "@/lib/product-types";

export const chemicalWarningSpecLabel = "Advertencia química";
export const defaultChemicalWarning =
  "Usar con precaución y con equipo de protección adecuado.";

export function getChemicalWarning(product: Pick<Product, "especificaciones"> & { advertenciaQuimica?: string }) {
  const directWarning = product.advertenciaQuimica?.trim();
  if (directWarning) return directWarning;

  const specificationWarning = product.especificaciones?.[chemicalWarningSpecLabel]?.trim();
  return specificationWarning ?? "";
}

export function mergeChemicalWarning(
  specifications: Record<string, string>,
  warning: string,
) {
  const nextSpecifications = { ...specifications };
  const cleanWarning = warning.trim();

  if (cleanWarning) {
    nextSpecifications[chemicalWarningSpecLabel] = cleanWarning;
  } else {
    delete nextSpecifications[chemicalWarningSpecLabel];
  }

  return nextSpecifications;
}

export function visibleSpecifications(product: Pick<Product, "especificaciones">) {
  return Object.entries(product.especificaciones ?? {}).filter(
    ([label]) => label !== chemicalWarningSpecLabel,
  );
}
