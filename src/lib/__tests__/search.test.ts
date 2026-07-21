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
