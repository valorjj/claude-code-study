import ArchDiagram from "../diagrams/ArchDiagram";

/** 전체 데이터 플로우 · 아키텍처 — animated layered architecture. */
export default function Architecture() {
  return (
    <section id="dataflow" className="doc-section">
      <span className="eyebrow">전체 데이터 플로우 · 아키텍처</span>
      <h2>하네스를 읽고 → 절차를 밟고 → 게이트를 통과해 → 쓰고 → 되먹인다.</h2>
      <p className="muted">
        ▶ 재생으로 계층 간 흐름을 따라가 보라. 좁은 화면에선 가로 스크롤. (JS 꺼짐 시 계층/노드는 그대로 보인다)
      </p>
      <ArchDiagram />
    </section>
  );
}
