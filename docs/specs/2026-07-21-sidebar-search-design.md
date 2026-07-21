# Sidebar search — design

**Date:** 2026-07-21
**Status:** approved, ready for implementation plan
**Scope:** Tier-3 item #3, reduced to search-only (multi-page routing intentionally dropped).

## Goal

Add a client-side search to the single-page doc **without** changing its deliberate
long-scroll + sidebar-scrollspy UX. The high-value target is the **17 embedded reference
files**: when closed inside the Monokai viewer their text is not reachable by the browser's
Ctrl-F, so search is the only way to find a phrase inside them. Section titles are also
searchable so the sidebar doubles as a jump box.

Non-goals: multi-page routing, full-text search of section *prose* (sections are React
components, not data — only their TOC titles are indexed), fuzzy matching, a `⌘K` overlay.

## Constraints (must hold)

- **Preserve #2 (lazy content).** The 224KB `mdFiles.json` must stay out of the initial
  bundle. Search loads it via the *same* dynamic-import chunk, on first search interaction.
- **Single-page UX unchanged.** No routing; the search box lives in the existing sidebar.
- **Co-located global CSS (#1 convention).** New styles go in `SearchBox.css`, class names
  global and unhashed, imported from `SearchBox.tsx`.
- All existing gates stay green: content-drift, typecheck, lint, tests, build.

## Architecture / components

| Unit | File | Responsibility | Depends on |
|---|---|---|---|
| `runSearch`, `makeExcerpt` | `src/lib/search.ts` | **Pure** matching + ranking + excerpt. No React, no I/O. | — |
| `loadAllMdFiles()` | `src/lib/mdFiles.ts` (add) | Dynamic-import the whole content map (same cached chunk as `loadMdFile`). | `./mdFiles.json` (lazy) |
| `useSearch` | `src/hooks/useSearch.ts` | Query state; lazy-build the index on first input; return ranked results. | `search.ts`, `loadAllMdFiles`, `TOC` |
| `SearchBox` | `src/components/SearchBox.tsx` (+ `.css`) | Input + results list; keyboard nav; activate a result. | `useSearch`, `useMd` |
| `Sidebar` | `src/components/Sidebar.tsx` (edit) | Render `<SearchBox/>` above the TOC `<nav>`. | `SearchBox` |

## Data model

One flat index array of two record kinds, built once and memoized in a ref:

```ts
type SearchRecord =
  | { kind: 'section'; id: string; label: string }
  | { kind: 'file'; key: string; path: string; content: string };

type SearchResult = {
  record: SearchRecord;
  where: 'title' | 'content';   // what matched (drives ranking + excerpt)
  excerpt?: string;             // content matches only: window around first hit
};
```

- **Sections** come from `TOC` (already in the initial bundle) — searchable instantly,
  before the content chunk resolves.
- **Files** come from `loadAllMdFiles()` — added to the index once the chunk lands.

## Indexing / lazy-load sequence

1. Input receives its first `focus` or keystroke → `useSearch` calls `loadAllMdFiles()`.
2. Sections are matched synchronously the whole time (zero latency for title search).
3. When the content chunk resolves, the file records are built once and cached in a ref;
   subsequent queries search sections + files with no further I/O.
4. Chunk cache is shared with `loadMdFile`, so opening the viewer or searching — whichever
   happens first — pays the one-time load, and the other is free.

## Search behavior & ranking

- **Match:** case-insensitive substring. Section → `label`. File → `path` OR `content`.
- **Rank (desc):** (1) section title / file path hit, (2) file content hit. Stable within a
  tier by index order. **Cap: 20 results.**
- **Excerpt (content hits only):** a single-line window (~80 chars) centered on the first
  hit, collapsed whitespace, with the matched substring wrapped in `<mark>`. Rendered via a
  small, escaped builder (no raw HTML injection beyond the single `<mark>` we insert around
  an escaped match — see Error/edge handling).
- **Activate:**
  - section → `location.hash = '#'+id`; `document.getElementById(id)?.scrollIntoView({behavior:'smooth'})`.
  - file → `useMd().open(key)`.
  - then clear the query (results collapse).
- **Keyboard:** `↑`/`↓` move active row (wrapping), `Enter` activates active row, `Esc`
  clears the query and blurs.
- **States:** query present + chunk still loading → a muted "검색 준비 중…" row stands in for
  the file section; no matches → "결과 없음"; empty query → results list hidden entirely.

## Error / edge handling

- **XSS in excerpt.** File contents are arbitrary text rendered as HTML via `<mark>`. The
  excerpt builder HTML-escapes the surrounding text and the matched substring, then inserts
  the literal `<mark>`/`</mark>` tags itself — so no user/content bytes ever reach the DOM
  unescaped. Unit-tested with a payload containing `<script>`.
- **`loadAllMdFiles()` rejects** (chunk fetch fails) → catch, keep section search working,
  show "결과 없음" for files (no crash, no infinite "준비 중").
- **Empty / whitespace query** → `runSearch` returns `[]`.
- **Duplicate substring** → only the first hit drives the excerpt; ranking counts a record
  once.
- **SSR safety.** `SearchBox` is `"use client"`; `location`/`document` touched only in event
  handlers, never at module scope.

## Testing

- `src/lib/__tests__/search.test.ts` (pure, fast):
  - case-insensitive substring match;
  - title/path hit outranks content-only hit;
  - results capped at 20;
  - `makeExcerpt` returns a window around the first hit with the match wrapped;
  - `makeExcerpt` escapes HTML (`<script>` payload stays inert);
  - empty/whitespace query → `[]`;
  - `kind`/`where` preserved.
- `src/components/__tests__/SearchBox.test.tsx`:
  - renders the input;
  - typing a section title (instant, no chunk) shows a result row;
  - `↑`/`↓` moves the active row;
  - `Enter` on a section result sets hash / calls `scrollIntoView`;
  - `Enter` on a file result calls a mocked `useMd().open`;
  - file-content path uses an injected/stubbed index so the test stays synchronous.

## Files touched

New: `src/lib/search.ts`, `src/hooks/useSearch.ts`, `src/components/SearchBox.tsx`,
`src/components/SearchBox.css`, `src/lib/__tests__/search.test.ts`,
`src/components/__tests__/SearchBox.test.tsx`.
Edited: `src/lib/mdFiles.ts` (add `loadAllMdFiles`), `src/components/Sidebar.tsx`
(render `SearchBox`), `CLAUDE.md` (task-router row for search).

## Verification

`npm run typecheck && npm run lint && npm run test && npm run build` all green; the initial
`/` HTML still does not reference the content chunk (grep check, same as #2).
