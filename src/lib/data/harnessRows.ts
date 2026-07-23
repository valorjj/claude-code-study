/** Data for the Harness section's accordion table. Each row is a harness element;
 *  clicking it expands `what`/`why` plus real-code `files` (FileChip → md modal).
 *  Example file keys point at embedded content/ files from the process-governance
 *  project — keep them in sync with content/manifest.json. */
export type HarnessRow = {
  id: string;
  /** code-styled prefix in the 요소 cell (e.g. "CLAUDE.md"); rest goes in `label`. */
  code?: string;
  label: string;
  role: string;
  loc: string;
  /** render 저장 위치 as <code>. */
  locCode?: boolean;
  when: string;
  scope: "큰" | "작은";
  /** what it is / how it works — the plain-language explanation. */
  what: string;
  /** one-line "why it matters". */
  why: string;
  /** example file keys (must exist in mdFiles to be clickable). */
  files: string[];
};

export const HARNESS_ROWS: HarnessRow[] = [
  {
    id: "claude-md",
    code: "CLAUDE.md",
    label: "앵커",
    role: "불변 규칙 + 작업 라우터",
    loc: "repo 루트",
    when: "매 세션 자동",
    scope: "큰",
    what:
      "모든 세션이 시작할 때 자동으로 읽는 최상위 규칙 파일. '무엇이 불변인지'(디자인 토큰만 쓴다, Svelte 5 Runes, 색=상태 등)와 '이 작업이면 무엇을 읽어라'는 작업 라우터를 담는다. process-governance는 모노레포 공통 규칙(루트 CLAUDE.md)과 앱별 규칙(앱 CLAUDE.md) 두 층으로 나눈다.",
    why: "규칙이 사람 머릿속이 아니라 repo에 살아, 개발자·세션이 바뀌어도 동일하게 적용된다.",
    files: ["CLAUDE.md", "apps/process-governance/CLAUDE.md"],
  },
  {
    id: "ssot",
    label: "docs SSOT",
    role: "단일 진실 설계 문서",
    loc: "docs/",
    locCode: true,
    when: "라우터가 필요 시",
    scope: "큰",
    what:
      "SSOT = Single Source Of Truth(단일 진실 공급원). 설계·정책의 최종 권위 문서다. 코드와 문서가 어긋나면 문서가 기준이고, 바꾸려면 문서를 먼저 의도적으로 고친다. 라우터가 '이 작업엔 설계 맥락이 필요하다'고 판단할 때만 로드해 메인 컨텍스트를 가볍게 유지한다.",
    why: "설계 결정이 흩어지지 않고 한 곳에 모여 드리프트·모순을 막는다.",
    files: ["docs/architecture/chip-system.md", "docs/architecture/system-overview.md", "docs/guards.md"],
  },
  {
    id: "memory",
    label: "memory 파일",
    role: "세션 간 지식(결정·이유·진행)",
    loc: "memory store",
    when: "세션 시작 자동",
    scope: "큰",
    what:
      "세션 사이에 남기는 지식 — 결정, 그 이유, 진행 상황. 새 세션이 시작될 때 자동으로 불러와 이전 세션이 멈춘 지점을 이어받는다. 사실 하나당 파일 하나로 적고, MEMORY.md 인덱스가 한 줄 요약으로 각 파일을 가리켜 관련성 기준으로 회수한다.",
    why: "'왜 이렇게 했는지'가 사라지지 않아 반복 설명·같은 실수를 줄인다.",
    files: ["memory/MEMORY.md"],
  },
  {
    id: "skills",
    label: "skills",
    role: "작업별 절차(레시피)",
    loc: ".claude/skills/",
    locCode: true,
    when: "해당 작업 시",
    scope: "작은",
    what:
      "작업별 절차(레시피). '이 앱에 새 기능·페이지를 어떻게 추가하나' 같은 반복 작업의 단계·함정·체크리스트를 담는다. 해당 작업이 생길 때만 로드돼 메인 컨텍스트를 오염시키지 않는다. pg-feature-pipeline은 폴더 구조·4곳 등록·영속성 선택·가드 테스트까지 한 번에 끝내는 레시피다.",
    why: "절차가 표준화돼 누가 하든 같은 품질로 끝난다.",
    files: [".claude/skills/pg-feature-pipeline/", ".claude/skills/svelte5-boxwood/"],
  },
  {
    id: "subagents",
    label: "subagents",
    role: "격리 실행 → 결론만 반환",
    loc: "—",
    when: "대량 탐색·구현·리뷰",
    scope: "작은",
    what:
      "격리된 하위 에이전트. 대량 탐색·구현·리뷰 같은 무거운 일을 자기만의 컨텍스트에서 처리하고 결론만 메인에 돌려준다. 중간 과정의 잡음이 메인 컨텍스트를 채우지 않는다. 예: code-reviewer는 git diff를 보고 보안·접근성·Svelte 5 규칙을 검토해 실행 가능한 피드백만 반환한다.",
    why: "메인 컨텍스트를 깨끗하게 유지하면서 병렬로 깊게 판다.",
    files: [".claude/agents/code-reviewer.md"],
  },
  {
    id: "scratchpad",
    label: "scratchpad",
    role: "임시 파일(커밋 안 함)",
    loc: "세션 전용 dir",
    when: "임시물 발생 시",
    scope: "작은",
    what:
      "세션 전용 임시 디렉터리. 중간 산출물·실험 파일을 여기 두고 커밋하지 않는다. 저장소를 어지럽히지 않으면서 자유롭게 시도해 볼 공간이다.",
    why: "임시물과 진짜 산출물이 섞이지 않는다.",
    files: [],
  },
];
