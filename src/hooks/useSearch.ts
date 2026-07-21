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
  // File records live in state (not a ref) so useMemo can depend on them
  // directly — reading a ref's `.current` during render is unsound (the
  // react-hooks/refs lint rule flags it) since it isn't part of React's
  // render-tracked state.
  const [fileRecords, setFileRecords] = useState<SearchRecord[]>([]);
  const [fileReady, setFileReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);

  const ensureFiles = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    loadAllMdFiles()
      .then((map) => {
        setFileRecords(
          Object.entries(map).map(([key, f]) => ({
            kind: "file",
            key,
            path: f.p,
            content: f.c,
          })),
        );
        setFileReady(true);
      })
      .catch(() => setFailed(true));
  }, []);

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    return runSearch([...SECTION_RECORDS, ...fileRecords], query);
  }, [query, fileRecords]);

  const loading = query.trim().length > 0 && !fileReady && !failed;

  return { query, setQuery, results, loading, ensureFiles };
}
