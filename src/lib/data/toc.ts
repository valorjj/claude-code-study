/** Sidebar / scrollspy table of contents. `id` must match each section's DOM id. */
export type TocEntry = { id: string; label: string };

export const TOC: TocEntry[] = [
  { id: "intro", label: "개요" },
  { id: "example", label: "실전 예시 · 결정 흐름" },
  { id: "docs", label: "docs 구조 · 실제 파일" },
  { id: "dataflow", label: "전체 데이터 플로우" },
  { id: "harness", label: "하네스 구성요소" },
  { id: "sizing", label: "요청 크기별 전술" },
  { id: "quality", label: "품질 게이트" },
  { id: "pain", label: "페인 포인트 → 해결" },
  { id: "stuck", label: "막혔을 때 · 세션 관리" },
  { id: "questioning", label: "질문 설계 · 3가지 케이스" },
  { id: "adopt", label: "적용" },
];
