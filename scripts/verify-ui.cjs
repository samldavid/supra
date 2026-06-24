const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("C:/Users/yailt/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/.pnpm/playwright@1.60.0/node_modules/playwright");

async function run() {
  const outputDir = path.join(process.cwd(), ".codex-verify");
  fs.mkdirSync(outputDir, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const results = { consoleErrors: [], pageErrors: [], checks: {} };

  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await desktop.newPage();
  page.on("console", (message) => {
    if (message.type() === "error") results.consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => results.pageErrors.push(error.message));

  await page.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  results.checks.homeTitle = await page.getByRole("heading", { level: 1 }).innerText();
  results.checks.homeHasContent = (await page.locator("body").innerText()).trim().length > 500;
  results.checks.errorOverlay = (await page.locator("[data-nextjs-dialog], .vite-error-overlay").count()) === 0;
  await page.locator("#categorias").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  results.checks.categoryCards = await page.locator('#categorias a[href^="/catalogo?categoria="]').count();
  await page.locator("#nosotros").scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  results.checks.brandImageLoaded = await page
    .getByAltText("Isotipo oficial de SupraQuím")
    .evaluate((image) => image.complete && image.naturalWidth > 0);
  await page.screenshot({ path: path.join(outputDir, "home-desktop.png"), fullPage: true });

  await page.goto("http://127.0.0.1:3000/catalogo", { waitUntil: "networkidle" });
  const search = page.getByPlaceholder("Busca por nombre, uso, categoría…");
  await search.fill("Texapon");
  await page.waitForTimeout(400);
  results.checks.catalogSearch = await page.getByText("Texapon 70", { exact: true }).count();
  results.checks.filteredCount = await page.getByText("1 producto encontrado", { exact: false }).count();
  await page.screenshot({ path: path.join(outputDir, "catalog-search.png"), fullPage: true });

  await page.goto("http://127.0.0.1:3000/catalogo/texapon-70-1000g", { waitUntil: "networkidle" });
  results.checks.productTitle = await page.getByRole("heading", { level: 1 }).innerText();
  await page.getByRole("button", { name: "Ampliar imagen del producto" }).click();
  results.checks.zoomDialogOpen = await page.locator("dialog[open]").count();
  await page.screenshot({ path: path.join(outputDir, "product-zoom.png"), fullPage: false });
  await page.getByRole("button", { name: "Cerrar imagen ampliada" }).click();
  await desktop.close();

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const mobilePage = await mobile.newPage();
  mobilePage.on("console", (message) => {
    if (message.type() === "error") results.consoleErrors.push(message.text());
  });
  mobilePage.on("pageerror", (error) => results.pageErrors.push(error.message));
  await mobilePage.goto("http://127.0.0.1:3000", { waitUntil: "networkidle" });
  await mobilePage.getByRole("button", { name: "Abrir menú" }).click();
  results.checks.mobileMenu = await mobilePage.getByRole("navigation", { name: "Navegación móvil" }).count();
  await mobilePage.screenshot({ path: path.join(outputDir, "home-mobile.png"), fullPage: false });
  await mobilePage.getByRole("button", { name: "Cerrar menú" }).click();
  await mobilePage.locator("#categorias").scrollIntoViewIfNeeded();
  await mobilePage.waitForTimeout(500);
  results.checks.mobileCategoriesVisible = await mobilePage
    .locator('#categorias a[href^="/catalogo?categoria="]')
    .first()
    .isVisible();
  await mobilePage.locator("#categorias").screenshot({ path: path.join(outputDir, "categories-mobile.png") });
  await mobile.close();

  await browser.close();
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
