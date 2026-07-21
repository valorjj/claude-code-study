# claude-code-study — Developer Guide (CLAUDE.md)

> Read this first every session. This repo is a **living, single-page reference** on
> reusable Claude Code *harness* patterns (Next.js App Router + TypeScript, deployed on
> Vercel). It practices what it documents — so this file is the anchor + task router.

## What this is

A componentized port of a standalone HTML presentation: sidebar + scrollspy, an animated
decision-flow walkthrough, an animated layered-architecture diagram, a request-size flow,
and a Monokai-Pro markdown viewer that opens **real reference files** embedded from the
source project. Content is project-agnostic (a general playbook); `process-governance` is
only a background example.

## Standing rules (do not violate)

1. **Never hand-edit `src/lib/mdFiles.json`.** It is **generated** from `content/` by the
   content pipeline. Edit the file under `content/` (and `content/manifest.json`), then run
   `npm run content`. CI fails if the committed JSON drifts from `content/`.
2. **Styling is global, but co-located.** `src/app/globals.css` holds *only* design tokens +
   element defaults + a few cross-cutting helpers. Component-owned styles live in a plain
   `.css` file next to the component (e.g. `Walkthrough.css`), imported from its `.tsx` —
   **global scope, class names unchanged**, so the cascade is identical to the source doc.
   These are deliberately **not** CSS Modules: many class names are generated in JS/data
   (`PHASE_CLASS`, `L-*` layer colors, `e-*` edge strokes, `case-badge mid`, the
   `js-anim`/`current`/`done`/`hi`/`on` state classes) and section `id`s drive scrollspy +
   TOC anchors — hashing them would break rendering. Keep the look identical when refactoring.
3. **Client vs server**: interactive pieces (`"use client"`) live in `components/diagrams/*`,
   `MdModalProvider`, `Sidebar`, `ProgressBar`, `FileChip`. Sections are server components.
4. **No network at runtime**: content is embedded; do not fetch remote assets/fonts.
5. **Keep it deployable**: `npm run build` must pass; Vercel preset = Next.js, no env vars.

## Start here — task router

| When you're about to… | Do this |
|---|---|
| **add a reference file** (clickable md/code) | drop it under `content/<path>`, add `{key,p}` to `content/manifest.json`, `npm run content`, then reference `key` from a `FileChip`/the docs tree |
| **add / edit a section** | add `components/sections/<Name>.tsx`, register it in `src/app/page.tsx`, add a `{id,label}` to `src/lib/data/toc.ts` (id must equal the `<section id>`) |
| **change the walkthrough / arch / size diagram** | edit data in `src/lib/data/*.ts`; behavior in `components/diagrams/*` + `hooks/useStepper.ts` |
| **change the markdown viewer / copy** | `components/MdModalProvider.tsx` + `lib/mdHighlight.ts` |
| **change search / its index** | matching+ranking in `src/lib/search.ts` (pure); lazy index + query state in `src/hooks/useSearch.ts`; UI in `components/SearchBox.tsx` (+ `.css`). Sections indexed from `TOC`; files from `loadAllMdFiles()` (shared lazy chunk — keeps content out of the initial bundle). |
| **change tokens / global base** | `src/app/globals.css` (tokens + element defaults + shared helpers only) |
| **change a component's styles** | edit the co-located `<Component>.css` next to its `.tsx` (global scope, unchanged class names) |
| **add a rule you keep repeating** | promote it to a test/CI check (see `.github/workflows/ci.yml`) |

## Commands

```bash
npm run dev        # http://localhost:3000 (regenerates content first)
npm run build      # production build (regenerates content first)
npm run content    # regenerate src/lib/mdFiles.json from content/
npm run typecheck  # tsc --noEmit
npm run lint
```
Node ≥ 20 (`.nvmrc` = 22).

## Structure

```
content/            # SSOT for embedded reference files + manifest.json
scripts/build-content.mjs   # content/ -> src/lib/mdFiles.json
src/
├─ app/             layout.tsx · page.tsx (section order) · page.css · globals.css (tokens+base)
├─ components/  Sidebar · ProgressBar · MdModalProvider · FileChip  (+ co-located <Name>.css)
│  ├─ diagrams/ Walkthrough · ArchDiagram · SizeFlow                (+ co-located <Name>.css)
│  └─ sections/ Intro · Example · DocsTree · Architecture · Harness · Sizing ·
│               Quality · Pain · Stuck · Questioning · Adopt        (Architecture/DocsTree/Questioning have .css)
├─ hooks/       useScrollspy · useStepper
└─ lib/         mdHighlight.ts · mdFiles.(ts|json) · data/*.ts
```

## Request-size workflow (mirror the doc)

- **小** direct edit → `npm run typecheck && npm run lint && npm run build` before commit.
- **中** feature/section → follow the router above; keep the section↔toc mapping in sync.
- **大** structural change → sketch it, do it in small commits, lean on Vercel preview deploys.
