import type { Product } from "@/lib/product-types";

export const chemicalWarningSpecLabel = "Advertencia química";
export const chemicalHazardsSpecLabel = "Riesgos químicos";
export const defaultChemicalWarning =
  "Manipular con precaución. Usar equipo de protección personal adecuado y consultar la ficha de seguridad antes de usar.";

export const chemicalHazardGroups = [
  "Peligros físicos",
  "Peligros para la salud",
  "Peligros para el medio ambiente",
] as const;

export type ChemicalHazardGroup = (typeof chemicalHazardGroups)[number];

export type ChemicalPictogramCode =
  | "GHS01"
  | "GHS02"
  | "GHS03"
  | "GHS04"
  | "GHS05"
  | "GHS06"
  | "GHS07"
  | "GHS08"
  | "GHS09";

export const chemicalHazards = [
  {
    id: "explosivos",
    group: "Peligros físicos",
    label: "Explosivos",
    description: "Pueden detonar o proyectar material por calor, impacto, fricción o reacción.",
    pictogram: "GHS01",
    pictogramName: "Bomba explotando",
    aliases: ["explosivo", "bomba explotando"],
  },
  {
    id: "inflamables",
    group: "Peligros físicos",
    label: "Inflamables",
    description: "Gases, aerosoles, líquidos o sólidos que se encienden fácilmente con calor, chispa o llama.",
    pictogram: "GHS02",
    pictogramName: "Llama",
    aliases: ["inflamable", "flamables", "llama"],
  },
  {
    id: "comburentes",
    group: "Peligros físicos",
    label: "Comburentes",
    description: "Pueden liberar oxígeno o intensificar la combustión de otros materiales.",
    pictogram: "GHS03",
    pictogramName: "Llama sobre círculo",
    aliases: ["comburente", "oxidantes", "oxidante", "llama sobre circulo"],
  },
  {
    id: "gases-a-presion",
    group: "Peligros físicos",
    label: "Gases a presión",
    description: "Envases presurizados que pueden explotar con calor o causar quemaduras por frío.",
    pictogram: "GHS04",
    pictogramName: "Botella de gas",
    aliases: ["gas a presion", "gases bajo presion", "botella de gas"],
  },
  {
    id: "corrosivos-para-metales",
    group: "Peligros físicos",
    label: "Corrosivos para metales",
    description: "Sustancias que pueden dañar o destruir metales por corrosión.",
    pictogram: "GHS05",
    pictogramName: "Corrosión",
    aliases: ["corrosivo para metales", "corrosion metales"],
  },
  {
    id: "toxicidad-aguda",
    group: "Peligros para la salud",
    label: "Toxicidad aguda",
    description: "Puede causar daño grave o muerte por ingestión, inhalación o contacto con la piel.",
    pictogram: "GHS06",
    pictogramName: "Calavera y tibias cruzadas",
    aliases: ["toxico", "tóxico", "toxicidad", "calavera"],
  },
  {
    id: "corrosion-cutanea-lesiones-oculares",
    group: "Peligros para la salud",
    label: "Corrosión cutánea / lesiones oculares graves",
    description: "Puede causar quemaduras graves en piel, daño irreversible en ojos o destrucción de tejidos.",
    pictogram: "GHS05",
    pictogramName: "Corrosión",
    aliases: ["corrosion cutanea", "lesiones oculares", "quemaduras"],
  },
  {
    id: "irritacion-cutanea-ocular",
    group: "Peligros para la salud",
    label: "Irritación cutánea / ocular",
    description: "Puede irritar piel, ojos o vías respiratorias; también puede indicar toxicidad nociva menor.",
    pictogram: "GHS07",
    pictogramName: "Signo de exclamación",
    aliases: ["irritante", "irritacion", "signo de exclamacion"],
  },
  {
    id: "peligro-grave-para-la-salud",
    group: "Peligros para la salud",
    label: "Peligro grave para la salud",
    description: "Incluye riesgos crónicos como carcinogenicidad, mutagenicidad, toxicidad reproductiva, órganos diana o aspiración.",
    pictogram: "GHS08",
    pictogramName: "Peligro para la salud",
    aliases: ["carcinogeno", "mutagenico", "toxicidad reproductiva", "organos diana", "aspiracion"],
  },
  {
    id: "peligroso-para-medio-ambiente-acuatico",
    group: "Peligros para el medio ambiente",
    label: "Peligroso para el medio ambiente acuático",
    description: "Puede ser tóxico para organismos acuáticos y causar efectos nocivos duraderos en ecosistemas.",
    pictogram: "GHS09",
    pictogramName: "Medio ambiente",
    aliases: ["medio ambiente", "ambiente acuatico", "toxicidad acuatica"],
  },
] as const;

export type ChemicalHazard = (typeof chemicalHazards)[number];
export type ChemicalHazardId = ChemicalHazard["id"];

const chemicalHazardIds = new Set<ChemicalHazardId>(
  chemicalHazards.map((hazard) => hazard.id),
);

function normalizeSafetyText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .trim();
}

export function isChemicalHazardId(value: string): value is ChemicalHazardId {
  return chemicalHazardIds.has(value as ChemicalHazardId);
}

function matchChemicalHazardId(value: string): ChemicalHazardId | null {
  const normalizedValue = normalizeSafetyText(value);

  for (const hazard of chemicalHazards) {
    const matches = [
      hazard.id,
      hazard.label,
      hazard.pictogram,
      hazard.pictogramName,
      ...hazard.aliases,
    ].some((candidate) => normalizeSafetyText(candidate) === normalizedValue);

    if (matches) return hazard.id;
  }

  return null;
}

export function parseChemicalHazardIds(value: unknown): ChemicalHazardId[] {
  let rawValues: unknown[] = [];

  if (Array.isArray(value)) {
    rawValues = value;
  } else if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      rawValues = Array.isArray(parsed) ? parsed : value.split(/\r?\n|,/);
    } catch {
      rawValues = value.split(/\r?\n|,/);
    }
  }

  const ids = rawValues
    .map((item) => matchChemicalHazardId(String(item)))
    .filter((item): item is ChemicalHazardId => Boolean(item));

  return Array.from(new Set(ids));
}

export function getChemicalHazardsByIds(ids: readonly string[]) {
  const selectedIds = parseChemicalHazardIds([...ids]);
  return chemicalHazards.filter((hazard) => selectedIds.includes(hazard.id));
}

export function getChemicalHazardIds(product: Pick<Product, "especificaciones"> & { riesgosQuimicos?: readonly string[] }) {
  const directHazards = parseChemicalHazardIds(product.riesgosQuimicos);
  if (directHazards.length) return directHazards;

  return parseChemicalHazardIds(product.especificaciones?.[chemicalHazardsSpecLabel]);
}

export function getChemicalHazards(product: Pick<Product, "especificaciones"> & { riesgosQuimicos?: readonly string[] }) {
  return getChemicalHazardsByIds(getChemicalHazardIds(product));
}

export function getUniqueChemicalPictograms(hazards: readonly Pick<ChemicalHazard, "pictogram">[]) {
  return Array.from(new Set(hazards.map((hazard) => hazard.pictogram)));
}

export function getChemicalWarning(product: Pick<Product, "especificaciones"> & { advertenciaQuimica?: string; riesgosQuimicos?: readonly string[] }) {
  const directWarning = product.advertenciaQuimica?.trim();
  if (directWarning) return directWarning;

  const specificationWarning = product.especificaciones?.[chemicalWarningSpecLabel]?.trim();
  if (specificationWarning) return specificationWarning;

  return getChemicalHazardIds(product).length ? defaultChemicalWarning : "";
}

export function mergeChemicalWarning(
  specifications: Record<string, string>,
  warning: string,
) {
  return mergeChemicalSafety(
    specifications,
    warning,
    parseChemicalHazardIds(specifications[chemicalHazardsSpecLabel]),
  );
}

export function mergeChemicalSafety(
  specifications: Record<string, string>,
  warning: string,
  hazardIds: readonly string[],
) {
  const nextSpecifications = { ...specifications };
  const cleanWarning = warning.trim();
  const cleanHazardIds = parseChemicalHazardIds([...hazardIds]);

  if (cleanWarning) {
    nextSpecifications[chemicalWarningSpecLabel] = cleanWarning;
  } else {
    delete nextSpecifications[chemicalWarningSpecLabel];
  }

  if (cleanHazardIds.length) {
    nextSpecifications[chemicalHazardsSpecLabel] = JSON.stringify(cleanHazardIds);
  } else {
    delete nextSpecifications[chemicalHazardsSpecLabel];
  }

  return nextSpecifications;
}

export function visibleSpecifications(product: Pick<Product, "especificaciones">) {
  return Object.entries(product.especificaciones ?? {}).filter(
    ([label]) => ![chemicalWarningSpecLabel, chemicalHazardsSpecLabel].includes(label),
  );
}
