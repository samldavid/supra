import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceDirectories = ["catalogo", "productos"];
const publicDirectory = path.join(projectRoot, "public", "productos");
const curatedPath = path.join(projectRoot, "src", "data", "products.json");
const generatedPath = path.join(projectRoot, "src", "data", "generated-products.json");
const supportedExtensions = new Set([".png", ".jpg", ".jpeg", ".webp"]);

const pendingLabel = "Información pendiente";
const extractionVersion = 2;

function hashBuffer(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function slugify(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromFilename(filename) {
  return path
    .basename(filename, path.extname(filename))
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("es"));
}

function normalizePrice(raw) {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  const value = Number.parseInt(digits, 10);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function normalizePresentation(number, unit) {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";
  const normalizedUnit = unit.toLocaleLowerCase("es");
  if (normalizedUnit.startsWith("kg")) return `${digits} kg`;
  if (normalizedUnit.startsWith("ml")) return `${digits} ml`;
  if (normalizedUnit === "l" || normalizedUnit.startsWith("litro")) return `${digits} litro${digits === "1" ? "" : "s"}`;
  return `${Number.parseInt(digits, 10)} g`;
}

function cleanName(value) {
  return value
    .replace(/\bPRESENTACI[ÓO]N\b.*$/i, "")
    .replace(/^[-|:;.,\s]+|[-|:;.,\s]+$/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("es")
    .replace(/(^|[\s(])\p{L}/gu, (match) => match.toLocaleUpperCase("es"))
    .replace(/\bTea\b/g, "TEA")
    .replace(/\bQ(\d+)\b/gi, "Q$1")
    .replace(/^Acido\b/, "Ácido")
    .replace(/\bFosforico\b/, "fosfórico");
}

function parseName(lines, filename) {
  const presentationLine = [...lines].reverse().find((line) => /PRESENTACI[ÓO]N/i.test(line));
  if (presentationLine) {
    const candidate = presentationLine.replace(/PRESENTACI[ÓO]N.*$/i, "").trim();
    const letters = candidate.replace(/[^\p{L}]/gu, "");
    const uppercaseRatio = letters.length
      ? [...letters].filter((letter) => letter === letter.toLocaleUpperCase("es")).length / letters.length
      : 0;
    if (letters.length >= 7 && uppercaseRatio > 0.7) return cleanName(candidate);
  }

  const labelLine = lines.find((line) => /^[A-ZÁÉÍÓÚÜÑ0-9 ()%-]{5,}\s*\/\s*\d/i.test(line));
  if (labelLine) {
    const candidate = labelLine.replace(/\s*\/\s*\d.*$/, "");
    if (candidate.replace(/[^\p{L}]/gu, "").length >= 5) return cleanName(candidate);
  }

  return cleanName(titleFromFilename(filename)) || pendingLabel;
}

function parseDescription(lines) {
  const presentationIndex = lines.findLastIndex((line) => /PRESENTACI[ÓO]N/i.test(line));
  if (presentationIndex < 0) return "";

  const fragments = [];
  for (const line of lines.slice(presentationIndex + 1, presentationIndex + 5)) {
    const cleaned = line
      .replace(/[\$S]\s*[\d .]+/g, "")
      .replace(/\b\d[\d.,\s]*\s*(?:kg|g|ml|litros?|l)\b/gi, "")
      .replace(/^[^\p{L}]+/gu, "")
      .replace(/\s+/g, " ")
      .trim();
    if (!cleaned || /^\d+$/.test(cleaned)) continue;
    fragments.push(cleaned);
  }
  return fragments.join(" ").replace(/\s+/g, " ").trim();
}

function parseCharacteristics(text, lines) {
  const firstPrice = text.search(/\$\s*\d[\d\s.]*/);
  const presentationLine = lines.findLast((line) => /PRESENTACI[ÓO]N/i.test(line));
  const end = presentationLine ? text.lastIndexOf(presentationLine) : -1;
  if (firstPrice < 0 || end <= firstPrice) return [];

  const region = text.slice(firstPrice, end).replace(/^.*\n/, "");
  return region
    .split(/\.(?:\s|\n|$)/)
    .map((sentence) => sentence.replace(/\s*\n\s*/g, " ").trim())
    .map((sentence) => {
      const withoutHeader = sentence.replace(/^.*CARACTER[ÍI]STICAS\s*:/iu, "");
      const meaningfulStart = withoutHeader.search(/\b\p{Lu}\p{Ll}{2,}/u);
      return (meaningfulStart >= 0 ? withoutHeader.slice(meaningfulStart) : "")
        .replace(/\b(?:\p{Lu}\s+)+\p{Lu}\b/gu, "")
        .replace(/\bpara y seg formulaciones\b/giu, "para formulaciones")
        .replace(/[“”<>€]/g, "")
        .replace(/\s+-\s+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    })
    .filter((sentence) => sentence.split(/\s+/).length >= 2)
    .filter((sentence) => !/PRESENTACI[ÓO]N|PRECIO/i.test(sentence))
    .slice(-4)
    .map((sentence) => `${sentence}.`);
}

function parseOcr(text, filename, sourceHash) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  const quantityMatches = [...text.matchAll(/\b(\d[\d., ]{0,8})\s*(kg|g|ml|litros?|l)\b/gi)];
  const priceMatches = [...text.matchAll(/\$\s*([\d. ]{3,})/g)];
  const presentacion = quantityMatches.length
    ? normalizePresentation(quantityMatches.at(-1)[1], quantityMatches.at(-1)[2])
    : "";
  const precio = priceMatches.length ? normalizePrice(priceMatches.at(-1)[1]) : null;
  const nombre = parseName(lines, filename);
  const descripcion = parseDescription(lines);
  const caracteristicas = parseCharacteristics(text, lines);
  const baseSlug = slugify(`${nombre} ${presentacion}`) || slugify(titleFromFilename(filename));
  const incomplete = !nombre || nombre === pendingLabel || !presentacion || precio === null || !descripcion || !caracteristicas.length;

  return {
    id: `AUTO-${sourceHash.slice(0, 8).toUpperCase()}`,
    slug: baseSlug || `producto-${sourceHash.slice(0, 8)}`,
    nombre: nombre || pendingLabel,
    categoria: pendingLabel,
    precio,
    presentacion: presentacion || "",
    descripcion,
    usos: [],
    caracteristicas,
    especificaciones: {},
    imagen: "",
    informacionPendiente: true,
    extraccionIncompleta: incomplete,
    extractionVersion,
    textoVisual: text.trim(),
  };
}

async function readJson(filePath, fallback) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(await readFile(filePath, "utf8"));
  } catch {
    return fallback;
  }
}

async function listSourceFiles() {
  const files = [];
  for (const directory of sourceDirectories) {
    const absoluteDirectory = path.join(projectRoot, directory);
    if (!existsSync(absoluteDirectory)) continue;
    for (const entry of await readdir(absoluteDirectory, { withFileTypes: true })) {
      if (!entry.isFile() || !supportedExtensions.has(path.extname(entry.name).toLowerCase())) continue;
      files.push({
        sourceFile: path.posix.join(directory, entry.name),
        absolutePath: path.join(absoluteDirectory, entry.name),
        filename: entry.name,
      });
    }
  }
  return files.sort((a, b) => a.sourceFile.localeCompare(b.sourceFile, "es"));
}

async function buildCuratedHashMap(curatedProducts) {
  const map = new Map();
  for (const product of curatedProducts) {
    const imagePath = path.join(projectRoot, "public", product.imagen.replace(/^\//, ""));
    if (!existsSync(imagePath)) continue;
    map.set(hashBuffer(await readFile(imagePath)), product);
  }
  return map;
}

async function main() {
  const curatedProducts = await readJson(curatedPath, []);
  const previousProducts = await readJson(generatedPath, []);
  const previousBySource = new Map(previousProducts.map((product) => [product.sourceFile, product]));
  const curatedByHash = await buildCuratedHashMap(curatedProducts);
  const sourceFiles = await listSourceFiles();
  const products = [];
  const slugs = new Set();
  const sourceHashes = new Set();
  let worker;
  let detected = 0;

  await mkdir(publicDirectory, { recursive: true });

  for (const source of sourceFiles) {
    const buffer = await readFile(source.absolutePath);
    const sourceHash = hashBuffer(buffer);
    if (sourceHashes.has(sourceHash)) continue;
    sourceHashes.add(sourceHash);
    const previous = previousBySource.get(source.sourceFile);
    const curated = curatedByHash.get(sourceHash);
    let product;

    if (
      previous?.sourceHash === sourceHash
      && (!previous.informacionPendiente || previous.extractionVersion === extractionVersion)
    ) {
      product = { ...previous };
    } else if (curated) {
      product = { ...curated };
    } else {
      worker ??= await import("tesseract.js").then(({ createWorker }) =>
        createWorker("spa", undefined, { cachePath: path.join(projectRoot, ".ocr-cache") }),
      );
      const { data } = await worker.recognize(source.absolutePath);
      product = parseOcr(data.text, source.filename, sourceHash);
      detected += 1;
    }

    let slug = product.slug;
    if (slugs.has(slug)) slug = `${slug}-${sourceHash.slice(0, 6)}`;
    slugs.add(slug);
    const extension = path.extname(source.filename).toLowerCase();
    const outputFilename = `${slug}${extension}`;
    await copyFile(source.absolutePath, path.join(publicDirectory, outputFilename));

    products.push({
      ...product,
      slug,
      imagen: `/productos/${outputFilename}`,
      sourceFile: source.sourceFile,
      sourceHash,
    });
  }

  await worker?.terminate();
  products.sort((a, b) => a.nombre.localeCompare(b.nombre, "es") || a.presentacion.localeCompare(b.presentacion, "es"));
  await writeFile(generatedPath, `${JSON.stringify(products, null, 2)}\n`, "utf8");

  console.log(`[catálogo] ${products.length} productos sincronizados (${detected} tarjetas nuevas o modificadas).`);
}

main().catch((error) => {
  console.error("[catálogo] No fue posible sincronizar las tarjetas.");
  console.error(error);
  process.exitCode = 1;
});
