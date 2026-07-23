import HarnessTable from "@/components/HarnessTable";

export default function Harness() {
  return (
    <section id="harness" className="doc-section">
      <span className="eyebrow">하네스 구성요소</span>
      <h2>무엇을, 어디에, 언제 로드하나.</h2>
      <p><strong>큰 컨텍스트</strong> = 파일로 영속(세션을 넘어 유지). <strong>작은 컨텍스트</strong> = 그때만 로드(메인 오염 방지). <span className="muted">각 행을 클릭하면 설명과 실제 코드가 열린다.</span></p>
      <HarnessTable />
      <div className="takeaway">규칙과 지식은 사람 머릿속이 아니라 저장소에 산다 — 개발자·세션이 바뀌어도 동일하다.</div>
    </section>
  );
}
