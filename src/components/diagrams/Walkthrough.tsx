"use client";
import { PHASE_CLASS, WALK_STEPS } from "@/lib/data/walkSteps";
import { useStepper } from "@/hooks/useStepper";
import FileChip from "../FileChip";

const fmtSpeed = (v: number) => (v % 1 === 0 ? v.toFixed(0) : String(v)) + "×";

/** Animated decision-flow walkthrough (Example section). */
export default function Walkthrough() {
  const s = useStepper(WALK_STEPS.length);

  return (
    <div className="walk js-anim" id="walk">
      <div className="walk-controls">
        <button type="button" className="walk-play" onClick={s.toggle}>
          {s.playing ? "⏸ 일시정지" : "▶ 재생"}
        </button>
        <button type="button" onClick={s.prev}>◀ 이전</button>
        <button type="button" onClick={s.next}>다음 ▶</button>
        <button type="button" onClick={s.restart}>↻ 처음</button>
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
        <span className="walk-count">
          {s.cur + 1} / {WALK_STEPS.length}
        </span>
      </div>
      <ol className="walk-timeline">
        {WALK_STEPS.map((st, i) => {
          const state = i === s.cur ? "current" : i < s.cur ? "done" : "upcoming";
          return (
            <li
              key={i}
              className={`walk-step ${state}`}
              onClick={() => {
                s.pause();
                s.goTo(i);
              }}
            >
              <div className="walk-marker">
                <span className="walk-num">{i + 1}</span>
              </div>
              <div className="walk-card">
                <span className={`phase ${PHASE_CLASS[st.phase]}`}>{st.phaseLabel}</span>
                <h4>{st.title}</h4>
                {st.files.length > 0 && (
                  <div className="walk-files">
                    {st.files.map((f, j) => (
                      <FileChip key={j} fileKey={f} />
                    ))}
                  </div>
                )}
                <p>{st.rationale}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
