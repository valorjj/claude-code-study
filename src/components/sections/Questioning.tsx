export default function Questioning() {
  return (
    <section id="questioning" className="doc-section">
      <span className="eyebrow">질문 설계 · 실전</span>
      <h2>복잡한 문제를 푸는 질문 설계 — 3가지 케이스.</h2>
      <p>같은 문제도 <strong>어떻게 묻느냐</strong>가 결과를 가른다. 아래는 규모별 질문·후속질문·답 엮기의 <strong>일반 규칙</strong>이다. (프로젝트 무관 — process-governance는 배경 예시일 뿐, Claude 답은 요지만)</p>

      <div className="case">
        <div className="case-head"><span className="case-badge">大</span><h3>아키텍처 — 큰 구조 설계</h3></div>
        <p className="case-key">핵심: "만들어줘"가 아니라 <strong>패턴 정리 → 제약 명시 → 분해 → 검증</strong>. 각 답을 다음 질문의 입력으로.</p>
        <div className="qa">
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">프레임 먼저 · 코드 금지</span></div><p>"새 서브시스템을 추가하려 해. 코드 짜지 말고, 이 코드베이스의 유사 패턴부터 정리해줘."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>공통 패턴 = 구성요소 N개(저장소 · API · 어댑터 · 매퍼 · 상태).</p></div>
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">제약 명시</span></div><p>"제약은 A · B · C (스택 · SSOT · 기존 규칙). 이 안에서 최소 변경 경로는?"</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>기존 자산 재사용 + 신규 최소, 기존 것은 무수정.</p></div>
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">분해 요청</span></div><p>"spec → plan으로 쪼개줘. 태스크마다 실패 테스트 + 리뷰 게이트 포함."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>N태스크 TDD plan (계층·경계 단위로).</p></div>
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">막힘 → 원인 먼저</span></div><p>"X 단계에서 실패해. 고치기 전에 원인부터 설명해."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>원인 가설 제시 → 테스트로 고정한 뒤 수정.</p></div>
        </div>
      </div>

      <div className="case">
        <div className="case-head"><span className="case-badge mid">中</span><h3>기능 — 흩어진 것을 하나로</h3></div>
        <p className="case-key">핵심: 한 번에 다 시키지 말고 <strong>스캔 → 설계 → 구현 → 검증</strong>으로, 이전 답의 산출물을 다음 질문에 엮는다.</p>
        <div className="qa">
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">현황 스캔 먼저</span></div><p>"기존에 흩어진 유사 구현부터 스캔해서 뭐가 제각각인지 알려줘."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>N종 상이 — 인터페이스 · 동작 · 스타일이 제각각.</p></div>
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">앞 답을 엮어 설계</span></div><p>"그 공통점을 뽑아 하나의 API로 설계해줘 — 프로젝트 규칙 지켜서."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>통합 인터페이스 초안 (필수 props + 선택 옵션).</p></div>
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">범위 고정</span></div><p>"이번엔 공용 부품만. 개별 적용은 다음 단계. TDD로."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>공용 부품 + 테스트 먼저(Red → Green).</p></div>
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">검증</span></div><p>"적용 전에 프로젝트 가드 · 테스트 통과하는지 확인."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>그린 확인 → 개별 적용 단계로.</p></div>
        </div>
      </div>

      <div className="case">
        <div className="case-head"><span className="case-badge small">小</span><h3>버그 — 작은 수정</h3></div>
        <p className="case-key">핵심: 작아도 <strong>원인 → 재현 → 최소 수정 → 테스트 → 커밋</strong>. "바로 고쳐"가 헛수정을 부른다.</p>
        <div className="qa">
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">원인 먼저</span></div><p>"이 버그, 고치기 전에 원인부터 설명해."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>원인 가설 제시 → 재현부터.</p></div>
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">최소 수정</span></div><p>"재현 확인했어. 최소 수정으로만."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>한 경로로 통합, 부작용 없게.</p></div>
          <div className="qa-turn q"><div className="qa-hd"><span className="qa-role">질문</span><span className="qa-tag">검증 · 커밋</span></div><p>"회귀 테스트 하나 추가하고 커밋."</p></div>
          <div className="qa-turn a"><div className="qa-hd"><span className="qa-role">Claude</span></div><p>회귀 테스트 + commit.</p></div>
        </div>
      </div>

      <div className="takeaway">공통 문법: <strong>프레임(해답 금지) → 제약 → 분해 → 앞 답 엮기 → 원인 · 검증</strong>. 크기가 클수록 앞 단계(프레임 · 분해)에, 작을수록 원인 · 검증에 무게를 둔다.</div>
    </section>
  );
}
