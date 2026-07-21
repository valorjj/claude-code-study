# Sidebar Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline sidebar search box that finds text across section titles, reference-file paths, and full reference-file contents — without changing the single-page long-scroll UX.

**Architecture:** A pure, React-free matching/ranking core (`src/lib/search.ts`) is consumed by a `useSearch` hook that lazily loads the 224KB content chunk (reusing #2's dynamic import) on first focus and builds the file index once. `SearchBox` renders the input + results and handles activation (section → hash/scroll; file → open the Monokai viewer). It mounts at the top of the existing `Sidebar`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest + @testing-library/react (jsdom). Co-located global CSS.

## Global Constraints

- **Preserve lazy content (#2):** `mdFiles.json` (~224KB) must not enter the initial bundle. Search loads it via the existing shared cache in `src/lib/mdFiles.ts`, on first search focus only.
- **No routing / single-page UX unchanged:** search lives in the sidebar; no new routes.
- **Co-located global CSS (#1):** new styles in `src/components/SearchBox.css`, global scope, class names unhashed, imported from `SearchBox.tsx`. No new hex literals outside allowed files — use `--pap-*` tokens.
- **No OS color emoji** (project rule): use text badges "문서"/"파일", not 📄.
- **SSR-safe:** `SearchBox`/`useSearch` are `"use client"`; touch `window`/`document` only inside event handlers/effects.
- **All gates green:** `npm run typecheck && npm run lint && npm run test && npm run build`.
- Tests use plain assertions (`.toBeTruthy()`, `.textContent`) — the repo has **no** jest-dom setup. Test files live under `__tests__/` (matches existing convention; `vitest` include is `src/**/*.test.{ts,tsx}`).
- Commit identity is already `valorjj` (repo-local git config); push via the `origin` remote (SSH alias `github-valorjj`). Do NOT push inside tasks — the final task pushes once.

---

## File Structure

| File | Responsibility |
|---|---|
| `src/lib/mdFiles.ts` (modify) | Add `loadAllMdFiles()`; refactor `loadMdFile` to reuse it (shared cache). |
| `src/lib/__tests__/mdFiles.test.ts` (create) | Unit-cover `hasMdFile` / `loadAllMdFiles` / `loadMdFile`. |
| `src/lib/search.ts` (create) | Pure types + `runSearch` + `makeExcerpt` (+ internal `escapeHtml`). |
| `src/lib/__tests__/search.test.ts` (create) | Unit tests for the pure core. |
| `src/hooks/useSearch.ts` (create) | Query state; lazy file-index build; returns ranked results. |
| `src/components/SearchBox.tsx` (create) | Input + results list + keyboard nav + activation. |
| `src/components/SearchBox.css` (create) | Co-located global styles. |
| `src/components/__tests__/SearchBox.test.tsx` (create) | Component behavior tests. |
| `src/components/Sidebar.tsx` (modify) | Render `<SearchBox/>` above the TOC `<nav>`. |
| `CLAUDE.md` (modify) | Task-router row for search. |

---

## Task 1: Shared content loader (`loadAllMdFiles`)

**Files:**
- Modify: `src/lib/mdFiles.ts`
- Test: `src/lib/__tests__/mdFiles.test.ts`

**Interfaces:**
- Consumes: existing `KEYS` set, `cache`, `MdFile` type, `import("./mdFiles.json")`.
- Produces: `loadAllMdFiles(): Promise<Record<string, MdFile>>` (resolves the full cached map). `loadMdFile(key): Promise<MdFile | null>` unchanged in signature.

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/mdFiles.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { hasMdFile, loadAllMdFiles, loadMdFile } from "@/lib/mdFiles";
import keys from "@/lib/mdFileKeys.json";

const KEYS = keys as string[];

describe("mdFiles lazy access", () => {
  it("hasMdFile reflects the keys manifest", () => {
    expect(hasMdFile(KEYS[0])).toBe(true);
    expect(hasMdFile("definitely/not/a/key")).toBe(false);
  });

  it("loadAllMdFiles resolves the full map with matching keys", async () => {
    const map = await loadAllMdFiles();
    expect(Object.keys(map).sort()).toEqual([...KEYS].sort());
  });

  it("loadMdFile returns content for a known key and null otherwise", async () => {
    const f = await loadMdFile(KEYS[0]);
    expect(f?.c.length ?? 0).toBeGreaterThan(0);
    expect(await loadMdFile("nope")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/__tests__/mdFiles.test.ts`
Expected: FAIL — `loadAllMdFiles` is not exported.

- [ ] **Step 3: Add `loadAllMdFiles` and refactor `loadMdFile`**

In `src/lib/mdFiles.ts`, replace the existing `loadMdFile` block with:

```ts
/**
 * Lazily load the full embedded-content map. The ~224KB mdFiles.json is a
 * separate async chunk, fetched only on the first call (first modal open OR
 * first search), then cached. Shared by loadMdFile and the search index.
 */
export async function loadAllMdFiles(): Promise<Record<string, MdFile>> {
  if (!cache) {
    const mod = await import("./mdFiles.json");
    cache = (mod.default ?? mod) as Record<string, MdFile>;
  }
  return cache;
}

/**
 * Lazily resolve one embedded file's content (via the shared cache). Returns
 * null for unknown keys.
 */
export async function loadMdFile(key: string): Promise<MdFile | null> {
  if (!KEYS.has(key)) return null;
  const map = await loadAllMdFiles();
  return map[key] ?? null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/__tests__/mdFiles.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/mdFiles.ts src/lib/__tests__/mdFiles.test.ts
git commit -m "refactor(content): add loadAllMdFiles shared loader (for search index)"
```

---

## Task 2: Pure search core (`search.ts`)

**Files:**
- Create: `src/lib/search.ts`
- Test: `src/lib/__tests__/search.test.ts`

**Interfaces:**
- Consumes: `MdFile` type (for docs only; records are plain objects).
- Produces:
  - `type SearchRecord = { kind:"section"; id:string; label:string } | { kind:"file"; key:string; path:string; content:string }`
  - `type SearchResult = { record: SearchRecord; where:"title"|"content"; excerpt?: string }`
  - `runSearch(records: SearchRecord[], query: string, limit?: number): SearchResult[]` (default limit 20)
  - `makeExcerpt(content: string, query: string, radius?: number): string`

- [ ] **Step 1: Write the failing test**

Create `src/lib/__tests__/search.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { makeExcerpt, runSearch, type SearchRecord } from "@/lib/search";

const recs: SearchRecord[] = [
  { kind: "section", id: "pain", label: "페인 포인트 → 해결" },
  { kind: "section", id: "stuck", label: "막혔을 때 · 세션 관리" },
  { kind: "file", key: "CLAUDE.md", path: "CLAUDE.md", content: "worklog and compact often" },
  { kind: "file", key: "mem", path: "memory/MEMORY.md", content: "the compact technique lives here" },
];

describe("runSearch", () => {
  it("returns nothing for an empty/whitespace query", () => {
    expect(runSearch(recs, "   ")).toEqual([]);
  });

  it("matches a section title case-insensitively", () => {
    const r = runSearch(recs, "세션");
    expect(r).toHaveLength(1);
    expect(r[0].record.kind).toBe("section");
    expect(r[0].where).toBe("title");
  });

  it("ranks title/path hits before content-only hits", () => {
    const withPath = runSearch(
      [...recs, { kind: "file", key: "c", path: "compact-notes.md", content: "x" }],
      "compact",
    );
    expect(withPath[0].where).toBe("title");
    expect(withPath.some((x) => x.where === "content")).toBe(true);
  });

  it("caps results at the limit", () => {
    const many: SearchRecord[] = Array.from({ length: 30 }, (_, i) => ({
      kind: "file", key: `k${i}`, path: `f${i}.md`, content: "zzz",
    }));
    expect(runSearch(many, "f", 20)).toHaveLength(20);
  });

  it("adds an excerpt for content-only file hits", () => {
    const r = runSearch(recs, "worklog");
    expect(r[0].record.kind).toBe("file");
    expect(r[0].where).toBe("content");
    expect(r[0].excerpt).toContain("<mark>worklog</mark>");
  });
});

describe("makeExcerpt", () => {
  it("wraps the first hit in <mark> (case-preserving)", () => {
    expect(makeExcerpt("hello WORLD hello", "world")).toContain("<mark>WORLD</mark>");
  });

  it("escapes HTML so payloads stay inert", () => {
    const ex = makeExcerpt("before <script>alert(1)</script> after", "script");
    expect(ex).not.toContain("<script>");
    expect(ex).toContain("&lt;");
    expect(ex).toContain("<mark>script</mark>");
  });

  it("returns empty string when there is no hit", () => {
    expect(makeExcerpt("abc", "xyz")).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/__tests__/search.test.ts`
Expected: FAIL — cannot resolve `@/lib/search`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/search.ts`:

```ts
// Pure, React-free search over section titles + reference files.
// Consumed by useSearch; kept pure so it is unit-testable in isolation.
// Inputs: an array of SearchRecord + a query string. Output: ranked SearchResult[].

export type SearchRecord =
  | { kind: "section"; id: string; label: string }
  | { kind: "file"; key: string; path: string; content: string };

export type SearchResult = {
  record: SearchRecord;
  where: "title" | "content"; // what matched — drives ranking + excerpt
  excerpt?: string; // content matches only: HTML string with <mark> around the hit
};

const DEFAULT_LIMIT = 20;
const EXCERPT_RADIUS = 40;

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * One-line excerpt centered on the first (case-insensitive) hit, HTML-escaped,
 * with the matched substring wrapped in <mark>. Returns "" if there is no hit.
 * Only the <mark> tags we insert are ever raw HTML — all content bytes are escaped.
 */
export function makeExcerpt(content: string, query: string, radius = EXCERPT_RADIUS): string {
  const q = query.trim();
  if (!q) return "";
  const idx = content.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return "";
  const start = Math.max(0, idx - radius);
  const end = Math.min(content.length, idx + q.length + radius);
  const before = content.slice(start, idx).replace(/\s+/g, " ");
  const match = content.slice(idx, idx + q.length);
  const after = content.slice(idx + q.length, end).replace(/\s+/g, " ");
  const lead = start > 0 ? "… " : "";
  const trail = end < content.length ? " …" : "";
  return `${lead}${escapeHtml(before)}<mark>${escapeHtml(match)}</mark>${escapeHtml(after)}${trail}`;
}

/**
 * Case-insensitive substring search. Ranking (desc): title/path hits, then
 * content-only hits; stable within each tier by input order. Capped at `limit`.
 */
export function runSearch(
  records: SearchRecord[],
  query: string,
  limit = DEFAULT_LIMIT,
): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const title: SearchResult[] = [];
  const content: SearchResult[] = [];
  for (const r of records) {
    if (r.kind === "section") {
      if (r.label.toLowerCase().includes(q)) title.push({ record: r, where: "title" });
      continue;
    }
    if (r.path.toLowerCase().includes(q)) {
      title.push({ record: r, where: "title" });
    } else if (r.content.toLowerCase().includes(q)) {
      content.push({ record: r, where: "content", excerpt: makeExcerpt(r.content, query) });
    }
  }
  return [...title, ...content].slice(0, limit);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/__tests__/search.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/search.ts src/lib/__tests__/search.test.ts
git commit -m "feat(search): pure matching/ranking core (runSearch + makeExcerpt)"
```

---

## Task 3: `useSearch` hook + `SearchBox` component

**Files:**
- Create: `src/hooks/useSearch.ts`
- Create: `src/components/SearchBox.tsx`
- Create: `src/components/SearchBox.css`
- Test: `src/components/__tests__/SearchBox.test.tsx`

**Interfaces:**
- Consumes: `runSearch`, `SearchRecord`, `SearchResult` (Task 2); `loadAllMdFiles` (Task 1); `TOC` (`src/lib/data/toc.ts`); `useMd` (`src/components/MdModalProvider.tsx`).
- Produces:
  - `useSearch(): { query: string; setQuery: (v: string) => void; results: SearchResult[]; loading: boolean; ensureFiles: () => void }`
  - `SearchBox` (default export React component; no props).

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/SearchBox.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import SearchBox from "@/components/SearchBox";
import MdModalProvider from "@/components/MdModalProvider";

beforeEach(() => {
  window.location.hash = "";
});

describe("SearchBox", () => {
  it("shows a section result when typing a section title (no file load)", () => {
    render(<SearchBox />);
    fireEvent.change(screen.getByLabelText("검색"), { target: { value: "질문" } });
    expect(screen.getByText("질문 설계 · 3가지 케이스")).toBeTruthy();
  });

  it("renders results as options", () => {
    render(<SearchBox />);
    fireEvent.change(screen.getByLabelText("검색"), { target: { value: "관리" } });
    expect(screen.getAllByRole("option").length).toBeGreaterThan(0);
  });

  it("Enter on a section result sets the location hash", () => {
    render(<SearchBox />);
    const input = screen.getByLabelText("검색");
    fireEvent.change(input, { target: { value: "질문" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(window.location.hash).toBe("#questioning");
  });

  it("Enter on a file result opens the Monokai viewer", async () => {
    render(
      <MdModalProvider>
        <SearchBox />
      </MdModalProvider>,
    );
    const input = screen.getByLabelText("검색");
    fireEvent.focus(input); // triggers lazy file-index load
    fireEvent.change(input, { target: { value: "CLAUDE.md" } });
    await screen.findByText("CLAUDE.md"); // file row appears once chunk loads
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(document.querySelector(".md-path")?.textContent).toBe("CLAUDE.md");
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/components/__tests__/SearchBox.test.tsx`
Expected: FAIL — cannot resolve `@/components/SearchBox`.

- [ ] **Step 3: Write the hook**

Create `src/hooks/useSearch.ts`:

```ts
"use client";
// Owns search query state + the lazily-built search index.
// Sections come from TOC (instant, always in the bundle); files come from
// loadAllMdFiles() (the shared 224KB chunk), fetched on first ensureFiles() call.
// Depends on: search.ts (pure), mdFiles.ts (lazy loader), toc.ts. SSR-safe.
import { useCallback, useMemo, useRef, useState } from "react";
import { TOC } from "@/lib/data/toc";
import { loadAllMdFiles } from "@/lib/mdFiles";
import { runSearch, type SearchRecord, type SearchResult } from "@/lib/search";

const SECTION_RECORDS: SearchRecord[] = TOC.map((t) => ({
  kind: "section",
  id: t.id,
  label: t.label,
}));

export function useSearch(): {
  query: string;
  setQuery: (v: string) => void;
  results: SearchResult[];
  loading: boolean;
  ensureFiles: () => void;
} {
  const [query, setQuery] = useState("");
  const [fileReady, setFileReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const fileRecordsRef = useRef<SearchRecord[]>([]);
  const startedRef = useRef(false);

  const ensureFiles = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    loadAllMdFiles()
      .then((map) => {
        fileRecordsRef.current = Object.entries(map).map(([key, f]) => ({
          kind: "file",
          key,
          path: f.p,
          content: f.c,
        }));
        setFileReady(true);
      })
      .catch(() => setFailed(true));
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    return runSearch([...SECTION_RECORDS, ...fileRecordsRef.current], query);
    // fileReady is a dependency so results recompute once file records land.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, fileReady]);

  const loading = query.trim().length > 0 && !fileReady && !failed;

  return { query, setQuery, results, loading, ensureFiles };
}
```

- [ ] **Step 4: Write the component**

Create `src/components/SearchBox.tsx`:

```tsx
"use client";
// Sidebar search box: input + results list + keyboard nav + activation.
// Section result -> set location.hash + smooth-scroll; file result -> open the
// Monokai viewer via useMd(). Lazy file index loads on first focus (ensureFiles).
// Depends on: useSearch, useMd, SearchBox.css. SSR-safe (window/document only in handlers).
import { useEffect, useState } from "react";
import { useSearch } from "@/hooks/useSearch";
import { useMd } from "./MdModalProvider";
import type { SearchResult } from "@/lib/search";
import "./SearchBox.css";

function activate(r: SearchResult, open: (k: string) => void): void {
  if (r.record.kind === "section") {
    const { id } = r.record;
    window.location.hash = `#${id}`;
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  } else {
    open(r.record.key);
  }
}

export default function SearchBox() {
  const { query, setQuery, results, loading, ensureFiles } = useSearch();
  const { open } = useMd();
  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [query, results.length]);

  const show = query.trim().length > 0;

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      setQuery("");
      e.currentTarget.blur();
      return;
    }
    if (!results.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) {
        activate(r, open);
        setQuery("");
      }
    }
  }

  return (
    <div className="search">
      <input
        className="search-input"
        type="search"
        placeholder="검색… (문서 · 파일)"
        aria-label="검색"
        value={query}
        onFocus={ensureFiles}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {show && (
        <ul className="search-results" role="listbox" aria-label="검색 결과">
          {results.map((r, i) => {
            const isSection = r.record.kind === "section";
            const rowKey = isSection ? `s:${r.record.id}` : `f:${r.record.key}`;
            const label = isSection ? r.record.label : r.record.path;
            return (
              <li
                key={rowKey}
                role="option"
                aria-selected={i === active}
                className={`search-hit${i === active ? " active" : ""}${isSection ? "" : " is-file"}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  activate(r, open);
                  setQuery("");
                }}
              >
                <span className="search-kind">{isSection ? "문서" : "파일"}</span>
                <span className="search-label">{label}</span>
                {r.excerpt && (
                  <span
                    className="search-excerpt"
                    dangerouslySetInnerHTML={{ __html: r.excerpt }}
                  />
                )}
              </li>
            );
          })}
          {loading && <li className="search-note">검색 준비 중…</li>}
          {!loading && results.length === 0 && <li className="search-note">결과 없음</li>}
        </ul>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Write the styles**

Create `src/components/SearchBox.css`:

```css
/* Sidebar search box. Co-located with SearchBox.tsx (global scope, unhashed
   class names — matches the co-located-CSS convention). Tokens only, no new hex. */
.search { margin-bottom:16px; }
.search-input { width:100%; box-sizing:border-box; font:500 var(--pap-fs-small)/1.3 var(--font-sans);
  color:var(--pap-ink-900); background:var(--pap-surface); border:1px solid var(--pap-border);
  border-radius:8px; padding:8px 11px; outline:none; }
.search-input:focus { border-color:var(--pap-accent); background:var(--pap-bg); box-shadow:0 0 0 3px var(--pap-accent-soft); }
.search-input::placeholder { color:var(--pap-ink-300); }

.search-results { list-style:none; margin:8px 0 0; padding:4px; border:1px solid var(--pap-border);
  border-radius:8px; background:var(--pap-bg); max-height:52vh; overflow-y:auto; }
.search-hit { display:grid; grid-template-columns:auto 1fr; gap:2px 8px; align-items:baseline;
  padding:7px 8px; border-radius:6px; cursor:pointer; }
.search-hit.active { background:var(--pap-accent-soft); }
.search-kind { grid-row:1; font:700 .62rem/1 var(--font-sans); letter-spacing:.04em; color:var(--pap-ink-500);
  background:var(--pap-surface); border:1px solid var(--pap-border); border-radius:4px; padding:3px 5px; }
.search-hit.active .search-kind { color:var(--pap-accent-strong); border-color:var(--pap-accent); }
.search-label { grid-row:1; font-size:var(--pap-fs-small); color:var(--pap-ink-900); word-break:break-word; }
.search-hit.is-file .search-label { font-family:var(--font-mono); font-size:.78rem; }
.search-excerpt { grid-column:2; grid-row:2; font-size:.74rem; color:var(--pap-ink-500); line-height:1.5;
  overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.search-excerpt mark { background:var(--pap-accent-soft); color:var(--pap-accent-strong); border-radius:3px; padding:0 2px; }
.search-note { padding:8px; font-size:var(--pap-fs-small); color:var(--pap-ink-500); text-align:center; }
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm run test -- src/components/__tests__/SearchBox.test.tsx`
Expected: PASS (4 tests).

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useSearch.ts src/components/SearchBox.tsx src/components/SearchBox.css src/components/__tests__/SearchBox.test.tsx
git commit -m "feat(search): useSearch hook + SearchBox component (lazy file index)"
```

---

## Task 4: Wire into Sidebar, document, verify end-to-end

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `CLAUDE.md`

**Interfaces:**
- Consumes: `SearchBox` (Task 3, default export).
- Produces: none (integration).

- [ ] **Step 1: Render `SearchBox` in the sidebar**

In `src/components/Sidebar.tsx`, add the import after the existing imports:

```tsx
import SearchBox from "./SearchBox";
```

Then insert `<SearchBox />` between the sub-brand div and `<nav>`:

```tsx
      <div className="toc-sub-brand">프로젝트 무관 · 재사용 가능한 harness 요약</div>
      <SearchBox />
      <nav>
```

- [ ] **Step 2: Verify existing page/coverage tests still pass**

Run: `npm run test -- src/app/__tests__/page.test.tsx`
Expected: PASS (page still renders a section per TOC id; SearchBox mounts without error).

- [ ] **Step 3: Add a task-router row to `CLAUDE.md`**

In `CLAUDE.md`, under "## Start here — task router", add this row after the "change the markdown viewer / copy" row:

```markdown
| **change search / its index** | matching+ranking in `src/lib/search.ts` (pure); lazy index + query state in `src/hooks/useSearch.ts`; UI in `components/SearchBox.tsx` (+ `.css`). Sections indexed from `TOC`; files from `loadAllMdFiles()` (shared lazy chunk — keeps content out of the initial bundle). |
```

- [ ] **Step 4: Run the full gate chain**

Run: `npm run typecheck && npm run lint && npm run test && npm run build`
Expected: typecheck clean; lint clean; all tests pass (existing 7 + mdFiles 3 + search 8 + SearchBox 4 = 22); build succeeds.

- [ ] **Step 5: Verify lazy-load (#2) is still intact**

Run:
```bash
grep -o '/_next/static/chunks/[a-z0-9_-]*\.js' .next/server/app/index.html | sort -u > /tmp/init_chunks.txt
node -e "const c=require('./src/lib/mdFiles.json')['CLAUDE.md'].c; const {execSync}=require('child_process'); const f=execSync('grep -rl \"process-governance — Developer Guide\" .next/static/chunks/').toString().trim().split('\n'); console.log('content chunk file(s):', f.map(x=>x.replace('.next/static/chunks/','').replace('.js',''))); const init=require('fs').readFileSync('/tmp/init_chunks.txt','utf8'); const leaked=f.some(x=>init.includes(x.replace('.next/static/chunks/','').replace('.js',''))); console.log(leaked ? 'LEAKED into initial HTML (BAD)' : 'not in initial HTML (GOOD, still lazy)');"
```
Expected: prints "not in initial HTML (GOOD, still lazy)".

- [ ] **Step 6: Commit and push**

```bash
git add src/components/Sidebar.tsx CLAUDE.md
git commit -m "feat(search): mount SearchBox in the sidebar + document"
git push origin main
```

---

## Self-Review notes (author)

- **Spec coverage:** search surface = inline sidebar box (Task 3/4); depth = titles + paths + full contents (Task 2 `runSearch` + Task 3 index); lazy load preserves #2 (Task 1 + Step 5 verify); excerpt + XSS escape (Task 2); ranking + cap 20 (Task 2); keyboard nav + activation + states (Task 3); testing split pure/component (Tasks 2/3). All covered.
- **Type consistency:** `SearchRecord`/`SearchResult`/`runSearch`/`makeExcerpt`/`loadAllMdFiles`/`useSearch` names identical across tasks.
- **No placeholders:** every code step is complete.
- **Emoji rule:** badges are text ("문서"/"파일"); no color emoji.
```
