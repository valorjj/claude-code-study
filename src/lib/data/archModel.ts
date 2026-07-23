/** Data for the animated layered architecture diagram (Architecture section). */
export type ArchNode = { id: string; title: string; sub?: string };
export type ArchColumn = { key: string; head: string; cls: string; nodes: ArchNode[] };
export type EdgeType = "main" | "read" | "return" | "gate" | "write" | "feedback";
export type ArchEdge = { from: string; to: string; type: EdgeType };
export type ArchStep = {
  label: string;
  nodes: string[];
  edges: number[];
  /** One-line presentation narration shown in the bottom toast for this step. */
  summary: string;
};

export const ARCH_COLUMNS: ArchColumn[] = [
  { key: "req", head: "요청", cls: "L-req", nodes: [{ id: "req", title: "요청", sub: "사용자 입력" }] },
  {
    key: "harness",
    head: "하네스 파일 · READ",
    cls: "L-harness",
    nodes: [
      { id: "claude", title: "CLAUDE.md 앵커", sub: "규칙 · 라우터" },
      { id: "ssot", title: "docs SSOT", sub: "설계 단일진실" },
      { id: "memory", title: "memory", sub: "세션 간 지식" },
      { id: "skills", title: "skills", sub: "작업별 절차" },
    ],
  },
  {
    key: "cc",
    head: "Claude Code",
    cls: "L-cc",
    nodes: [
      { id: "ctx", title: "메인 컨텍스트", sub: "규칙 + 기억" },
      { id: "router", title: "작업 라우터", sub: "무엇을 로드" },
      { id: "loop", title: "에이전트 루프", sub: "판단 · 실행" },
    ],
  },
  {
    key: "exec",
    head: "실행",
    cls: "L-exec",
    nodes: [
      { id: "sub", title: "subagent", sub: "격리 → 결론만" },
      { id: "tdd", title: "TDD 루프", sub: "Red → Green" },
      { id: "scratch", title: "scratchpad", sub: "임시 · 비커밋" },
    ],
  },
  {
    key: "gate",
    head: "게이트",
    cls: "L-gate",
    nodes: [
      { id: "hook", title: "PreToolUse 훅", sub: "편집 시 차단" },
      { id: "guard", title: "guard 테스트 · CI", sub: "정책 강제" },
      { id: "review", title: "리뷰 subagent", sub: "spec + 품질" },
      { id: "verify", title: "완료 전 검증", sub: "명령 실제 실행" },
    ],
  },
  {
    key: "write",
    head: "산출물 · 영속",
    cls: "L-write",
    nodes: [
      { id: "code", title: "코드 · spec · plan", sub: "작업 산출물" },
      { id: "commit", title: "git commit", sub: "영속" },
    ],
  },
];

export const ARCH_EDGES: ArchEdge[] = [
  { from: "req", to: "ctx", type: "main" }, // 0
  { from: "claude", to: "ctx", type: "read" }, // 1
  { from: "ssot", to: "ctx", type: "read" }, // 2
  { from: "memory", to: "ctx", type: "read" }, // 3
  { from: "ctx", to: "router", type: "main" }, // 4
  { from: "router", to: "sub", type: "main" }, // 5
  { from: "router", to: "tdd", type: "main" }, // 6
  { from: "skills", to: "tdd", type: "read" }, // 7
  { from: "sub", to: "ctx", type: "return" }, // 8
  { from: "tdd", to: "hook", type: "main" }, // 9
  { from: "sub", to: "hook", type: "main" }, // 10
  { from: "hook", to: "guard", type: "gate" }, // 11
  { from: "guard", to: "review", type: "gate" }, // 12
  { from: "review", to: "verify", type: "gate" }, // 13
  { from: "verify", to: "code", type: "write" }, // 14
  { from: "code", to: "commit", type: "write" }, // 15
  { from: "commit", to: "claude", type: "feedback" }, // 16
  { from: "commit", to: "memory", type: "feedback" }, // 17
];

export const ARCH_STEPS: ArchStep[] = [
  {
    label: "요청 입력",
    nodes: ["req", "ctx"],
    edges: [0],
    summary: "사용자 요청 하나가 들어와 메인 컨텍스트로 흘러든다. 여기서 전체 흐름이 시작된다.",
  },
  {
    label: "하네스 READ — 규칙·설계·기억 로드",
    nodes: ["claude", "ssot", "memory", "ctx"],
    edges: [1, 2, 3],
    summary:
      "코드를 만지기 전에 CLAUDE.md(규칙·라우터)·docs SSOT(설계 단일진실)·memory(세션 간 지식)를 먼저 읽어 컨텍스트를 채운다.",
  },
  {
    label: "라우팅 — 무엇을 로드할지 결정",
    nodes: ["ctx", "router"],
    edges: [4],
    summary: "메인 컨텍스트가 요청을 보고 어떤 skill·문서·절차를 로드할지 결정한다.",
  },
  {
    label: "절차 — 요청 크기별 실행",
    nodes: ["router", "sub", "tdd", "scratch", "skills"],
    edges: [5, 6, 7, 8],
    summary:
      "subagent로 격리 탐색, TDD 루프(Red→Green)로 구현, scratchpad에 임시 작업. 요청 크기에 따라 절차의 무게가 달라진다.",
  },
  {
    label: "게이트 — 품질 강제",
    nodes: ["tdd", "sub", "hook", "guard", "review", "verify"],
    edges: [9, 10, 11, 12, 13],
    summary:
      "산출물 전 반드시 통과: PreToolUse 훅이 위험 편집 차단, guard 테스트·CI가 정책 강제, 리뷰 subagent·완료 전 검증이 품질 확인.",
  },
  {
    label: "WRITE — 산출물 커밋",
    nodes: ["verify", "code", "commit"],
    edges: [14, 15],
    summary: "게이트를 통과한 코드·spec·plan만 산출물로 확정되어 git commit으로 영속화된다.",
  },
  {
    label: "되먹임 — 하네스에 되쓴다",
    nodes: ["commit", "claude", "memory"],
    edges: [16, 17],
    summary:
      "이번에 배운 결정을 CLAUDE.md·memory에 되써서 다음 세션의 하네스를 더 똑똑하게 만든다. 루프가 닫힌다.",
  },
];

// Colors are the shared --dia-* tokens (globals.css) as var() strings, applied
// via inline style in Architecture.tsx — one source of truth with the edge
// strokes (ArchDiagram.css) and arrowheads (ArchDiagram.tsx).
export const ARCH_LEGEND: { sw: string; border: string; label: string }[] = [
  { sw: "var(--dia-blue-soft)", border: "var(--dia-blue)", label: "하네스 · 마크다운 (읽고 → 되쓰는)" },
  { sw: "var(--dia-slate-soft)", border: "var(--dia-return)", label: "결론 반환" },
  { sw: "var(--dia-amber-soft)", border: "var(--dia-amber)", label: "게이트" },
  { sw: "var(--dia-green-soft)", border: "var(--dia-green)", label: "산출물 (WRITE)" },
  { sw: "var(--dia-indigo-soft)", border: "var(--dia-indigo)", label: "되먹임" },
];
