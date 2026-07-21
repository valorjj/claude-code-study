export default function Pain() {
  return (
    <section id="pain" className="doc-section">
      <span className="eyebrow">페인 포인트 → 해결</span>
      <h2>아팠던 지점은 다음엔 절차로 만든다.</h2>
      <table>
        <thead><tr><th>증상</th><th>harness 해결</th></tr></thead>
        <tbody>
          <tr><td>긴 세션에서 컨텍스트 유실</td><td>memory + docs SSOT (파일로 영속)</td></tr>
          <tr><td>병렬 세션 충돌 (공유 브랜치)</td><td>coordination 노트로 조율</td></tr>
          <tr><td>대량 탐색이 메인 컨텍스트 오염</td><td>subagent 격리 → 결론만 반환</td></tr>
          <tr><td>큰 작업을 즉흥으로 진행</td><td>brainstorm → spec → plan</td></tr>
          <tr><td>수동 리뷰 부하</td><td>규칙을 실행되는 guard로 승격</td></tr>
        </tbody>
      </table>
    </section>
  );
}
