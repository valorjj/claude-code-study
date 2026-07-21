# BOXWOOD Frontend 개발 가이드

## 프로젝트 개요

| 항목 | 값 |
|------|-----|
| **프레임워크** | Svelte 5.37.2 (Runes) |
| **빌드** | Vite 7.0.6 + Turborepo 2.5.6 |
| **패키지 매니저** | pnpm 8.15.6 (workspaces) |
| **상태 관리** | Nanostores + TanStack Query 6.0.5 |
| **UI 라이브러리** | SMUI 8.x, Bits UI 2.11.4 |
| **라우터** | sv-router 0.10.1 |

---

## Quick Reference

### 모노레포 구조

```
frontend/
├── apps/
│   ├── automation/           # 메인 Svelte 5 앱
│   └── ecoletree-ui-system/  # 컴포넌트 쇼케이스
├── packages/
│   ├── ui/                   # @repo/ui - 공유 UI 컴포넌트
│   ├── utils/                # @repo/utils - 유틸리티 & API 클라이언트
│   ├── bpmn/                 # @repo/bpmn - BPMN.js 래퍼
│   └── domains/              # @repo/domains - 도메인 모델
└── turbo.json                # Turborepo 파이프라인
```

### 핵심 명령어

```bash
# 개발
pnpm install                       # 의존성 설치
pnpm automation:local              # 로컬 개발 서버 (localhost:5174, base: /)
pnpm automation:dev                # 개발 서버 (localhost:5174, base: /app)
pnpm automation:build              # 프로덕션 빌드

# 검증
pnpm automation:type-check         # TypeScript 검증
pnpm lint                          # ESLint 검사
pnpm automation:test               # Vitest 단위 테스트
pnpm automation:test:ui            # Vitest UI 모드

# Docker
pnpm automation:build:docker       # Docker 빌드
```

> **⚠️ 중요**: 별다른 지시가 없다면 반드시 `pnpm automation:local` 명령으로 실행할 것.

### 환경별 Base Path

| 명령어 | env 파일 | Base Path | 용도 |
|--------|----------|-----------|------|
| `pnpm automation:local` | `.env.base` | `/` | 로컬 개발 (Vite만) |
| `pnpm automation:dev` | `.env.development` | `/app` | Backend 연동 개발 |

### 테스트 계정 (Local)

| 항목 | 값 |
|------|-----|
| **Tenant** | T1 |
| **Username** | testUser |
| **Password** | test1234 |

### E2E 테스트 계정

| 항목 | 값 |
|------|-----|
| **Tenant** | T1 |
| **Username** | testUser |
| **Password** | test1234 |

---

## 개발 워크플로우 (Agent Loop)

> **⚠️ 권장**: 새 컴포넌트 생성, TanStack Query 작업, 스타일링 변경, TDD 사이클 시 `/svelte5-boxwood` 스킬을 사용할 것. 이 스킬은 BOXWOOD 프론트엔드 개발 패턴, Svelte 5 Runes, TanStack Query, 권한 관리, i18n, TDD 가이드를 제공합니다.
>
> **💡 선택**: 새 페이지 추가, 대량 데이터 컴포넌트, 성능 이슈 발생 시 `/svelte-performance` 스킬로 최적화 점검 권장. 번들 최적화, 비동기 워터폴 방지, 렌더링 성능 등 50+ 규칙을 제공합니다.

### 1. Gather Context (컨텍스트 수집)

기능 구현 전 반드시 확인:

- **기존 패턴 분석**: 유사 feature의 구조 (apis, queries, components, pages)
- **디자인 시스템**: `svelte5-boxwood` skill → BOXWOOD CSS 변수 사용
- **권한 확인**: 해당 feature의 permissions 모듈 확인
- **API 스펙**: portal-backend의 해당 Controller 확인

### 2. Take Action (구현)

- Svelte 5 Runes만 사용 (`$state`, `$derived`, `$effect`, `$props`)
- TDD 사이클: Red → Green → Refactor
- TypeScript strict mode 준수

### 3. Verify Work (검증)

```bash
pnpm automation:type-check    # 타입 검증
pnpm lint                     # 코드 품질
pnpm automation:local           # 브라우저에서 확인
```

### 4. Repeat (반복)

- 다음 기능으로 이동
- CSP 위반 로그 확인 (브라우저 콘솔)

---

## 인증 흐름 (Critical)

### 인증 파이프라인

```
App Mount
    ↓
fetchI18nMessages() → 번역 로드
    ↓
setupAuthEventListeners() → 토큰 만료 핸들러 등록
    ↓
initialize() → /me API로 현재 사용자 로드
    ↓
fetchAllBootData() → 테넌트/조직 데이터 로드
    ↓
Route Guard (beforeEach)
    ↓ 인증 확인 → 권한 확인
Controller
```

### 인증 상태 관리 (Nanostores)

| Store | 역할 |
|-------|------|
| `authStore` | 인증 상태 (isAuthenticated, user, accessToken) |
| `userFeaturePermissions` | 메뉴 표시용 기능 권한 (computed) |
| `userIsAdmin` | 관리자 여부 (computed) |

### 토큰 관리

| 함수 | 위치 | 역할 |
|------|------|------|
| `getAccessToken()` | `@utils/stores/authStore` | sessionStorage에서 토큰 조회 |
| `setTokens(access, refresh)` | 〃 | 토큰 저장 |
| `clearTokens()` | 〃 | 로그아웃/401 시 정리 |

### API 인터셉터 (Axios)

1. **요청 시**: Authorization 헤더 추가
2. **401 응답**: 토큰 갱신 → 원본 요청 재시도
3. **갱신 실패**: 토큰 정리 → 로그인 페이지 리다이렉트

### 권한 시스템 (3계층)

| 계층 | 소스 | 용도 |
|------|------|------|
| Feature Permissions | `/me` API → `featurePermissions` | 메뉴 표시 |
| Route Permissions | `routePermissions.ts` | 페이지 접근 |
| Resource Permissions | `/permissions/my-resources` API | 데이터 접근 (CRUD) |

**상세 가이드**: `references/auth-flow.md`

---

## 핵심 아키텍처 패턴

### Screaming Architecture

```
features/{feature-name}/
├── apis/                 # HTTP 통신
├── queries/              # TanStack Query 정의
├── mutations/            # Mutation 정의
├── components/           # Feature별 UI
├── pages/                # 라우트 페이지
├── services/             # 비즈니스 로직
├── permissions/          # 접근 제어
└── types/                # 도메인 타입
```

### 데이터 흐름

```
Component ($state, $derived)
    ↓
Query Definition (queries/*.ts)
    ↓
TanStack Query (createQuery)
    ↓
API Layer (apis/*.ts)
    ↓
HTTP Client (Axios + 인터셉터)
    ↓
Backend API
```

### TanStack Query 캐시 전략

| 전략 | staleTime | gcTime | 용도 |
|------|-----------|--------|------|
| aggressive | 30분 | 1시간 | 목록 페이지 |
| normal | 5분 | 30분 | 기본값 |
| minimal | 1분 | 5분 | 동적 데이터 |
| realtime | 0 | 10초 폴링 | 모니터링 |

---

## Svelte 5 필수 규칙

### 필수 패턴

```typescript
// 상태
let count = $state(0);

// 계산값
let doubled = $derived(count * 2);

// Props
let { title, items = [] } = $props();

// 사이드 이펙트 (정리 포함)
$effect(() => {
  const timer = setInterval(() => tick(), 1000);
  return () => clearInterval(timer);
});

// 이벤트 핸들러 (콜론 없음)
<button onclick={() => count++}>Click</button>
```

### 금지 패턴 (Svelte 4 레거시)

```typescript
// ❌ 모두 금지
let count = 0;                    // 반응성 없음
$: doubled = count * 2;           // 레거시 반응성
export let prop;                  // 레거시 Props
on:click={handler}                // 레거시 이벤트
```

---

## BOXWOOD 디자인 시스템

### CSS 변수 필수 사용

```css
/* 배경 */
--boxwood-white: #ffffff;         /* 기본 배경 */
--boxwood-light: #f5f6fa;         /* 보조 배경 */

/* 텍스트 */
--boxwood-dark: #17161B;          /* 주 텍스트 */
--boxwood-medium: #747376;        /* 보조 텍스트 */

/* Primary */
--primary-500: #4C8FF0;           /* 주요 액션 */
--primary-100: #E4F7FF;           /* 배경 강조 */

/* Status */
--status-success: #AED25F;
--status-warning: #FF6600;
--status-danger: #F32424;
--status-info: #486BEF;

/* 폰트 */
--font-family-primary: 'Noto Sans KR', sans-serif;
```

### 금지 사항

- 다크 테마 스타일 사용 금지
- 하드코딩된 색상값 금지 (`#0d1117` 등)
- 모노스페이스 폰트 기본 사용 금지

---

## CSP (Content Security Policy)

### 허용

| 유형 | 허용 |
|------|------|
| 스크립트 | `'self'` + `blob:` (Web Worker) |
| 스타일 | `'self'` + `'unsafe-inline'` + Google Fonts |
| API | `'self'` 동일 도메인만 |

### 금지

```svelte
<!-- ❌ 모두 금지 -->
<script src="https://cdn.example.com/lib.js"></script>
eval('code');
fetch('https://external-api.com/data');
<button onclick="handleClick()">Click</button>

<!-- ✅ 허용 -->
import library from 'library-name';
fetch('/api/v1/users');
<button onclick={handleClick}>Click</button>
```

---

## Import Aliases

```typescript
import Button from '@ui/components/Button.svelte';  // packages/ui
import { formatDate } from '@utils/helpers';         // packages/utils
import { ProcessApi } from '@features/processes/apis';  // features
import { authStore } from '@shared/auth/stores';     // shared
```

---

## 개발 규칙

### 필수 체크리스트

- [ ] Svelte 5 Runes만 사용
- [ ] TypeScript strict mode
- [ ] BOXWOOD CSS 변수 사용
- [ ] `$effect`에서 cleanup 함수 반환
- [ ] CSP 위반 없음 (브라우저 콘솔 확인)
- [ ] 권한 체크 (`getPagePermissions()`)
- [ ] 로딩/에러 상태 처리

### Feature 생성 시

1. `features/{name}/` 폴더 생성
2. Vertical slice 구현 (apis → types → queries → pages → components)
3. `router/router.ts`에 라우트 등록
4. `permissions/` 모듈로 권한 등록

---

## 라우터 (sv-router)

### Layout 구조

| Layout | 용도 |
|--------|------|
| `UnauthLayout` | 로그인, 회원가입 |
| `MainLayout` | 인증된 사용자 (Navigation 포함) |
| `ErrorLayout` | 404, 500 에러 |

### 라우트 가드

```typescript
// router/hooks.ts - beforeEach
1. 비인증 경로 (/login 등) → 허용
2. 인증 확인 → 미인증 시 /auth/login 리다이렉트
3. 권한 확인 → 권한 없음 시 /forbidden
```

---

## 테스트 전략 (Vitest)

### 테스트 설정

| 항목 | 값 |
|------|-----|
| **프레임워크** | Vitest 3.1.4 |
| **테스트 라이브러리** | @testing-library/svelte 5.x |
| **환경** | jsdom |
| **설정 파일** | `apps/automation/vitest.config.ts` |

### 테스트 파일 위치 규칙

| 영역 | 테스트 위치 | 예시 |
|------|-----------|------|
| `apps/automation/src/features/` | 소스 옆 co-location | `features/processes/utils/helper.test.ts` |
| `packages/{pkg}/src/` | `packages/{pkg}/tests/` 미러 | `packages/bpmn/tests/utils/LoopHelper.test.ts` |

**packages 테스트는 반드시 `tests/` 디렉토리에 작성한다. `src/` 안에 테스트 파일(`*.test.ts`)을 두지 않는다.**

```
# ✅ packages — tests/ 디렉토리에 src/ 구조를 미러링
packages/bpmn/
├── src/utils/LoopHelper.js
└── tests/utils/LoopHelper.test.ts     # import: ../../src/utils/LoopHelper

# ✅ features — 소스 옆 co-location
apps/automation/src/features/processes/
├── utils/helper.ts
└── utils/helper.test.ts
```

### 테스트 패턴

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import MyComponent from './MyComponent.svelte';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(MyComponent, { props: { title: 'Test' } });
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle click events', async () => {
    const onClick = vi.fn();
    render(MyComponent, { props: { onClick } });

    await fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 모킹 전략

| 대상 | 방법 |
|------|------|
| **API 호출** | `vi.mock('@features/*/apis')` |
| **Monaco Editor** | `vitest.config.ts`에서 alias로 mock |
| **TanStack Query** | `QueryClientProvider` wrapper 사용 |
| **Nanostores** | 직접 store 값 설정 |

---

## 모니터링 기능

### BPMN Activity Overlay

프로세스 실행 상태를 BPMN 다이어그램 위에 오버레이로 표시:

```typescript
// 활동별 실행 횟수 표시
function applyActivityOverlays(modeler: any, counts: Map<string, ActivityCount>) {
  const overlays = modeler.get('overlays');
  overlays.clear();

  counts.forEach((count, activityId) => {
    overlays.add(activityId, {
      position: { top: -25, left: 0 },
      html: `<div class="activity-count">${count.completed}/${count.total}</div>`
    });
  });
}
```

### 상태 폴링 패턴

```typescript
// 실행 중인 프로세스 자동 새로고침
$effect(() => {
  if (isRunningStatus(monitoring?.statusCode)) {
    const intervalId = setInterval(() => {
      loadMonitoring(monitoringId, true); // silent refresh
    }, 5000);

    return () => clearInterval(intervalId); // cleanup
  }
});
```

### 상태별 폴링 전략

| 상태 | 폴링 간격 | 동작 |
|------|----------|------|
| RUNNING | 3초 | 활성 폴링 |
| STANDBY | 10초 | 느린 폴링 |
| COMPLETED | - | 폴링 중지 |
| FAILED | - | 폴링 중지 |

---

## 참조 문서

### 프로젝트 내부

| 문서 | 설명 |
|------|------|
| `references/auth-flow.md` | **인증 흐름 상세 가이드** |
| `references/tanstack-query-patterns.md` | TanStack Query 패턴 |
| `references/ui-libraries-guide.md` | **Bits UI + SMUI 사용 가이드** |
| `references/testing-guide.md` | Vitest 테스트 가이드 |

### 외부 문서

- [Svelte 5 Documentation](https://svelte.dev/docs)
- [Svelte LLMs.txt](https://svelte.dev/llms.txt) - 에러 발생 시 참조
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Bits UI Documentation](https://bits-ui.com)
- [SMUI Documentation](https://sveltematerialui.com)
