import { spawn } from "node:child_process";
import { existsSync, watch } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const syncScript = path.join(projectRoot, "scripts", "sync-products.mjs");
const nextCli = path.join(projectRoot, "node_modules", "next", "dist", "bin", "next");
const watchedDirectories = ["catalogo", "productos"]
  .map((directory) => path.join(projectRoot, directory))
  .filter(existsSync);

function run(command, args, options = {}) {
  return spawn(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    ...options,
  });
}

function waitFor(child) {
  return new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`Proceso finalizado con código ${code}`)));
  });
}

await waitFor(run(process.execPath, [syncScript]));

const nextProcess = run(process.execPath, [nextCli, "dev", "--turbopack"]);
const watchers = [];
let debounceTimer;
let syncing = false;
let syncAgain = false;

async function synchronize() {
  if (syncing) {
    syncAgain = true;
    return;
  }
  syncing = true;
  try {
    await waitFor(run(process.execPath, [syncScript]));
  } catch (error) {
    console.error("[catálogo] La actualización automática falló; se reintentará con el próximo cambio.");
    console.error(error);
  } finally {
    syncing = false;
    if (syncAgain) {
      syncAgain = false;
      void synchronize();
    }
  }
}

for (const directory of watchedDirectories) {
  watchers.push(watch(directory, { persistent: true }, () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void synchronize(), 350);
  }));
}

function shutdown(signal) {
  clearTimeout(debounceTimer);
  for (const watcher of watchers) watcher.close();
  nextProcess.kill(signal);
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
nextProcess.once("exit", (code) => {
  for (const watcher of watchers) watcher.close();
  process.exitCode = code ?? 0;
});
