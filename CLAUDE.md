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
2. **Styling is global** (`src/app/globals.css`, design tokens + component styles). Keep the
   look identical when refactoring; per-component CSS Modules are welcome *additively*.
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
| **change tokens / global styles** | `src/app/globals.css` |
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
├─ app/             layout.tsx · page.tsx (section order) · globals.css
├─ components/  Sidebar · ProgressBar · MdModalProvider · FileChip
│  ├─ diagrams/ Walkthrough · ArchDiagram · SizeFlow
│  └─ sections/ Intro · Example · DocsTree · Architecture · Harness · Sizing ·
│               Quality · Pain · Stuck · Questioning · Adopt
├─ hooks/       useScrollspy · useStepper
└─ lib/         mdHighlight.ts · mdFiles.(ts|json) · data/*.ts
```

## Request-size workflow (mirror the doc)

- **小** direct edit → `npm run typecheck && npm run lint && npm run build` before commit.
- **中** feature/section → follow the router above; keep the section↔toc mapping in sync.
- **大** structural change → sketch it, do it in small commits, lean on Vercel preview deploys.
