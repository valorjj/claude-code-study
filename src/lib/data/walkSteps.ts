/** Data for the "실전 예시" decision-flow walkthrough (Example section). */
export type WalkPhase = "req" | "read" | "proc" | "judge" | "gate" | "write";

export type WalkStep = {
  phase: WalkPhase;
  /** Small tag text shown above the title, e.g. "READ · 앵커". */
  phaseLabel: string;
  title: string;
  /** File-path chips; clickable when the key exists in mdFiles. */
  files: string[];
  rationale: string;
};

export const WALK_STEPS: WalkStep[] = [
  {
    phase: "req",
    phaseLabel: "요청",
    title: "요청 입력",
    files: [],
    rationale: "각 리스트 페이지의 검색 영역을 재사용 컴포넌트로 통일 — 일관된 UI·UX.",
  },
  {
    phase: "read",
    phaseLabel: "READ · 앵커",
    title: "불변 규칙 로드",
    files: ["CLAUDE.md", "apps/process-governance/CLAUDE.md"],
    rationale: "@repo/ui 재사용 · 디자인 토큰만(하드코딩 색 금지) · Svelte 5 Runes · 색=상태.",
  },
  {
    phase: "read",
    phaseLabel: "READ · 라우터",
    title: "작업 라우터 매칭",
    files: ["CLAUDE.md → task router"],
    rationale:
      '"컴포넌트/스타일링" → svelte5-boxwood · "styling/UI 작업" → design 스펙 · 검색칩이면 chip-system.',
  },
  {
    phase: "proc",
    phaseLabel: "절차 · skill",
    title: "skill 로드 (그때만)",
    files: [".claude/skills/svelte5-boxwood/"],
    rationale: "컴포넌트 작법 · 디자인 토큰 · TanStack · TDD 절차를 컨텍스트에 로드.",
  },
  {
    phase: "read",
    phaseLabel: "READ · SSOT",
    title: "설계 SSOT 참조",
    files: [
      "docs/superpowers/specs/2026-07-08-design-language-overhaul-design.md",
      "docs/architecture/chip-system.md",
    ],
    rationale: "색=상태 · 밀도 티어(data-density) · one control strip · ink ramp 규칙 확인.",
  },
  {
    phase: "proc",
    phaseLabel: "절차 · 스캔",
    title: "기존 코드 스캔",
    files: ["src/features/*/pages/", "src/shared/components/AdvancedSearchModal.svelte"],
    rationale: "현재 리스트 페이지들의 검색 UI 패턴·중복 파악 → 재사용 지점 확정.",
  },
  {
    phase: "read",
    phaseLabel: "READ · memory",
    title: "세션 간 기억 확인",
    files: ["memory/MEMORY.md"],
    rationale: "관련 과거 결정(컴포넌트 재사용·검색 규칙 등)이 있는지 — 없으면 새로 설계.",
  },
  {
    phase: "judge",
    phaseLabel: "판정",
    title: "요청 크기 = 中",
    files: [],
    rationale: "공유 컴포넌트 1개 + 각 페이지 적용 → 大 절차(spec·plan)까지는 불필요. skill + TDD 루프로.",
  },
  {
    phase: "gate",
    phaseLabel: "게이트",
    title: "품질 강제",
    files: [
      ".claude/hooks/pap-policy-guard.mjs",
      "src/lib/pap-tokens.test.ts",
      "src/lib/design-guards.test.ts",
    ],
    rationale: "--primary-* 금지 · data-density 선언 · hex 베이스라인 · 리뷰 subagent · 완료 전 검증.",
  },
  {
    phase: "gate",
    phaseLabel: "게이트 · 시각 검증",
    title: "Playwright 브라우저 검증",
    files: ["e2e/search-bar.spec.ts"],
    rationale: "실제 브라우저에서 SearchBar 렌더 · 스크린샷으로 시각 확인 → 커밋 전 최종 게이트.",
  },
  {
    phase: "write",
    phaseLabel: "WRITE",
    title: "산출물 커밋",
    files: ["src/shared/components/SearchBar.svelte", "src/features/*/pages/ (적용)", "*.test.ts"],
    rationale: "재사용 SearchBar + 각 리스트 페이지 적용 + 테스트 → git commit.",
  },
];

/** phase → phase-tag css class (from globals.css). */
export const PHASE_CLASS: Record<WalkPhase, string> = {
  req: "phase-req",
  read: "phase-read",
  proc: "phase-proc",
  judge: "phase-judge",
  gate: "phase-gate",
  write: "phase-write",
};
