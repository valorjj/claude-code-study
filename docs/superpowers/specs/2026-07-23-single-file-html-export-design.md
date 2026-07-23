# Design: single-file interactive HTML export

Date: 2026-07-23

Produce one self-contained `.html` file with the **full** interactive site (dark-mode
toggle, animated diagrams + keyboard controls, search, markdown modal), openable offline
via `file://` — no network, no separate assets.

## Why Vite single-file

The app is already static and CSP-clean (content embedded, no runtime fetch, system fonts).
The only Next coupling is a type-only `import type { Metadata }` in `layout.tsx`, and the only
dynamic import is `import("./mdFiles.json")` (the lazy search index). Both are trivial for a
single-file bundler.

`vite-plugin-singlefile` disables code-splitting and inlines **all** JS, CSS, and dynamic
imports into one HTML — exactly the requirement. Vite is already in this repo's toolchain:
`vitest.config.ts` uses `@vitejs/plugin-react` and the `@ → ./src` alias. So new dependencies
are just `vite` + `vite-plugin-singlefile`; the React plugin and alias pattern already exist.

Rejected alternatives:
- **Next `output: 'export'` + custom inliner** — Turbopack's runtime chunk-loader and the
  dynamic search-index chunk fight single-file inlining; fragile, high-maintenance.
- **esbuild bundle + template** — works, but needs manual glue to inline multiple CSS imports;
  the Vite plugin does this turnkey.

## Components are portable

All section/diagram/provider components are plain React. `"use client"` directives are inert
outside Next (harmless). No `next/image`, `next/link`, `next/font`, or `next/navigation` usage.
Rendered client-side in the single file, the (currently server-rendered) sections behave
identically — they are static JSX.

## Changes

### 1. Extract shared page body (keep section order single-source)

New `src/components/PageBody.tsx` — a plain component returning the current `<main>` subtree
(`ProgressBar`, `Sidebar`, the ordered sections). Both consumers render it:

- `src/app/page.tsx` → `export default function Home() { return <PageBody />; }`
- the Vite entry (below)

This keeps the section order (and its lockstep with `toc.ts`) defined in exactly one place.

CSS ownership stays per-toolchain root (PageBody imports neither, so it's framework-neutral):
Next imports `globals.css` in `layout.tsx` and `page.css` in `page.tsx` (unchanged); the Vite
entry `main.tsx` imports both. One duplicated import line, no style divergence.

### 2. Single-file entry + template (`singlefile/`)

- `singlefile/main.tsx`:
  ```tsx
  import { createRoot } from "react-dom/client";
  import "../src/app/globals.css";
  import "../src/app/page.css";
  import MdModalProvider from "@/components/MdModalProvider";
  import PageBody from "@/components/PageBody";
  createRoot(document.getElementById("root")!).render(
    <MdModalProvider><PageBody /></MdModalProvider>,
  );
  ```
- `singlefile/index.html`: `<html lang="ko">` with `<head>` carrying the `<title>` (from
  `layout.tsx` metadata) and the **exact** no-FOUC theme `<script>` copied from `layout.tsx`,
  then `<body><div id="root"></div><script type="module" src="/main.tsx"></script></body>`.

### 3. Vite config (`vite.singlefile.config.ts`)

Mirror `vitest.config.ts`:
```ts
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  root: "singlefile",
  plugins: [react(), viteSingleFile()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  build: { outDir: "../dist", emptyOutDir: true },
});
```

### 4. Script + gitignore

- `package.json`: `"html": "npm run content && vite build -c vite.singlefile.config.ts"`.
  (Chains content generation so the embedded `mdFiles.json` is fresh — same guarantee as
  `predev`/`prebuild`.)
- `.gitignore`: add `/dist` — the HTML is a **build-only artifact**, not committed (keeps the
  source-of-truth clean; regenerate on demand).

## Risks / watch-items

- **Theme script duplication**: the no-FOUC snippet now lives in both `layout.tsx` and
  `singlefile/index.html`. Acceptable (tiny, static); note it so they stay in sync.
- **First-paint theme in the single file**: the inline `<head>` script runs before the bundle,
  so dark mode is flicker-free the same way it is under Next.
- **File size**: React + app inlined ≈ a few hundred KB (minified). Expected and fine for a
  shareable presentation.

## Verification

- `npm run html` succeeds and emits a single `dist/index.html` with no sibling assets.
- Open `dist/index.html` via `file://` and confirm offline: dark-mode toggle persists, the
  data-flow diagram plays + responds to Space / ←→ / ↑↓ / Esc, the toast narrates, search
  returns results and opens the markdown modal, and no network requests fire (DevTools Network
  tab empty apart from the document).
- `npm run build` (Next) and `npm run test` still pass — the `PageBody` extraction must not
  change the live site.
