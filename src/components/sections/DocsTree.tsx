import type { ReactNode } from "react";
import FileChip from "../FileChip";
import "./DocsTree.css";

const TREE = `apps/process-governance/
├─ CLAUDE.md                           # 앵커: 불변 규칙 + 작업 라우터 (매 세션 자동 READ)
│
├─ .claude/                            # (repo 루트) 하네스 자산
│  ├─ skills/                          #   작업별 절차 — 그때만 로드
│  │  ├─ svelte5-boxwood/              #     컴포넌트·Runes·TanStack·TDD
│  │  ├─ pg-feature-pipeline/          #     새 feature/페이지/라우트
│  │  └─ pg-agent-tool/                #     에이전트 도구 추가
│  └─ hooks/
│     └─ pap-policy-guard.mjs          #   PreToolUse 훅 — 위반 편집 차단(exit 2)
│
├─ docs/
│  ├─ architecture/                    # 설계 SSOT (단일 진실)
│  │  ├─ system-overview.md            #     전체 시스템 형태
│  │  ├─ bff-sse.md                    #     BFF·SSE·에이전트 루프
│  │  ├─ asset-schema.yaml             #     자산 스키마 SSOT → xlsx/json/타입 생성
│  │  ├─ chip-system.md                #     칩·색·상태 문법 SSoT
│  │  └─ runtime-boundary.md           #     저작 vs 실행 불변식
│  ├─ superpowers/
│  │  ├─ specs/                        #     brainstorm 산출 설계 스펙 (날짜별)
│  │  └─ plans/                        #     TDD 태스크 계획 (날짜별)
│  ├─ product/                         #     요구·시나리오·IA
│  ├─ policy/                          #     보안·권한·예외·로깅 정책
│  ├─ llm/                             #     에이전트 지식 (system prompt에 로드)
│  ├─ guards.md                        #     실행되는 정책 레지스트리
│  └─ STATUS.md                        #     "어디까지 만들었나"
│
├─ src/
│  ├─ lib/
│  │  ├─ server/                       # 서버 전용 (agent.ts, asset-catalog.ts …)
│  │  ├─ client/                       # 브라우저 전용 (stores, idb, sse-client)
│  │  ├─ routes.test.ts                # guard: 라우트 커버리지
│  │  ├─ pap-tokens.test.ts            # guard: PAP 액센트 토큰
│  │  ├─ design-guards.test.ts         # guard: 밀도·hex
│  │  └─ vendor-boundary.test.ts       # guard: 벤더 경계
│  ├─ features/                        # 기능별 수직 슬라이스 (community, tasks, monitoring …)
│  ├─ shared/
│  │  └─ components/                   # 공유 컴포넌트 (AdvancedSearchModal.svelte …)
│  └─ routes/                          # +page.svelte, api/agent/chat (SSE), api/assets
│
└─ memory/                             # (외부) 세션 간 지식 — MEMORY.md 인덱스 + per-fact 파일`;

// token found in TREE  ->  md file key (first occurrence wrapped as a clickable chip)
export const WRAPS: [string, string][] = [
  ["CLAUDE.md", "apps/process-governance/CLAUDE.md"],
  ["svelte5-boxwood/", ".claude/skills/svelte5-boxwood/"],
  ["pap-policy-guard.mjs", ".claude/hooks/pap-policy-guard.mjs"],
  ["system-overview.md", "docs/architecture/system-overview.md"],
  ["bff-sse.md", "docs/architecture/bff-sse.md"],
  ["asset-schema.yaml", "docs/architecture/asset-schema.yaml"],
  ["chip-system.md", "docs/architecture/chip-system.md"],
  ["runtime-boundary.md", "docs/architecture/runtime-boundary.md"],
  ["design-guards.test.ts", "src/lib/design-guards.test.ts"],
  ["guards.md", "docs/guards.md"],
  ["STATUS.md", "docs/STATUS.md"],
  ["routes.test.ts", "src/lib/routes.test.ts"],
  ["pap-tokens.test.ts", "src/lib/pap-tokens.test.ts"],
  ["vendor-boundary.test.ts", "src/lib/vendor-boundary.test.ts"],
  ["MEMORY.md", "memory/MEMORY.md"],
];

/** Splits the tree text into plain strings + clickable FileChip spans. */
function renderTree(): ReactNode[] {
  let nodes: ReactNode[] = [TREE];
  WRAPS.forEach(([tok, key], wi) => {
    const out: ReactNode[] = [];
    let wrapped = false;
    nodes.forEach((n) => {
      if (wrapped || typeof n !== "string") {
        out.push(n);
        return;
      }
      const idx = n.indexOf(tok);
      if (idx < 0) {
        out.push(n);
        return;
      }
      out.push(n.slice(0, idx));
      out.push(<FileChip key={`w${wi}`} variant="tree" fileKey={key} label={tok} />);
      out.push(n.slice(idx + tok.length));
      wrapped = true;
    });
    nodes = out;
  });
  return nodes;
}

/** docs 구조 · 실제 파일 — file tree with clickable filenames. */
export default function DocsTree() {
  return (
    <section id="docs" className="doc-section">
      <span className="eyebrow">docs 구조 · 실제 파일</span>
      <h2>그 파일들은 어디에 사나 — 하네스 저장소 구조.</h2>
      <p>
        위 예시에서 읽힌 파일들이 실제로 어디에 있는지. 각 폴더의 대표 파일을{" "}
        <strong>실제 이름</strong>으로 표시했다. (밑줄 파일은 클릭하면 원문)
      </p>
      <pre className="filetree">{renderTree()}</pre>
      <p className="muted">
        CLAUDE.md · docs · skills · hooks · guards · memory 가 곧 &quot;하네스&quot; — 규칙·설계·절차·정책·기억을
        파일로 고정한다.
      </p>
    </section>
  );
}
