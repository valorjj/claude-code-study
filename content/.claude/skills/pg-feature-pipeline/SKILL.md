---
name: pg-feature-pipeline
description: 이 스킬은 process-governance 앱에 새 기능(feature)·페이지·사이드바 라우트를 추가할 때 반드시 사용한다. "새 페이지 추가", "사이드바 메뉴 추가", "새 feature 만들기", "라우트 추가", "공지/목록·상세 화면", "nav-menu 등록", "APP_ROUTES", "feature 폴더 구조", "스토어로 데이터 영속" 작업 시 활성화된다. 디렉토리 구조·라우팅·4곳 등록·영속성 선택·역할 노출·테스트를 한 번에 일관되게 끝내는 레시피를 제공한다. (에이전트 도구는 pg-agent-tool, Svelte 컴포넌트 작법은 svelte5-boxwood.)
---

# process-governance — 기능(feature) 추가 파이프라인

## Overview

이 앱의 구조는 루트 CLAUDE.md가 설명하는 automation 앱과 **다르다**. 한 기능은
`src/features/<name>/`(pages·components·lib·utils)에 살고, SvelteKit 파일 라우트
`src/routes/(portal)/<x>/+page.svelte`가 그 페이지를 얇게 마운트한다.

**핵심 원칙:** 새 화면을 추가하는 일의 본질은 "파일 만들기"가 아니라 **(1) 4곳 등록을 모두
닫고 (2) 데이터 영속 패턴을 올바로 고르는 것**이다. 둘 다 조용히 깨지기 쉽고, 2개의 가드
테스트가 등록 누락을 잡아낸다.

## 레시피

1. **feature 폴더 생성** — `src/features/<name>/`:
   - `pages/<Name>Page.svelte` — 화면(필수)
   - `lib/<name>-data.ts` — **순수 selector/로직**(테스트 가능). 화면은 store를 읽어 `$derived`로
     모양을 만들고 순수 함수에 넘긴다.
   - `components/…`, `utils/…` — 필요 시. 각 파일에 스캐폴딩 헤더 주석.
2. **라우트 파일** — `src/routes/(portal)/<x>/+page.svelte`는 feature 페이지를 re-export만:
   ```svelte
   <script lang="ts">
     import XPage from '@features/<name>/pages/XPage.svelte';
   </script>
   <XPage />
   ```
   `(portal)` 그룹은 `ssr=false`(`(portal)/+layout.ts`) — 그래서 `window`/`localStorage`/IndexedDB를
   직접 써도 안전하다.
3. **4곳 등록 (전부 — 아래 표)** — paths · nav-menu · APP_ROUTES (+ 새 아이콘이면 nav-icons).
4. **데이터 + 영속성** — 필요에 맞는 store 패턴을 복사(아래 결정표). 영속 store면 hydrate 호출도.
5. **역할 노출 (그룹 단위로만 동작)** — `NavItem.svelte`는 **leaf의 `requiredRole`을 무시**하고
   **그룹에만** 게이팅을 건다(현재 `requiredRole`은 governance=manager · system=admin 그룹에만 존재).
   - 시민 포함 전원: build/run/utility 같은 **비게이팅 그룹**에 leaf를 둔다(requiredRole 불필요).
   - manager/admin 전용: **이미 게이팅된 그룹 안에 leaf를 넣는다**(governance=manager, system=admin).
     leaf에 `requiredRole`만 다는 것은 **게이팅되지 않는다**(흔한 함정).
   - nav 숨김은 URL 직접 접근을 막지 못하니, 전용 페이지는 화면에서 `roleStore.canSee('manager')`로
     한 번 더 방어(현재는 DEMO 게이팅 — 실 RBAC 없음, req #1).
6. **테스트** — `lib/*.test.ts`(순수) + 필요 시 `components/*.test.ts`(@testing-library/svelte). co-location.
7. **가드 2개 갱신** — 등록을 더하면 `routes.test.ts`·`nav-menu.test.ts`가 빨개진다(아래). 같이 고친다.

## 등록 4곳 + 깨지는 가드 (navigable 페이지)

| # | 파일 | 추가 | 안 하면 |
|---|---|---|---|
| 1 | `src/router/paths.ts` | `x: () => '/x'` | nav/이동에서 경로 헬퍼 없음 |
| 2 | `src/shared/layout/nav-menu.ts` | 그룹 children에 `NavItem` leaf `{ key, label, path: paths.x(), icon }` | 사이드바에 안 뜸 |
| 3 | `src/lib/routes.ts` `APP_ROUTES` | `{ id: 'x', path: '/x', label }` (id = nav key, path base-less) | **`routes.test.ts` 실패** + 에이전트 `navigate_to` 도달 불가 |
| 4 | `src/shared/layout/nav-icons.ts` | 새 아이콘 키면 inline `<svg viewBox>`(geometry-only) | 아이콘 자리 비음 |

**가드(등록하면 갱신 필요):**
- `src/lib/routes.test.ts` — nav leaf ↔ APP_ROUTES **parity**. (3을 빠뜨리면 여기서 잡힘.)
- `src/shared/layout/nav-menu.test.ts` — 각 그룹 children **키 목록을 하드코딩**. leaf를 넣은 그룹의
  assertion을 같이 고친다(예: `run`에 넣으면 `['tasks','monitoring','community']`에 `'announcements'` 추가).
  shipped면 placeholder assertion은 `false`.

내비게이션은 항상 `goto(paths.x())` / `href(paths.x())` — bare href 금지(base 경로 처리).

## 데이터 영속성 결정표

| 필요 | 복사할 패턴 | 추가 작업 |
|---|---|---|
| 새로고침 시 초기화 OK (휘발) | in-memory store — `documents.store.svelte.ts` (`$state` + seed) | 없음 |
| 작고 per-user, 새로고침 후 유지 | localStorage — `favorites.store` + `shared/lib/persist.ts` | 없음 |
| 크거나 구조적, 새로고침 후 유지 | **IndexedDB** — `knowledgePage.store.svelte.ts` + `shared/lib/idb-*.ts` (seed-version 봉투) | `(portal)/+layout.svelte`의 `onMount`에 `void xStore.hydrateFromIdb();` 추가 (필수) |

함정: `documents.store`는 **메모리 전용 → 새로고침 시 사라진다.** "편집이 유지돼야 함"이면 in-memory가
아니라 localStorage/IndexedDB 패턴을 복사할 것. store는 `src/shared/stores/index.ts`에서 export.
(모든 영속은 mock 시임 — 실백엔드 스왑 지점, req #1. [[process-governance-mock-persistence]])

## 데이터 흐름 (테스트 가능하게)

페이지 = store(`$state`) 읽기 → `$derived`로 통합 모양 → **순수 selector 함수**(`lib/<name>-data.ts`)
호출. selector는 fixture로 단위 테스트. TanStack Query는 `assetStore` 내부 hydration에만 쓰이고
feature 페이지가 직접 쓰지 않는다(동기 store 표면을 읽음).

## 규칙 (간단 — 상세는 cross-ref)

- **스타일:** `--pap-accent*`만(절대 `--primary-*` — green 누수). `@repo/ui` Ecoletree 컴포넌트(raw
  input/select 금지), light theme, OS 이모지 금지. 가드+훅이 강제 → `apps/process-governance/docs/guards.md`.
- **새 페이지 blueprint(2026-07-08 디자인 스펙):** 페이지 루트에 `data-density="compact|regular|spacious"`
  선언, 아키타입(Browse/Detail/Form/Queue) 중 하나 선택, 컨트롤 스트립은 화면당 1개, 색은
  `--pap-ink-*`/`--pap-fs-*` 토큰만 사용(새 hex 리터럴 금지). 가드: `src/lib/design-guards.test.ts`.
- **Svelte 5 Runes만** · 컴포넌트 작법/스토어/TanStack 디테일 → skill **`svelte5-boxwood`**.
- **SSR-safety:** `lib/server/**`를 클라이언트에서 import 금지. (portal은 ssr=false라 DOM/storage 안전.)
- 페이지 레이아웃 관용구: `.main-inner` > `.page-header`(`.page-title`/`.page-subtitle`) — 기존
  `DocumentsPage`/`GlossaryPage`를 본보기로.

## Common mistakes (traps)

- ❌ **등록 4곳 중 일부 누락** — 특히 APP_ROUTES(3). routes.test.ts가 잡지만, 먼저 다 채울 것.
- ❌ **`nav-menu.test.ts` 미갱신** — leaf 추가 시 그룹 children assertion이 깨짐. 같이 고친다.
- ❌ **영속 필요인데 in-memory store 복사** — 새로고침에 사라짐. 결정표대로 localStorage/IndexedDB.
- ❌ **IndexedDB store인데 `+layout.svelte` onMount에 hydrate 누락** — 저장은 되는데 로드가 안 됨.
- ❌ **leaf에 `requiredRole`만 달고 게이팅 기대** — NavItem은 leaf의 requiredRole을 무시(그룹만 게이팅).
  전용 페이지는 governance/system 같은 게이팅된 그룹 안에 둘 것.
- ❌ **로직을 컴포넌트에 묻음** — 순수 로직은 `lib/`에 빼서 테스트.
- ❌ **bare href / `--primary-*` / raw input** — base 경로·green 누수·디자인 시스템 위반.

## Verify

```bash
pnpm --filter process-governance test    # 가드(routes·nav-menu·pap·vendor) + 새 단위/컴포넌트 테스트
pnpm --filter process-governance check   # 타입
pnpm --filter process-governance dev     # 5006 — 사이드바 클릭 → 목록·상세, (영속이면) 새로고침 후 유지 확인
```

관련: 에이전트 도구는 **`pg-agent-tool`** · 컴포넌트/Runes/TanStack은 **`svelte5-boxwood`** ·
가드/정책은 `apps/process-governance/docs/guards.md` · 표준 요구사항 `apps/process-governance/CLAUDE.md`.
