export default function Quality() {
  return (
    <section id="quality" className="doc-section">
      <span className="eyebrow">품질 게이트</span>
      <h2>품질은 신뢰가 아니라 기계가 강제한다.</h2>
      <table>
        <thead><tr><th>게이트</th><th>강제 대상</th><th>시점</th><th>형태</th></tr></thead>
        <tbody>
          <tr><td>PreToolUse 훅</td><td>정책 위반 편집</td><td>편집 저장 직전</td><td>차단(exit 2)</td></tr>
          <tr><td>Executable guards</td><td>라우트 · 토큰 · 경계 규칙</td><td>테스트 실행 / CI</td><td>실패하는 테스트</td></tr>
          <tr><td>TDD</td><td>기능 · 회귀</td><td>구현 중</td><td>Red → Green</td></tr>
          <tr><td>리뷰 subagent</td><td>spec 준수 + 품질</td><td>태스크 완료 시</td><td>승인 / 재작업</td></tr>
          <tr><td>완료 전 검증</td><td>성공 주장</td><td>"완료" 직전</td><td>명령 실제 실행</td></tr>
        </tbody>
      </table>
      <div className="takeaway">반복 위반하는 규칙은 산문에서 실행되는 guard로 <em>승격</em>한다.</div>
    </section>
  );
}
