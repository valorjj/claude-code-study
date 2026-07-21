import Walkthrough from "../diagrams/Walkthrough";

/** 실전 예시 · 결정 흐름 — the animated decision-flow walkthrough. */
export default function Example() {
  return (
    <section id="example" className="doc-section">
      <span className="eyebrow">실전 예시 · 결정 흐름</span>
      <h2>요청 하나가 들어오면, Claude는 무엇을 읽고 판단하나.</h2>
      <p>
        요청: <em>&quot;각 리스트 페이지의 검색 영역을 재사용 컴포넌트로 통일해 UI·UX를 일관되게.&quot;</em>
      </p>
      <p className="muted">
        아래는 이 요청을 처리하며 <strong>어떤 마크다운을 읽고 참조하는지</strong> 단계별 흐름이다. ▶ 재생으로
        따라가 보라. (단계 클릭 시 이동)
      </p>
      <Walkthrough />
      <p className="muted">
        각 단계에서 실제로 열리는 파일 경로를 표시했다. 흐름은 요청 크기에 따라 달라진다 — 이 건은{" "}
        <strong>中</strong>(공유 컴포넌트 1개).
      </p>
    </section>
  );
}
