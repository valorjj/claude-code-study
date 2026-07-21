export default function Stuck() {
  return (
    <section id="stuck" className="doc-section">
      <span className="eyebrow">실전 팁 · 세션 관리</span>
      <h2>확증편향을 막고, 막혔을 때 잘 빠져나오는 법.</h2>
      <p>오래된 세션은 자기 결론에 갇히고(확증편향), 막히면 같은 실수를 반복한다. 실제로 통하는 기법들.</p>

      <h3>세션 오염 · 확증편향 막기</h3>
      <table>
        <thead><tr><th>기법</th><th>방법</th><th>효과</th></tr></thead>
        <tbody>
          <tr><td>가상 인격으로 반론 경쟁</td><td>"가상의 X는 △△라고 본다 — 너는 어때?"로 반대 관점을 세워 자기 반박을 강제</td><td>세션이 길어질수록 생기는 확증편향·동조(아첨) 차단</td></tr>
          <tr><td>자주 compact + worklog</td><td>주기적으로 worklog에 결정·이유·진행을 기록하고 compact</td><td>새 세션도 전체 히스토리를 이어받아 맥락 유실 없음</td></tr>
          <tr><td>명시적 반박 지시</td><td>"이번엔 동의하지 말고 약점부터 짚어"</td><td>동조 편향을 끊고 실제 리스크를 먼저 드러냄</td></tr>
        </tbody>
      </table>

      <h3>막히거나 안 풀릴 때</h3>
      <table>
        <thead><tr><th>상황</th><th>이렇게 활용</th><th>효과</th></tr></thead>
        <tbody>
          <tr><td>같은 오류 반복 · 헛수정</td><td>고치기 전에 "무엇이 왜 실패하는지" 원인부터 설명시키기</td><td>추측성 수정 대신 가설 검증</td></tr>
          <tr><td>"됐다"는데 실제론 안 됨</td><td>추측 금지 — 로그·테스트로 재현부터, 실행 결과로만 완료 인정</td><td>증거 기반 · 거짓 완료 방지</td></tr>
          <tr><td>잘못된 방향으로 깊이 감</td><td>커밋 체크포인트로 롤백하고 다시 (자주 커밋 = 안전한 되돌림)</td><td>매몰비용 끊기</td></tr>
          <tr><td>원인 탐색이 컨텍스트를 오염</td><td>조사를 subagent에 격리 위임 → 결론만 받기</td><td>메인 컨텍스트·판단을 깨끗하게 유지</td></tr>
          <tr><td>한 방향에 갇힘</td><td>2~3개 독립 접근을 만들게 하고 비교·판정 (가상 인격 경쟁의 일반형)</td><td>지역 최적(local optimum) 탈출</td></tr>
          <tr><td>요청이 너무 큼</td><td>spec → plan 으로 분해하고 한 태스크씩</td><td>막힘 지점을 좁혀 디버깅</td></tr>
        </tbody>
      </table>
      <div className="takeaway">막히면 "더 세게 밀기"보다 — 관점을 바꾸고(반론·복수안), 증거를 요구하고, 필요하면 컨텍스트를 리셋한다.</div>
    </section>
  );
}
