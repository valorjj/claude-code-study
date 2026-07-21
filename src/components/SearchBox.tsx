"use client";
// Sidebar search box: input + results list + keyboard nav + activation.
// Section result -> set location.hash + smooth-scroll; file result -> open the
// Monokai viewer via useMd(). Lazy file index loads on first focus (ensureFiles).
// Depends on: useSearch, useMd, SearchBox.css. SSR-safe (window/document only in handlers).
import { useState } from "react";
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
  // Reset the active index when the result set changes (new query, or the
  // file index landing mid-query). Done during render — not a useEffect —
  // per React's "adjusting state when a prop changes" pattern: this is
  // derived state, and setState-in-effect would cause an extra render pass.
  const [resetKey, setResetKey] = useState({ query, len: results.length });
  if (resetKey.query !== query || resetKey.len !== results.length) {
    setResetKey({ query, len: results.length });
    setActive(0);
  }

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
            const rowKey = r.record.kind === "section" ? `s:${r.record.id}` : `f:${r.record.key}`;
            const label = r.record.kind === "section" ? r.record.label : r.record.path;
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
