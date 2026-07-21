export default function Harness() {
  return (
    <section id="harness" className="doc-section">
      <span className="eyebrow">하네스 구성요소</span>
      <h2>무엇을, 어디에, 언제 로드하나.</h2>
      <p><strong>큰 컨텍스트</strong> = 파일로 영속(세션을 넘어 유지). <strong>작은 컨텍스트</strong> = 그때만 로드(메인 오염 방지).</p>
      <table>
        <thead><tr><th>요소</th><th>역할</th><th>저장 위치</th><th>로드 시점</th><th>스코프</th></tr></thead>
        <tbody>
          <tr><td><code>CLAUDE.md</code> 앵커</td><td>불변 규칙 + 작업 라우터</td><td>repo 루트</td><td>매 세션 자동</td><td>큰</td></tr>
          <tr><td>docs SSOT</td><td>단일 진실 설계 문서</td><td><code>docs/</code></td><td>라우터가 필요 시</td><td>큰</td></tr>
          <tr><td>memory 파일</td><td>세션 간 지식(결정·이유·진행)</td><td>memory store</td><td>세션 시작 자동</td><td>큰</td></tr>
          <tr><td>skills</td><td>작업별 절차(레시피)</td><td><code>.claude/skills/</code></td><td>해당 작업 시</td><td>작은</td></tr>
          <tr><td>subagents</td><td>격리 실행 → 결론만 반환</td><td>—</td><td>대량 탐색·구현·리뷰</td><td>작은</td></tr>
          <tr><td>scratchpad</td><td>임시 파일(커밋 안 함)</td><td>세션 전용 dir</td><td>임시물 발생 시</td><td>작은</td></tr>
        </tbody>
      </table>
      <div className="takeaway">규칙과 지식은 사람 머릿속이 아니라 저장소에 산다 — 개발자·세션이 바뀌어도 동일하다.</div>
    </section>
  );
}
