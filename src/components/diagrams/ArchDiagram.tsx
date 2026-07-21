"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import "./ArchDiagram.css";
import {
  ARCH_COLUMNS,
  ARCH_EDGES,
  ARCH_STEPS,
  type EdgeType,
} from "@/lib/data/archModel";
import { useStepper } from "@/hooks/useStepper";

const fmtSpeed = (v: number) => (v % 1 === 0 ? v.toFixed(0) : String(v)) + "×";

// nodeId -> column index (for edge routing)
const NODE_COL: Record<string, number> = {};
ARCH_COLUMNS.forEach((c, ci) => c.nodes.forEach((n) => (NODE_COL[n.id] = ci)));

type Pt = { x: number; y: number };

/** Animated layered architecture (Dataflow section). SVG edges computed from node positions. */
export default function ArchDiagram() {
  const s = useStepper(ARCH_STEPS.length, { overview: true });
  const [full, setFull] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [paths, setPaths] = useState<string[]>([]);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  const compute = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const s0 = stage.getBoundingClientRect();
    const anchor = (id: string, side: "l" | "r" | "tp"): Pt | null => {
      const el = nodeRefs.current[id];
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const cx = (r.left + r.right) / 2 - s0.left;
      const y = (r.top + r.bottom) / 2 - s0.top;
      if (side === "r") return { x: r.right - s0.left, y };
      if (side === "l") return { x: r.left - s0.left, y };
      return { x: cx, y: r.top - s0.top }; // tp
    };
    let fb = 0;
    const next: string[] = ARCH_EDGES.map((e) => {
      const fc = NODE_COL[e.from];
      const tc = NODE_COL[e.to];
      const dc = tc - fc;
      if (e.type === "feedback") {
        const a = anchor(e.from, "tp");
        const b = anchor(e.to, "tp");
        if (!a || !b) return "";
        const top = Math.min(a.y, b.y) - 18 - fb++ * 10;
        return `M${a.x},${a.y} C${a.x},${top} ${b.x},${top} ${b.x},${b.y}`;
      }
      if (dc >= 2) {
        const a = anchor(e.from, "tp");
        const b = anchor(e.to, "tp");
        if (!a || !b) return "";
        const top = Math.min(a.y, b.y) - 16;
        return `M${a.x},${a.y} C${a.x},${top} ${b.x},${top} ${b.x},${b.y}`;
      }
      if (dc === 0) {
        const a = anchor(e.from, "r");
        const b = anchor(e.to, "r");
        if (!a || !b) return "";
        const my = (a.y + b.y) / 2;
        return `M${a.x},${a.y} C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
      }
      const a = anchor(e.from, dc > 0 ? "r" : "l");
      const b = anchor(e.to, dc > 0 ? "l" : "r");
      if (!a || !b) return "";
      const mx = (a.x + b.x) / 2;
      return `M${a.x},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`;
    });
    setPaths(next);
    setDims({ w: stage.scrollWidth, h: stage.scrollHeight });
  }, []);

  useLayoutEffect(() => {
    compute();
    const raf = requestAnimationFrame(compute);
    const t = window.setTimeout(compute, 400);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(t);
    };
  }, [compute, full]);

  useEffect(() => {
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [compute]);

  // fullscreen: loop + auto-play from step 1; stop on exit
  const toggleFull = useCallback(() => {
    setFull((prev) => {
      const on = !prev;
      document.body.classList.toggle("arch-full-open", on);
      s.setLoop(on);
      if (on) {
        s.restart();
        window.setTimeout(() => s.play(), 320);
      } else {
        s.pause();
      }
      return on;
    });
  }, [s]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && full) toggleFull();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [full, toggleFull]);

  const activeStep = s.cur > 0 ? ARCH_STEPS[s.cur - 1] : null;
  const activeNodes = new Set(activeStep?.nodes ?? []);
  const activeEdges = new Set(activeStep?.edges ?? []);

  return (
    <div className={`arch-wrap${full ? " fullscreen" : ""}`} id="arch">
      <div className="arch-controls">
        <button type="button" className="arch-play" onClick={s.toggle}>
          {s.playing ? "⏸ 일시정지" : "▶ 재생"}
        </button>
        <button type="button" onClick={s.prev}>◀ 이전</button>
        <button type="button" onClick={s.next}>다음 ▶</button>
        <button type="button" onClick={s.restart}>↻ 처음</button>
        <button type="button" onClick={toggleFull}>{full ? "⤡ 닫기" : "⤢ 크게"}</button>
        <span className="arch-phase">
          {activeStep ? `${s.cur}. ${activeStep.label}` : "전체 보기"}
        </span>
        <label className="walk-speed">
          속도
          <input
            type="range"
            min="0.5"
            max="3"
            step="0.1"
            value={s.speed}
            onChange={(e) => s.setSpeed(parseFloat(e.target.value))}
          />
          <span className="walk-speed-val">{fmtSpeed(s.speed)}</span>
        </label>
        <span className="arch-count">
          {s.cur} / {ARCH_STEPS.length}
        </span>
      </div>
      <div className="arch-stage">
        <div ref={stageRef} className={`arch js-anim${s.cur > 0 ? " stepping" : ""}`}>
          <svg
            className="arch-edges"
            preserveAspectRatio="none"
            width={dims.w}
            height={dims.h}
            viewBox={`0 0 ${dims.w} ${dims.h}`}
          >
            <defs>
              {(
                [
                  ["m-main", "#747376"],
                  ["m-read", "#4c8ff0"],
                  ["m-return", "#a8a8ab"],
                  ["m-gate", "#e08a00"],
                  ["m-write", "#57ab5a"],
                  ["m-feedback", "#3b7fe0"],
                ] as const
              ).map(([id, fill]) => (
                <marker key={id} id={id} markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
                  <path d="M0,0 L6,3 L0,6 z" fill={fill} />
                </marker>
              ))}
            </defs>
            {ARCH_EDGES.map((e, i) => (
              <path
                key={i}
                className={`e-${e.type as EdgeType}${activeEdges.has(i) ? " on" : ""}`}
                d={paths[i] || ""}
                markerEnd={`url(#m-${e.type})`}
              />
            ))}
          </svg>
          {ARCH_COLUMNS.map((col) => (
            <div key={col.key} className={`arch-col ${col.cls}`}>
              <div className="arch-layer">
                <div className="arch-lhead">{col.head}</div>
                <div className="arch-lbody">
                  {col.nodes.map((n) => (
                    <div
                      key={n.id}
                      ref={(el) => {
                        nodeRefs.current[n.id] = el;
                      }}
                      className={`arch-node${activeNodes.has(n.id) ? " hi" : ""}`}
                    >
                      <div className="an-t">{n.title}</div>
                      {n.sub && <div className="an-s">{n.sub}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
