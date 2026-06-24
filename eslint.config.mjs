import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { realpathSync } from "node:fs";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const nextConfigPath = dirname(realpathSync(join(__dirname, "node_modules", "eslint-config-next")));
const compat = new FlatCompat({
  baseDirectory: __dirname,
  resolvePluginsRelativeTo: nextConfigPath,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "scripts/verify-ui.cjs"] },
];

export default eslintConfig;
