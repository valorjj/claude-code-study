"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { hasMdFile, loadMdFile, type MdFile } from "@/lib/mdFiles";
import { highlightMarkdown } from "@/lib/mdHighlight";
import "./MdModalProvider.css";

type Ctx = { open: (key: string) => void };
const MdCtx = createContext<Ctx>({ open: () => {} });

/** Hook to open the Monokai markdown viewer for a given file key. */
export function useMd(): Ctx {
  return useContext(MdCtx);
}

/**
 * Provides the markdown viewer modal (Monokai Pro). Styling comes from the
 * global stylesheet (.md-modal etc.), ported verbatim from the standalone doc.
 */
export default function MdModalProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<MdFile | null>(null);
  const [copied, setCopied] = useState(false);
  // Monotonic token: a later open() (or close()) invalidates an in-flight load,
  // so a fast A→B click never shows A's content once it finally resolves.
  const reqRef = useRef(0);

  const open = useCallback((k: string) => {
    if (!hasMdFile(k)) return;
    setCopied(false);
    const req = ++reqRef.current;
    // First call lazily fetches the ~224KB content chunk; later calls hit cache.
    loadMdFile(k).then((f) => {
      if (req === reqRef.current && f) setFile(f);
    });
  }, []);
  const close = useCallback(() => {
    reqRef.current++; // cancel any in-flight load
    setFile(null);
  }, []);

  useEffect(() => {
    document.body.style.overflow = file ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [file]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    if (file) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, close]);

  const copy = useCallback(async () => {
    if (!file) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(file.c);
      } else {
        const ta = document.createElement("textarea");
        ta.value = file.c;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* ignore */
    }
  }, [file]);

  return (
    <MdCtx.Provider value={{ open }}>
      {children}
      {file && (
        <div
          className="md-modal open"
          role="dialog"
          aria-modal="true"
          aria-label="마크다운 원문"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <div className="md-dialog">
            <div className="md-bar">
              <span className="md-path">{file.p}</span>
              <span className="md-actions">
                <button type="button" className="md-copy" onClick={copy}>
                  {copied ? "복사됨 ✓" : "복사"}
                </button>
                <button type="button" className="md-close" onClick={close}>
                  ✕ 닫기
                </button>
              </span>
            </div>
            <div className="md-body">
              <pre>
                <code dangerouslySetInnerHTML={{ __html: highlightMarkdown(file.c) }} />
              </pre>
            </div>
          </div>
        </div>
      )}
    </MdCtx.Provider>
  );
}
