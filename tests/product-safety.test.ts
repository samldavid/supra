import assert from "node:assert/strict";
import test from "node:test";

import {
  chemicalHazardsSpecLabel,
  chemicalWarningSpecLabel,
  defaultChemicalWarning,
  getChemicalHazards,
  getChemicalWarning,
  getUniqueChemicalPictograms,
  mergeChemicalSafety,
  mergeChemicalWarning,
  parseChemicalHazardIds,
  publicChemicalCautionText,
  visibleSpecifications,
} from "../src/lib/product-safety.ts";

test("lee la advertencia química desde especificaciones", () => {
  const warning = getChemicalWarning({
    especificaciones: {
      [chemicalWarningSpecLabel]: defaultChemicalWarning,
    },
  });

  assert.equal(warning, defaultChemicalWarning);
});

test("agrega y elimina la advertencia sin perder otras especificaciones", () => {
  const base = { Tipo: "Materia prima" };
  const withWarning = mergeChemicalWarning(base, defaultChemicalWarning);

  assert.deepEqual(withWarning, {
    Tipo: "Materia prima",
    [chemicalWarningSpecLabel]: defaultChemicalWarning,
  });

  const withoutWarning = mergeChemicalWarning(withWarning, "");
  assert.deepEqual(withoutWarning, { Tipo: "Materia prima" });
});

test("oculta la advertencia de la tabla pública de especificaciones", () => {
  const entries = visibleSpecifications({
    especificaciones: {
      Tipo: "Jabón líquido",
      [chemicalWarningSpecLabel]: defaultChemicalWarning,
    },
  });

  assert.deepEqual(entries, [["Tipo", "Jabón líquido"]]);
});

test("guarda y lee varios riesgos químicos con pictogramas GHS", () => {
  const specifications = mergeChemicalSafety(
    { Tipo: "Materia prima" },
    "",
    ["inflamables", "comburentes", "irritacion-cutanea-ocular"],
  );

  const hazards = getChemicalHazards({ especificaciones: specifications });
  const pictograms = getUniqueChemicalPictograms(hazards);

  assert.deepEqual(hazards.map((hazard) => hazard.id), [
    "inflamables",
    "comburentes",
    "irritacion-cutanea-ocular",
  ]);
  assert.deepEqual(pictograms, ["GHS02", "GHS03", "GHS07"]);
});

test("normaliza nombres visibles de riesgos y no duplica pictogramas repetidos", () => {
  const ids = parseChemicalHazardIds("Corrosivos para metales, Corrosión cutánea / lesiones oculares graves");
  const pictograms = getUniqueChemicalPictograms(getChemicalHazards({ riesgosQuimicos: ids, especificaciones: {} }));

  assert.deepEqual(ids, ["corrosivos-para-metales", "corrosion-cutanea-lesiones-oculares"]);
  assert.deepEqual(pictograms, ["GHS05"]);
});

test("oculta los riesgos químicos de la tabla pública de especificaciones", () => {
  const entries = visibleSpecifications({
    especificaciones: {
      Tipo: "Jabón líquido",
      [chemicalHazardsSpecLabel]: JSON.stringify(["inflamables"]),
    },
  });

  assert.deepEqual(entries, [["Tipo", "Jabón líquido"]]);
});

test("el texto público de precaución evita mensajes alarmistas", () => {
  const publicText = publicChemicalCautionText.toLocaleLowerCase("es");

  assert.match(publicText, /precaución/);
  assert.doesNotMatch(publicText, /muerte|cancer|cáncer|daño grave|toxicidad aguda/);
});
