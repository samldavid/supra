import assert from "node:assert/strict";
import test from "node:test";

import {
  chemicalWarningSpecLabel,
  defaultChemicalWarning,
  getChemicalWarning,
  mergeChemicalWarning,
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
