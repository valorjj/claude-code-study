/** Data for the SizeFlow diagram + the sizing table (Sizing section). */
export type SizeBranch = { badge: string; cls: string; title: string; trigger: string };

export const SIZE_BRANCHES: SizeBranch[] = [
  { badge: "小", cls: "", title: "직접 편집 · guard가 백업", trigger: "1파일 · 저위험" },
  { badge: "中", cls: "mid", title: "skill 로드 + TDD 루프", trigger: "기능 · 페이지 · 도구 1개" },
  { badge: "大", cls: "big", title: "brainstorm → spec → plan · subagent + 리뷰", trigger: "다중 파일 · 설계 결정" },
];

export type SizeRow = { size: string; cls: string; trigger: string; process: string; safety: string };

export const SIZE_TABLE: SizeRow[] = [
  { size: "小", cls: "", trigger: "1파일 · 저위험", process: "직접 편집", safety: "PreToolUse 훅 + guard 테스트" },
  { size: "中", cls: "mid", trigger: "기능·페이지·도구 1개", process: "skill 로드 → TDD(Red→Green→Refactor)", safety: "스킬 절차 + 테스트" },
  { size: "大", cls: "big", trigger: "다중 파일 · 설계 결정", process: "brainstorm → spec → plan → subagent", safety: "태스크별 리뷰 게이트" },
];
