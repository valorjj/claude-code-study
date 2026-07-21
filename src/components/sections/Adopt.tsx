export default function Adopt() {
  return (
    <section id="adopt" className="doc-section">
      <span className="eyebrow">적용</span>
      <h2>세 단계면 어느 팀이든 채택할 수 있다.</h2>
      <table>
        <thead><tr><th>#</th><th>단계</th><th>산출</th></tr></thead>
        <tbody>
          <tr><td>1</td><td>프로젝트마다 <code>CLAUDE.md</code> 하네스</td><td>불변 규칙 + 작업 라우터</td></tr>
          <tr><td>2</td><td>반복 규칙을 guard로 승격</td><td>산문 → 실행되는 테스트 · 훅</td></tr>
          <tr><td>3</td><td>요청 크기별 절차 운용</td><td>小 편집+guard / 中 skill+TDD / 大 spec→plan→subagent</td></tr>
        </tbody>
      </table>
      <div className="takeaway">결과물은 코드가 아니라, 반복 가능한 시스템이다.</div>
    </section>
  );
}
