/** Data for the animated layered architecture diagram (Architecture section). */
export type ArchNode = { id: string; title: string; sub?: string };
export type ArchColumn = { key: string; head: string; cls: string; nodes: ArchNode[] };
export type EdgeType = "main" | "read" | "return" | "gate" | "write" | "feedback";
export type ArchEdge = { from: string; to: string; type: EdgeType };
export type ArchStep = { label: string; nodes: string[]; edges: number[] };

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
  { label: "요청 입력", nodes: ["req", "ctx"], edges: [0] },
  { label: "하네스 READ — 규칙·설계·기억 로드", nodes: ["claude", "ssot", "memory", "ctx"], edges: [1, 2, 3] },
  { label: "라우팅 — 무엇을 로드할지 결정", nodes: ["ctx", "router"], edges: [4] },
  { label: "절차 — 요청 크기별 실행", nodes: ["router", "sub", "tdd", "scratch", "skills"], edges: [5, 6, 7, 8] },
  { label: "게이트 — 품질 강제", nodes: ["tdd", "sub", "hook", "guard", "review", "verify"], edges: [9, 10, 11, 12, 13] },
  { label: "WRITE — 산출물 커밋", nodes: ["verify", "code", "commit"], edges: [14, 15] },
  { label: "되먹임 — 하네스에 되쓴다", nodes: ["commit", "claude", "memory"], edges: [16, 17] },
];

export const ARCH_LEGEND: { sw: string; border: string; label: string }[] = [
  { sw: "#eaf2fe", border: "#4c8ff0", label: "하네스 · 마크다운 (읽고 → 되쓰는)" },
  { sw: "#f5f6fa", border: "#a8a8ab", label: "결론 반환" },
  { sw: "#fff4e5", border: "#e08a00", label: "게이트" },
  { sw: "#eaf7ec", border: "#57ab5a", label: "산출물 (WRITE)" },
  { sw: "#eaf2fe", border: "#3b7fe0", label: "되먹임" },
];
