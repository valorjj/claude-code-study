"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { SIZE_BRANCHES } from "@/lib/data/sizeModel";

type Pt = { x: number; y: number };

/** Request-size decision flow (Sizing section). Clean HTML, SVG arrows computed to fit. */
export default function SizeFlow() {
  const sfRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<HTMLDivElement>(null);
  const decRef = useRef<HTMLDivElement>(null);
  const gateRef = useRef<HTMLDivElement>(null);
  const brRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [paths, setPaths] = useState<string[]>([]);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const compute = useCallback(() => {
    const sf = sfRef.current;
    if (!sf) return;
    const s0 = sf.getBoundingClientRect();
    const A = (el: HTMLElement | null, side: "l" | "r"): Pt | null => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const y = (r.top + r.bottom) / 2 - s0.top;
      return { x: (side === "r" ? r.right : r.left) - s0.left, y };
    };
    const cur = (a: Pt, b: Pt) => {
      const mx = (a.x + b.x) / 2;
      return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
    };
    const start = A(startRef.current, "r");
    const decL = A(decRef.current, "l");
    const decR = A(decRef.current, "r");
    const gate = A(gateRef.current, "l");
    const next: string[] = [];
    if (start && decL) next.push(cur(start, decL));
    brRefs.current.forEach((b) => {
      const bl = A(b, "l");
      const br = A(b, "r");
      if (decR && bl) next.push(cur(decR, bl));
      if (br && gate) next.push(cur(br, gate));
    });
    setPaths(next);
    setDims({ w: sf.scrollWidth, h: sf.scrollHeight });
  }, []);

  useLayoutEffect(() => {
    compute();
    const raf = requestAnimationFrame(compute);
    const t = window.setTimeout(compute, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [compute]);

  useEffect(() => {
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [compute]);

  return (
    <div className="sflow" ref={sfRef}>
      <svg
        className="sflow-edges"
        width={dims.w}
        height={dims.h}
        viewBox={`0 0 ${dims.w} ${dims.h}`}
      >
        <defs>
          <marker id="s-arrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M0,0 L6,3 L0,6 z" fill="#b8b8bb" />
          </marker>
        </defs>
        {paths.map((d, i) => (
          <path key={i} d={d} markerEnd="url(#s-arrow)" />
        ))}
      </svg>
      <div className="scol">
        <div className="snode term" ref={startRef}>요청</div>
      </div>
      <div className="scol">
        <div className="snode dec" ref={decRef}>범위?</div>
      </div>
      <div className="scol">
        {SIZE_BRANCHES.map((b, i) => (
          <div
            key={i}
            className="sbranch"
            ref={(el) => {
              brRefs.current[i] = el;
            }}
          >
            <span className={`sbadge ${b.cls}`}>{b.badge}</span>
            <div>
              <div className="sbr-t">{b.title}</div>
              <div className="sbr-s">{b.trigger}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="scol">
        <div className="snode gate" ref={gateRef}>게이트 통과 → commit</div>
      </div>
    </div>
  );
}
