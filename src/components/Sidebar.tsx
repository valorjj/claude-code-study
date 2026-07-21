"use client";
import { TOC } from "@/lib/data/toc";
import { useScrollspy } from "@/hooks/useScrollspy";
import "./Sidebar.css";

const IDS = TOC.map((t) => t.id);

/** Sticky sidebar table of contents with scrollspy highlight. */
export default function Sidebar() {
  const active = useScrollspy(IDS);
  return (
    <aside className="toc" aria-label="목차">
      <div className="toc-brand">Claude Code 하네스 · 사용 패턴</div>
      <div className="toc-sub-brand">프로젝트 무관 · 재사용 가능한 harness 요약</div>
      <nav>
        {TOC.map((t) => (
          <a key={t.id} href={`#${t.id}`} className={active === t.id ? "active" : undefined}>
            {t.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
