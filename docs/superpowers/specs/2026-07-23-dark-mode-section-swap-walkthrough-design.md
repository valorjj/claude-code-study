# Design: Dark mode, section swap, Walkthrough Playwright step

Date: 2026-07-23

Three independent changes to the single-page reference site. Each is small and can
land in its own commit.

## 1. Walkthrough (실전 예시) — add a Playwright visual-check step

The decision-flow walkthrough is data-driven from `src/lib/data/walkSteps.ts`
(`WALK_STEPS`). It currently ends: `gate` (품질 강제) → `write` (산출물 커밋).

Insert **one new step** between the existing `gate` step and the final `write` step,
reflecting the real practice: for UI-component work, render the component in a real
browser via Playwright and screenshot/eyeball it as the final gate before committing.

New step (phase `gate`):

```ts
{
  phase: "gate",
  phaseLabel: "게이트 · 시각 검증",
  title: "Playwright 브라우저 검증",
  files: ["e2e/search-bar.spec.ts"],
  rationale:
    "실제 브라우저에서 SearchBar 렌더 · 스크린샷으로 시각 확인 → 커밋 전 최종 게이트.",
}
```

- `files` chip `e2e/search-bar.spec.ts` is **not** a key in `mdFiles`, so it renders as a
  plain (non-clickable) chip — consistent with other illustrative paths in the flow.
- No new phase type; reuses `gate` (so `PHASE_CLASS`, CSS, stepper counts all keep working).
- The Walkthrough footer counter ("0 / N") derives from array length automatically.

Only file touched: `src/lib/data/walkSteps.ts`.

## 2. Dark mode toggle

### Tokens (globals.css)

Add a `:root[data-theme="dark"]` override block that redefines the existing `--pap-*` and
`--dia-*` tokens with dark values. This stays within standing rule #2 (globals.css holds
tokens only). Approach:

- Dark surface ramp: `--pap-bg` near-#141317, `--pap-surface`/`--pap-surface-2` slightly
  lighter, `--pap-border` low-contrast; invert the ink ramp (`--pap-ink-900` → near-white
  down to `--pap-ink-300`); keep accents (`--pap-accent*`) roughly the same hue with a
  darker `--pap-accent-soft` tint.
- Diagram category colors (`--dia-*`): keep hues; darken the `-soft` fill tints so text
  stays legible on them.
- Update the top-of-file comment (currently "Light theme only.").

### Hardcoded-color fixes (the ~15 non-token spots)

- **Leave as-is:** `MdModalProvider.css` — the Monokai-Pro markdown viewer is deliberately
  dark and reads correctly in both themes.
- **Fix (would break on dark bg):** `Walkthrough.css` `.phase-req` (#17161B) and
  `SizeFlow.css` `.snode.term` (#17161B) — near-black pill on a dark surface. Add a
  `:root[data-theme="dark"]` override in their co-located CSS to use a legible surface.
- **Audit:** `Questioning.css` `.case-badge.mid/.small` — verify contrast; override only
  if they fail.

### ThemeToggle component

- New `"use client"` component `src/components/ThemeToggle.tsx` + co-located `ThemeToggle.css`.
- Renders a small button (sun/moon glyph via inline SVG or text, no external assets — rule #4).
- On click: toggle `document.documentElement.dataset.theme` between `"light"`/`"dark"`,
  persist to `localStorage["pap-theme"]`, update `aria-pressed`/label.
- On mount: read current `documentElement.dataset.theme` to sync its state.

### No-FOUC init (layout.tsx)

- Add a tiny inline `<script dangerouslySetInnerHTML>` in `layout.tsx` that runs before
  paint: set `documentElement.dataset.theme` from `localStorage["pap-theme"]`, else from
  `window.matchMedia("(prefers-color-scheme: dark)")`. Keeps first paint flicker-free and
  respects system preference on first visit.

### Placement (Sidebar header)

- Mount `<ThemeToggle />` in `Sidebar.tsx` in a flex row with `.toc-brand` (button on the
  right of the brand line). Sidebar is already `"use client"`.

Files touched: `globals.css`, `layout.tsx`, `Sidebar.tsx` + `Sidebar.css` (brand row flex),
new `ThemeToggle.tsx`/`.css`, `Walkthrough.css`, `SizeFlow.css`, possibly `Questioning.css`.

## 3. Section swap — overall flow to front, example down

Move `Architecture` (`id="dataflow"`, 전체 데이터 플로우) to directly after `Intro`, pushing
`Example` (실전 예시) down after it. New order:

`intro → dataflow → example → docs → harness → sizing → quality → pain → stuck → questioning → adopt`

Update **both**, in lockstep (CLAUDE.md rule — TOC id order must match section render order):

- `src/app/page.tsx` — reorder JSX children under `<main>` (and imports for tidiness).
- `src/lib/data/toc.ts` — reorder `TOC` entries to match.

No content or component-internal changes.

## Verification

Per the repo's request-size workflow (each item is 小/中):
`npm run typecheck && npm run lint && npm run test && npm run build`, plus a manual
`npm run dev` pass to confirm the toggle flips cleanly (no FOUC), the diagrams stay legible
in dark mode, the new walkthrough step animates in sequence, and the reordered sections +
scrollspy/TOC still line up.
