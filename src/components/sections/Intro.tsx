export default function Intro() {
  return (
    <section id="intro" className="doc-section">
      <span className="eyebrow">Claude Code 하네스</span>
      <h1>AI에게 코드가 아니라, 일하는 <em>체계</em>를 맡긴다.</h1>
      <p className="lead">프로젝트에 무관하게 재사용하는 harness 패턴을 한 장으로 요약한다.
        규칙·지식·절차를 저장소 파일에 두고, 요청 크기에 절차를 맞추고, 품질은 기계가 강제한다.</p>
      <p className="muted">Claude Code의 기본 개념(subagent·skill·hook이 무엇인지 등)은 이미 아는 것으로 보고 생략한다.</p>
    </section>
  );
}
