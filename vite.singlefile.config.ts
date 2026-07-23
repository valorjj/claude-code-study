import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * Builds the whole interactive site into ONE self-contained dist/index.html
 * (all JS + CSS + the dynamic mdFiles.json import inlined, no sibling assets).
 * Run via `npm run html`. Mirrors vitest.config.ts's react() + `@` alias so the
 * same components/imports resolve identically.
 */
export default defineConfig({
  root: "singlefile",
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
