import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["content/**", "node_modules/**", ".next/**"],
    // Enables @testing-library/react's automatic afterEach(cleanup) — it only
    // self-registers when it detects a global `afterEach`. Without this, tests
    // that call render() more than once per file (e.g. SearchBox.test.tsx)
    // accumulate DOM nodes across `it` blocks and produce false "multiple
    // elements found" failures.
    globals: true,
  },
});
