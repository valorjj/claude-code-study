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
