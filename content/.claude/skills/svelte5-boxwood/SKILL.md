---
name: svelte5-boxwood
description: 이 스킬은 BOXWOOD frontend 프로젝트에서 feature 개발, 버그 수정, 컴포넌트 작업 시 반드시 사용한다. "Svelte 컴포넌트 만들어줘", "페이지 구현", "기능 추가", "버그 수정", "오류 해결", "TanStack Query 작업", "BOXWOOD 스타일링", "컴포넌트 테스트 작성", "TDD 사이클 실행", "go" (plan.md와 함께) 요청 시 활성화된다. Svelte 5 Runes, 스토어 패턴, 권한 관리, i18n, TDD 가이드를 제공한다.
context: fork
agent: svelte5-boxwood-developer
---

# BOXWOOD Frontend Development Guide (Svelte 5)

**중요: 모든 응답과 설명은 반드시 한국어로 작성한다.**

**Updated for Svelte 5.37+ / TanStack Query v6 / Vitest 4.x** (February 2026)

## 개요

BOXWOOD는 Svelte 5, TanStack Query v6, 중앙화된 CSS 디자인 시스템으로 구축된 엔터프라이즈 자동화 플랫폼이다. 이 스킬은 컴포넌트 개발, 데이터 페칭, 상태 관리, 스타일링, 그리고 **테스트 주도 개발(TDD)** 패턴을 제공한다.

## Quick Actions

### 코드 생성

```bash
# Feature 모듈 생성
python scripts/generate-feature.py --interactive

# 컴포넌트 생성
python scripts/generate-component.py --name UserCard --type basic
```

### TDD 사이클

```bash
# 다음 테스트 찾기
python scripts/next_test.py

# 테스트 실행
python scripts/run_tests.py

# 테스트 완료 표시
python scripts/update_plan.py "testName"

# 진행 상황 확인
python scripts/tdd_status.py
```

### 개발 서버

```bash
# automation 앱 (로컬 개발, base: /)
pnpm automation:local

# automation 앱 (백엔드 연동, base: /app)
pnpm automation:dev
```

---

## Workflow

### 1. Gather Context (탐색)

```bash
# 프로젝트 구조 확인
ls -la apps/automation/src/features/

# 기존 패턴 참조 (connectors가 가장 완성도 높은 참조 feature)
ls apps/automation/src/features/connectors/
```

### 2. Take Action (실행)

| 작업 | 도구 |
|------|------|
| 새 Feature 모듈 | `generate-feature.py` |
| 새 컴포넌트 | `generate-component.py` |
| API 추가 | 기존 패턴 참조 (`connectors/api/connector.api.ts`) |
| 스타일링 | `boxwood.css` CSS 변수 사용 |

### 3. Verify Work (검증)

```bash
# 단위 테스트
python scripts/run_tests.py

# 타입 체크
pnpm automation:type-check

# 브라우저 테스트
agent-browser open http://localhost:5174
```

### 4. Repeat (반복)

TDD 사이클을 반복하며 기능을 완성한다.

---

## 관련 스킬

| 스킬 | 용도 |
|------|------|
| `/svelte-performance` | 성능 최적화 |
| `/tdd-workflow` | TDD 자동화 |
| `/boxwood-i18n-helper` | i18n 추출/번역 |

---

## 빠른 참조

### 기술 스택

| 분류 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Svelte | 5.37+ (Runes) |
| 빌드 | Turborepo 2.5 + Vite | 7.x |
| 데이터 페칭 | TanStack Query | v6.0.5 |
| 라우팅 | sv-router | v0.10.1 |
| UI 컴포넌트 | bits-ui | v2.11+ |
| 상태 관리 | Nanostores | v0.9.5 |
| i18n | 커스텀 (TanStack Query 기반) | - |
| 테스트 러너 | Vitest | 4.x |
| 컴포넌트 테스팅 | @testing-library/svelte | 5.x |
| API 모킹 | MSW | 2.x |
| E2E 테스트 | Playwright | 1.x |

### 파일 네이밍 컨벤션

| 유형 | 패턴 | 예시 |
|------|------|------|
| 컴포넌트 | PascalCase.svelte | `ConnectorListPage.svelte` |
| 테스트 | PascalCase.test.ts 또는 camelCase.test.ts | `formSchemaParser.test.ts` |
| 스토어 | camelCase.store.ts | `auth.store.ts` |
| 쿼리 | feature.queries.ts | `connector.queries.ts` |
| 뮤테이션 | feature.mutations.ts | `connector.mutations.ts` |
| API | feature.api.ts | `connector.api.ts` |
| 타입 | feature.types.ts | `connector.types.ts` |
| 상수 | feature.constants.ts | `connector-list.constants.ts` |
| 서비스 | feature.service.ts | `connector.service.ts` |
| Composable | useXxx.svelte.ts | `useListFilters.svelte.ts` |

---

## Core Patterns

### Svelte 5 Runes (Required)

```svelte
<script lang="ts">
  // State
  let count = $state(0);
  let items = $state<string[]>([]);

  // Derived
  let doubled = $derived(count * 2);
  let filtered = $derived.by(() => items.filter(i => i.includes(query)));

  // Props
  interface Props {
    title: string;
    onSave?: (data: unknown) => void;
  }
  let { title, onSave }: Props = $props();

  // Bindable
  let { value = $bindable() }: { value: string } = $props();

  // Effect with cleanup
  $effect(() => {
    const timer = setInterval(() => count++, 1000);
    return () => clearInterval(timer);
  });
</script>

<!-- Events: NO colons -->
<button onclick={() => count++}>Click</button>
```

### Forbidden Patterns (Svelte 4)

```svelte
<!-- NEVER use in new code -->
$: doubled = count * 2;           // Use $derived()
export let prop;                  // Use $props()
<button on:click={handler}>       // Use onclick={}
<slot />                          // Use {@render children()}
<slot name="x" />                 // Use {#snippet x()}{/snippet}
```

---

### TanStack Query v6

**Query Key Hierarchy Pattern:**

```typescript
// feature.queries.ts - Query Keys 정의
export const connectorKeys = {
  all: ['connectors'] as const,
  lists: () => [...connectorKeys.all, 'list'] as const,
  list: (filters: Record<string, unknown>) =>
    [...connectorKeys.lists(), filters] as const,
  details: () => [...connectorKeys.all, 'detail'] as const,
  detail: (id: number) => [...connectorKeys.details(), id] as const,
};
```

**QueryBuilder Pattern (Recommended):**

```typescript
// feature.queries.ts
import { QueryBuilder } from '@shared/lib/query/QueryBuilder';

export function createConnectorSearchQuery(
  filter: ConnectorSearchDto = {}
): CreateQueryOptions<ConnectorDto[], Error> {
  return new QueryBuilder<ConnectorDto[], Error>({
    queryKey: connectorKeys.list(filter as Record<string, unknown>),
    queryFn: () => ConnectorApi.search(filter),
  })
    .cacheStrategy('normal')      // 5분 (aggressive: 30분, minimal: 1분, realtime: 폴링)
    .retry(2)
    .build();
}

export function createConnectorDetailQuery(
  id: number
): CreateQueryOptions<ConnectorDto, Error> {
  return new QueryBuilder<ConnectorDto, Error>({
    queryKey: connectorKeys.detail(id),
    queryFn: () => ConnectorApi.getById(id),
  })
    .cacheStrategy('normal')
    .enableIf(!!id && id > 0)     // 조건부 실행
    .retry(3)
    .build();
}
```

**Cache Strategies:**

| 전략 | staleTime | gcTime | 용도 |
|------|-----------|--------|------|
| `aggressive` | 30분 | 1시간 | 목록 페이지 |
| `normal` | 5분 | 30분 | 기본값 |
| `minimal` | 1분 | 5분 | 동적 데이터 |
| `realtime` | 0 | 1분 (10초 폴링) | 모니터링 |

**Component Usage:**

```svelte
<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';

  const connectorsQuery = createQuery(() =>
    createConnectorSearchQuery(filterSync.filters as ConnectorSearchDto)
  );

  let connectors = $derived<ConnectorDto[]>(connectorsQuery.data || []);
  let isLoading = $derived(connectorsQuery.isLoading);
  let error = $derived(connectorsQuery.error?.message || null);
</script>
```

---

### Mutation Pattern

**직접 정의 방식 (프로젝트 표준):**

```typescript
// feature.mutations.ts
import type { CreateMutationOptions } from '@tanstack/svelte-query';
import { queryClient } from '@shared/lib/query/queryClient';
import { connectorKeys } from '../queries/connector.queries';

export function createConnectorCreateMutation(): CreateMutationOptions<
  ConnectorDto,
  Error,
  ConnectorCreateRequestDto
> {
  return {
    mutationFn: (data: ConnectorCreateRequestDto) => ConnectorApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: connectorKeys.lists() });
    },
  };
}

export function createConnectorUpdateMutation(): CreateMutationOptions<
  ConnectorDto,
  Error,
  { id: number; data: ConnectorUpdateRequestDto }
> {
  return {
    mutationFn: ({ id, data }) => ConnectorApi.update(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: connectorKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: connectorKeys.lists() });
    },
  };
}
```

**MutationBuilder (복잡한 케이스):**

```typescript
import { MutationBuilder } from '@shared/lib/query/MutationBuilder';

const mutation = new MutationBuilder(ConnectorApi.create)
  .invalidateQueries(connectorKeys.lists())
  .withNotification('저장되었습니다!', '저장 실패')
  .exponentialBackoff(3)
  .build();
```

---

### API Layer Pattern

```typescript
// feature/api/connector.api.ts
import { createApiClient } from '@utils/api/client';
import { getConfig } from '@env';
import type { ConnectorDto, ConnectorCreateRequestDto } from '../types/connector.types';

export interface ApiResponse<T> {
  list?: T[];
  data?: T;
  resultType: 'SUCCESS' | 'ERROR' | 'FAILURE';
  isFailure: boolean;
  isSuccess: boolean;
  message?: string;
  errorCode?: string;
}

const apiClient = createApiClient();

export const ConnectorApi = {
  search: (filter: ConnectorSearchDto) =>
    apiClient.post<ConnectorDto[]>('/v1/connectors/search', filter),

  getById: (id: number) =>
    apiClient.get<ConnectorDto>(`/v1/connectors/${id}`),

  create: (data: ConnectorCreateRequestDto) =>
    apiClient.post<ConnectorDto>('/v1/connectors', data),

  update: (id: number, data: ConnectorUpdateRequestDto) =>
    apiClient.put<ConnectorDto>(`/v1/connectors/${id}`, data),

  delete: (id: number) =>
    apiClient.delete<void>(`/v1/connectors/${id}`),
};
```

---

### Store Patterns

**Nanostores (Global State) - `atom`/`computed` API:**

```typescript
// auth.store.ts
import { atom, computed } from 'nanostores';

export const authStore = atom<AuthState>({ ...initialState });

// Computed stores
export const currentUser = computed(authStore, auth => auth.user);
export const authLoading = computed(authStore, auth => auth.isLoading);
export const accessToken = computed(authStore, auth => auth.accessToken);
```

**Context Store (Feature Scope) - Svelte 5 Runes:**

```typescript
// store.svelte.ts
import { setContext, getContext } from 'svelte';

const KEY = Symbol('myStore');

function createStore() {
  let state = $state({ count: 0 });
  return {
    get count() { return state.count; },
    increment() { state.count++; },
  };
}

export const initStore = () => setContext(KEY, createStore());
export const useStore = () => getContext<ReturnType<typeof createStore>>(KEY);
```

---

### Composable Patterns

프로젝트에서 사용하는 주요 Composable (`.svelte.ts` 파일):

**useFilterUrlSync (URL 동기화 필터):**

```typescript
import {
  useFilterUrlSync,
  type FilterConfig,
} from '@shared/composables/useFilterUrlSync.svelte';

type ConnectorFilter = {
  nameLike?: string;
  primaryCategory?: string;
  includeInactive?: boolean;
};

const filterConfig: FilterConfig<ConnectorFilter> = {
  nameLike: { type: 'string', urlKey: 'name' },
  primaryCategory: { type: 'string', urlKey: 'category' },
  includeInactive: { type: 'boolean', urlKey: 'includeInactive' },
};

const filterSync = useFilterUrlSync(filterConfig, defaultFilter);
// filterSync.filters - 현재 필터 값
// filterSync.updateFilter('nameLike', value) - 필터 업데이트
```

**useListFilters (필터 칩 관리):**

```typescript
import { useListFilters } from '@shared/composables/useListFilters.svelte';

const { activeFilters, handleRemoveFilter } = useListFilters(
  () => ({ filterCategory, showInactive }),
  {
    filterCategory: {
      resetValue: 'all',
      chipLabel: t('ui.filter.category'),
      chipValue: (v) => categoryOptions.find(o => o.value === v)?.label || v,
      isDefault: (v) => !v || v === 'all',
    },
  },
  {
    filterCategory: (v) => { filterCategory = v; },
  },
  handleSearch,
);
```

**useListDetailNavigation (목록-상세 네비게이션):**

```typescript
import {
  navigateToDetail,
  restoreScrollPosition,
} from '@shared/composables/useListDetailNavigation.svelte';
```

---

### Permission Management (3-Tier + PagePermission)

```
┌─────────────────────────────────────────────────────┐
│ Tier 0: Permission Registry                         │
│ - registerFeaturePermissions() 로 권한 선언          │
│ - PagePermissionProvider가 라우트별 자동 해석         │
├─────────────────────────────────────────────────────┤
│ Tier 1: UI Layer (navigation.store.ts)              │
│ - Menu visibility                                   │
│ - permissionSets 기반 (hasPermission)               │
├─────────────────────────────────────────────────────┤
│ Tier 2: Route Layer (routePermissions.ts)           │
│ - URL access control                                │
│ - 403 redirect                                      │
├─────────────────────────────────────────────────────┤
│ Tier 3: Component Layer (getPagePermissions)        │
│ - Button/action enable/disable                      │
│ - Conditional rendering                             │
└─────────────────────────────────────────────────────┘
```

**Feature 권한 등록 패턴:**

```typescript
// permissions/connectorPagePermissions.ts
import {
  registerFeaturePermissions,
  type FeaturePermissionMap,
} from '@shared/auth/registry/pagePermissionRegistry';
import { MENU_PERMISSIONS, UI_PERMISSIONS } from '@shared/auth/constants/permissions';

export const CONNECTOR_PAGE_PERMISSIONS: FeaturePermissionMap = {
  list: {
    canCreate: { type: 'feature', permission: UI_PERMISSIONS.CONNECTOR_CREATE },
    canDelete: { type: 'feature', permission: UI_PERMISSIONS.CONNECTOR_DELETE },
  },
  detail: {
    canEdit: { type: 'feature', permission: UI_PERMISSIONS.CONNECTOR_EDIT },
  },
};

registerFeaturePermissions('connectors', CONNECTOR_PAGE_PERMISSIONS, {
  routes: [
    { pattern: '/connectors', page: 'list' },
    { pattern: '/connectors/:id', page: 'detail' },
  ],
});
```

**Page에서 권한 사용:**

```svelte
<script lang="ts">
  import { getPagePermissions } from '@shared/auth';

  const perms = getPagePermissions();
  // perms.canCreate, perms.canEdit, perms.canDelete 등
</script>

{#if perms.canCreate}
  <EcoletreeButton onclick={handleNew}>New</EcoletreeButton>
{/if}
```

---

### i18n (커스텀 TanStack Query 기반)

```svelte
<script lang="ts">
  // 방법 1: barrel export (권장)
  import { t } from '@shared/i18n';

  // 방법 2: 직접 import
  import { t } from '@shared/i18n/services/i18nService';
</script>

<!-- 기본 사용 -->
<h1>{t('ui.page.dashboard.title')}</h1>

<!-- 폴백 지정 -->
<button>{t('ui.action.save', 'Save')}</button>

<!-- 파라미터 -->
<p>{t('ui.message.items-count', undefined, { 0: items.length })}</p>

<!-- Code Label (공통코드 번역) -->
<script lang="ts">
  import { tCode, useCodeLabel } from '@shared/i18n';

  // 비반응형
  const label = tCode('MD10101000');

  // 반응형 (컴포넌트 내부)
  const { tCode: reactiveT } = useCodeLabel();
  let code = $state('MD10101000');
  const reactiveLabel = $derived(reactiveT(code));
</script>
```

---

### Router Pattern (sv-router)

```typescript
// 타입-안전 네비게이션
import { paths, navigate, navigateTo, navigateHard } from '@router/router';

// navigateTo: sv-router의 navigate 래퍼 (SPA 네비게이션)
navigateTo.connectors.list();
navigateTo.connectors.detail(connectorId);
navigateTo.processes.detail(id, versionNumber, 'overview');

// navigateHard: window.location.href 사용 (쿼리 파라미터 포함 시)
navigateHard(`/monitoring?status=RUNNING`);

// paths: URL 생성만 (네비게이션 안 함)
const detailUrl = paths.connectors.detail(123);
```

**라우트 가드:**

```typescript
// router/hooks.ts - beforeEach
// 1. 비인증 경로 (/login 등) -> 허용
// 2. 인증 확인 -> 미인증 시 /auth/login 리다이렉트
// 3. 권한 확인 -> 권한 없음 시 /forbidden
```

---

### Toast & Confirm Services

```typescript
// Toast 알림
import { toastService } from '@shared/lib/toast/toastService';

toastService.success('저장되었습니다!');
toastService.error('오류가 발생했습니다.');
toastService.apiError({ errorCode: 'error.not-found', message: 'Not found' });

// 확인 다이얼로그
import { confirmService } from '@shared/services/confirmService';
// 또는 @ui의 confirmService 직접 사용
```

---

## Project Structure

```
frontend/
├── apps/
│   ├── automation/                # 메인 Svelte 5 앱
│   ├── system-management/         # 시스템 관리 앱
│   └── ecoletree-ui-system/       # UI 컴포넌트 쇼케이스
├── packages/
│   ├── ui/                        # @repo/ui - 공유 UI 컴포넌트
│   ├── utils/                     # @repo/utils - 유틸리티 & API 클라이언트
│   ├── bpmn/                      # @repo/bpmn - BPMN.js 래퍼
│   ├── forms/                     # @repo/forms - 폼 유틸리티
│   └── domains/                   # @repo/domains - 도메인 모델
└── turbo.json                     # Turborepo 파이프라인

apps/automation/src/
├── config/             # 환경 설정 (@env alias)
│   └── env.ts
├── features/           # Business modules (18+)
│   ├── connectors/     # 참조 feature (가장 완성도 높음)
│   ├── processes/
│   ├── monitoring/
│   ├── servicetasks/
│   ├── llm-tasks/
│   ├── roles/
│   ├── dashboard/
│   ├── settings/
│   ├── task-list/
│   ├── email-templates/
│   ├── notifications/
│   ├── credentials/
│   ├── adaptive-cards/
│   ├── tenants/
│   ├── templates/
│   ├── profile/
│   └── dev/
├── shared/             # Common modules
│   ├── api/            # API 유틸리티, queryFactory
│   ├── auth/           # 인증, 권한, PagePermission
│   │   ├── stores/     # auth.store.ts, userRoles.store.ts
│   │   ├── context/    # PagePermissionContext, Provider
│   │   ├── hooks/      # usePermission
│   │   ├── registry/   # pagePermissionRegistry
│   │   ├── constants/  # MENU_PERMISSIONS, UI_PERMISSIONS
│   │   └── utils/      # permissionChecker, permissionResolver
│   ├── components/     # 공통 컴포넌트 (EmptyState, ErrorMessage, 모달 등)
│   ├── composables/    # useFilterUrlSync, useListFilters, useTimezone 등
│   ├── i18n/           # i18n 서비스 (TanStack Query 기반)
│   ├── lib/            # QueryBuilder, MutationBuilder, queryClient
│   │   ├── query/      # QueryBuilder.ts, MutationBuilder.ts, queryClient.ts
│   │   ├── toast/      # toastService 래퍼
│   │   ├── cookie/
│   │   └── schema/
│   ├── services/       # alertService, bootDataService, confirmService
│   ├── queries/
│   ├── types/
│   └── utils/          # errorUtils, date-formatter, validation
├── stores/             # Global stores
│   └── navigation.store.ts
├── router/             # sv-router config
│   ├── router.ts       # paths, navigateTo, navigateHard, routes
│   ├── hooks.ts        # beforeEach, afterLoad 가드
│   └── routePermissions.ts
└── styles/             # Centralized CSS
    ├── boxwood.css     # 메인 진입점 (imports only)
    ├── core/           # variables.css, reset.css, animations.css
    ├── components/     # buttons, cards, forms, tables, modals 등
    ├── utilities/      # layout, spacing, responsive
    ├── vendors/        # smui-overrides
    └── features/

packages/ui/src/lib/
├── basic/
│   ├── inputs/         # EcoletreeInput, Select, Combobox, Checkbox, Button 등
│   ├── feedback/       # EcoletreeAlert, Badge, Chip, LoadingSpinner 등
│   ├── layout/         # EcoletreeFormRow, FormSection, FormActions, Separator
│   └── navigation/     # EcoletreeBreadcrumb, Tabs
├── composite/          # EcoletreeDataGrid, Modal, FilterBar, Pagination, TreeView 등
├── layout/             # EcoletreeListPageLayout, DetailPageLayout, MainLayout 등
├── services/           # confirmService, toastService
├── types/              # 컴포넌트 타입 정의
├── internal/           # 내부 헬퍼 (cronHelpers, inputHelpers, jsonSchemaParser)
└── shared/auth/        # UIPermissionContext, usePermissionDisabled
```

---

## Import Aliases

```typescript
// UI 컴포넌트 (packages/ui)
import { EcoletreeButton, EcoletreeDataGrid, EcoletreeListPageLayout } from '@ui';
import type { BreadcrumbItem, ColumnDef } from '@ui';

// 유틸리티 (packages/utils)
import { createApiClient } from '@utils/api/client';

// 환경 설정
import { getConfig, isProduction } from '@env';

// Feature 내부
import type { ConnectorDto } from '@features/connectors/types';
import { ConnectorApi } from '@features/connectors/api/connector.api';

// Shared 모듈
import { authStore, getPagePermissions } from '@shared/auth';
import { t, tCode, useCodeLabel } from '@shared/i18n';
import { QueryBuilder } from '@shared/lib/query/QueryBuilder';
import { queryClient, clearAllQueries } from '@shared/lib/query/queryClient';
import { toastService } from '@shared/lib/toast/toastService';
import { useFilterUrlSync } from '@shared/composables/useFilterUrlSync.svelte';
import { useListFilters } from '@shared/composables/useListFilters.svelte';

// 라우터
import { paths, navigate, navigateTo, navigateHard } from '@router/router';
```

---

## Styling Rules

### Design Token Layer

```
Layer 1: tokens-base.css            (Universal palette: neutral-*, primary-*)
Layer 2: tokens-brand-customize.css (Brand colors: --brand-primary-*, DWP 커스터마이징)
Layer 3: tokens-semantic.css        (Purpose-based: --color-text-*, --color-bg-*)
Layer 4: boxwood.css                (Components: boxwood-card, boxwood-btn 등)
```

### CSS Variable Usage

```svelte
<!-- GOOD -->
<div class="boxwood-card">
  <h3 class="boxwood-card-title">{title}</h3>
</div>

<!-- BAD -->
<div style="background: white; padding: 16px;">
  <h3 style="color: #333;">{title}</h3>
</div>
```

### Key Variables

```css
/* BOXWOOD Semantic Variables (variables.css에서 정의) */

/* Brand - Layer 2 토큰 참조 */
--boxwood-primary: var(--brand-primary-500);     /* Execute/Run 버튼 */
--boxwood-secondary: var(--brand-secondary-500); /* New 버튼 */

/* Status */
--boxwood-success: var(--brand-success);   /* 성공/활성 */
--boxwood-warning: var(--brand-warning);   /* 경고/Save */
--boxwood-error: var(--brand-danger);      /* 에러/필수 */
--boxwood-info: var(--brand-info);         /* 정보/처리중 */

/* Neutral */
--boxwood-dark: var(--neutral-900);        /* 주 텍스트 */
--boxwood-medium: var(--neutral-600);      /* 보조 텍스트 */
--boxwood-light: var(--neutral-50);        /* 컨텐츠 배경 */
--boxwood-white: var(--neutral-0);         /* 카드/입력 배경 */
--boxwood-border: var(--neutral-200);      /* 테두리 */

/* Spacing */
--boxwood-spacing-xs: 4px;
--boxwood-spacing-sm: 8px;
--boxwood-spacing-md: 16px;
--boxwood-spacing-lg: 24px;
--boxwood-spacing-xl: 32px;

/* Typography */
--boxwood-font-primary: var(--font-family-primary); /* Noto Sans KR */
--boxwood-text-xs: 12px;
--boxwood-text-sm: 13px;
--boxwood-text-base: 14px;
--boxwood-text-lg: 16px;

/* Border Radius */
--boxwood-radius-sm: 4px;
--boxwood-radius-md: 8px;
--boxwood-radius-lg: 16px;

/* Shadows */
--boxwood-shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.05);
--boxwood-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);
```

---

## UI Components

### Page Layout with Snippets

```svelte
<script lang="ts">
  import { EcoletreeListPageLayout, type BreadcrumbItem } from '@ui';
  import { t } from '@shared/i18n';

  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('ui.common.home', 'Home'), href: '/', icon: 'home' },
    { label: t('ui.page.connector.title', 'Connectors') },
  ];
</script>

<EcoletreeListPageLayout title={t('ui.page.connector.title')} {breadcrumbs}>
  {#snippet headerActions()}
    <EcoletreeButton onclick={handleNew}>
      {t('ui.action.new')}
    </EcoletreeButton>
  {/snippet}

  {#snippet filters()}
    <EcoletreeFilterBar {activeFilters} onRemoveFilter={handleRemoveFilter}>
      <EcoletreeInput bind:value={searchQuery} />
      <EcoletreeSelect {options} bind:value={filterCategory} />
    </EcoletreeFilterBar>
  {/snippet}

  {#snippet content()}
    <EcoletreeDataGrid data={gridData} {columns} />
  {/snippet}
</EcoletreeListPageLayout>
```

### Input Components

```svelte
<!-- Variants: border, underline, floating, pill -->
<EcoletreeInput variant="border" label="Name" bind:value={name} error={errors.name} />
<EcoletreeSelect variant="border" label="Category" {options} bind:value={selected} />
<EcoletreeCombobox label="Search" bind:value={search} {options} />
<EcoletreeMultiSelect label="Tags" {options} bind:value={selectedTags} />
<EcoletreeCheckbox label="Active" bind:checked={isActive} />
<EcoletreeSwitch label="Enable" bind:checked={enabled} />
<EcoletreeButton variant="primary" onclick={handler}>Save</EcoletreeButton>
```

### Feedback Components

```svelte
import { EmptyState, ErrorMessage, LoadingIndicator } from '@shared/components';

{#if isLoading}
  <LoadingIndicator />
{:else if error}
  <ErrorMessage message={error} />
{:else if items.length === 0}
  <EmptyState message={t('ui.message.no-data')} />
{:else}
  <!-- content -->
{/if}
```

---

## List Page 실전 패턴

ConnectorListPage를 기반으로 한 완전한 리스트 페이지 구현 패턴:

```svelte
<script lang="ts">
  import { createQuery, useQueryClient } from '@tanstack/svelte-query';
  import {
    EcoletreeButton,
    EcoletreeDataGrid,
    EcoletreeListPageLayout,
    EcoletreeFilterBar,
    EcoletreeSelect,
    type BreadcrumbItem,
  } from '@ui';
  import { navigateTo, paths } from '@router/router';
  import { navigateToDetail, restoreScrollPosition } from '@shared/composables/useListDetailNavigation.svelte';
  import { t } from '@shared/i18n';
  import { getPagePermissions } from '@shared/auth';
  import { useFilterUrlSync, type FilterConfig } from '@shared/composables/useFilterUrlSync.svelte';
  import { useListFilters } from '@shared/composables/useListFilters.svelte';
  import { createConnectorSearchQuery } from '../queries/connector.queries';
  import { getConnectorColumns } from '../constants/connector-list.constants';

  // 1. Permission
  const perms = getPagePermissions();

  // 2. Breadcrumbs
  const breadcrumbs: BreadcrumbItem[] = [
    { label: t('ui.common.home', 'Home'), href: '/', icon: 'home' },
    { label: t('ui.page.connector.title', 'Connectors') },
  ];

  // 3. URL-Synced Filters
  const filterSync = useFilterUrlSync(filterConfig, defaultFilter);

  // 4. Local State (bound to form)
  let searchQuery = $state(filterSync.filters.nameLike || '');

  // 5. TanStack Query
  const query = createQuery(() =>
    createConnectorSearchQuery(filterSync.filters)
  );
  let data = $derived(query.data || []);
  let isLoading = $derived(query.isLoading);

  // 6. Filter Chips
  const { activeFilters, handleRemoveFilter } = useListFilters(...);

  // 7. Actions
  function handleSearch() {
    filterSync.updateFilter('nameLike', searchQuery || undefined);
  }
</script>
```

---

## Migration (Svelte 4 -> 5)

| Svelte 4 | Svelte 5 |
|----------|----------|
| `export let prop` | `let { prop } = $props()` |
| `$: derived = x * 2` | `let derived = $derived(x * 2)` |
| `on:click={handler}` | `onclick={handler}` |
| `<slot />` | `{@render children()}` |
| `<slot name="x" />` | `{@render x?.()}` |
| `createEventDispatcher` | callback props (`onXxx`) |
| `writable()` (svelte/store) | `$state()` 또는 `atom()` (nanostores) |

---

## CSP (Content Security Policy) Compatibility

백엔드에서 CSP 헤더가 적용되어 있습니다. Frontend 개발 시 반드시 준수해야 합니다.

### 현재 CSP 설정

| Directive | 허용된 값 | 설명 |
|-----------|----------|------|
| `script-src` | `'self' 'wasm-unsafe-eval' blob:` | 외부 스크립트 CDN 사용 불가 |
| `style-src` | `'self' 'unsafe-inline' fonts.googleapis.com cdn.jsdelivr.net` | 인라인 스타일 허용 |
| `font-src` | `'self' data: fonts.googleapis.com fonts.gstatic.com cdn.jsdelivr.net` | Google Fonts, Material Icons 허용 |
| `connect-src` | `'self' fonts.googleapis.com fonts.gstatic.com` | API는 동일 도메인만 |
| `img-src` | `'self' data: https: blob:` | 모든 HTTPS 이미지 허용 |
| `worker-src` | `'self' blob:` | Web Worker blob URL 허용 |
| `frame-ancestors` | `'none'` | iframe 삽입 불가 |

### CSP 위반 시 대응

| 문제 | 해결 방법 |
|------|----------|
| 외부 스크립트 로딩 실패 | 패키지로 설치 (`pnpm add`) 후 import |
| 외부 API 호출 차단 | 백엔드 프록시 API 구현 요청 |
| 새 폰트/아이콘 CDN 필요 | `application-security.yml` CSP 설정 수정 요청 |

---

## Code Generation Scripts

### Generate Feature Module

```bash
# Interactive mode
python scripts/generate-feature.py --interactive

# Direct mode
python scripts/generate-feature.py \
  --name connector \
  --entity Connector \
  --base-url /v1/connectors \
  --output ./apps/automation/src
```

**Generated files:**
- `types/{feature}.types.ts` - DTOs, UI types, Props
- `api/{feature}.api.ts` - API client class
- `queries/{feature}.queries.ts` - Query keys + TanStack Query functions
- `mutations/{feature}.mutations.ts` - Mutation functions
- `permissions/{feature}PagePermissions.ts` - Permission config + registration
- `pages/{Entity}ListPage.svelte` - List page
- `pages/{Entity}DetailPage.svelte` - Detail page
- `services/{feature}.service.ts` - Business logic (optional)
- `constants/{feature}-list.constants.ts` - DataGrid 컬럼 정의 등

### Generate Component

```bash
python scripts/generate-component.py --name UserCard --type basic
python scripts/generate-component.py --name DataPanel --type composite
python scripts/generate-component.py --name DashboardPage --type page
```

---

## TDD 워크플로우

Kent Beck의 Red-Green-Refactor 사이클을 따른다.

### TDD 스크립트

| 스크립트 | 용도 | 명령어 |
|----------|------|--------|
| `next_test.py` | 다음 미완료 테스트 찾기 | `python scripts/next_test.py` |
| `run_tests.py` | Vitest 테스트 실행 | `python scripts/run_tests.py` |
| `update_plan.py` | 테스트 완료 표시 | `python scripts/update_plan.py "testName"` |
| `tdd_status.py` | 진행 상황 표시 | `python scripts/tdd_status.py` |

### "go" 명령 워크플로우

사용자가 "go"라고 말하면 다음 사이클을 실행한다:

1. **다음 테스트 찾기**: `python scripts/next_test.py`
2. **RED**: 실패하는 테스트 작성
3. **테스트 실행**: `python scripts/run_tests.py` (실패 확인)
4. **GREEN**: 테스트 통과하는 최소 코드 작성
5. **테스트 실행**: `python scripts/run_tests.py` (성공 확인)
6. **계획 업데이트**: `python scripts/update_plan.py "testName"`
7. **REFACTOR**: 필요시 구조 개선 (테스트 GREEN 유지)
8. **상태 보고**: `python scripts/tdd_status.py`

### 컴포넌트 테스트 예시

```typescript
import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import UserCard from './UserCard.svelte';

describe('UserCard', () => {
  it('사용자 이름이 제공되면 표시해야 한다', () => {
    render(UserCard, { props: { name: 'John Doe' } });
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('클릭하면 onclick 핸들러를 호출해야 한다', async () => {
    const handleClick = vi.fn();
    render(UserCard, { props: { onclick: handleClick } });
    await fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

### 서비스/유틸리티 테스트 예시

```typescript
import { describe, it, expect } from 'vitest';
import { parseFormSchema, type JSONSchema } from './formSchemaParser';

describe('formSchemaParser', () => {
  it('shouldParseBasicStringField', () => {
    const schema: JSONSchema = {
      type: 'object',
      properties: {
        name: { type: 'string', title: '이름' },
      },
    };

    const result = parseFormSchema(schema);

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      key: 'name',
      type: 'text',
      label: '이름',
    });
  });
});
```

### 테스트 네이밍 컨벤션

| 패턴 | 예시 |
|------|------|
| `should{결과}When{조건}` | `shouldShowErrorWhenInputEmpty` |
| `should{동작}Given{상태}` | `shouldDisableButtonGivenLoading` |

---

## 브라우저 테스트 (agent-browser)

컴포넌트 개발 후 실제 브라우저에서 시각적 검증이 필요할 때 사용한다.

### 기본 워크플로우

```bash
# 1. 개발 서버 시작 (백그라운드)
pnpm automation:local &

# 2. 페이지 열기
agent-browser open http://localhost:5174

# 3. 대화형 요소 확인
agent-browser snapshot -i

# 4. 상호작용 테스트
agent-browser fill @e2 "테스트 입력"
agent-browser click @e1

# 5. 결과 확인
agent-browser screenshot /tmp/test-result.png
```

---

## 추가 리소스

### 참조 문서

상세 패턴과 명세:

- **[QUICK_REFERENCE.md](references/QUICK_REFERENCE.md)** - Runes, 쿼리, 스토어, CSS 변수 치트시트
- **[COMPONENT_DEVELOPMENT_GUIDE.md](references/COMPONENT_DEVELOPMENT_GUIDE.md)** - bits-ui 컴포넌트 개발, 4가지 variant, 포커스 상태
- **[DESIGN_TOKEN_ARCHITECTURE.md](references/DESIGN_TOKEN_ARCHITECTURE.md)** - 다층 토큰 시스템, 테마 커스터마이징
- **[DWP_DESIGN_TOKEN.md](references/DWP_DESIGN_TOKEN.md)** - 전체 색상 팔레트, 타이포그래피 시스템
- **[testing-patterns.md](references/testing-patterns.md)** - Svelte 5 테스팅 패턴, $state/$derived/$effect 테스트
- **[vitest-setup.md](references/vitest-setup.md)** - Vitest 설정 가이드
- **[msw-handlers.md](references/msw-handlers.md)** - MSW 목 핸들러 예제

### 외부 링크

- TanStack Query: https://tanstack.com/query/latest
- Vitest: https://vitest.dev
- Testing Library: https://testing-library.com/docs/svelte-testing-library
- MSW: https://mswjs.io

---

## Best Practices

### Feature 조직 구조

```
apps/automation/src/features/{feature}/
├── pages/              # 라우트 페이지 (PascalCase.svelte)
├── components/         # Feature 전용 컴포넌트
│   └── cells/          # DataGrid 셀 컴포넌트
├── api/                # API 클라이언트 (feature.api.ts)
├── queries/            # TanStack Query (feature.queries.ts, index.ts)
├── mutations/          # Mutation (feature.mutations.ts)
├── types/              # TypeScript 타입 (feature.types.ts, index.ts)
├── permissions/        # 권한 설정 (featurePagePermissions.ts, index.ts)
├── constants/          # 상수, DataGrid 컬럼 정의
├── services/           # 비즈니스 로직 (선택)
├── utils/              # 유틸리티 함수 (선택)
└── data/               # 목업/테스트 데이터 (선택)
```

### 코드 품질 체크리스트

- [ ] Svelte 5 Runes 사용 (`$state`, `$derived`, `$props`)
- [ ] TanStack Query로 서버 상태 관리 (QueryBuilder 사용)
- [ ] `boxwood.css` CSS 변수 사용 (하드코딩 금지)
- [ ] TypeScript 타입 정의
- [ ] i18n 키 사용 (`t()` - 하드코딩 금지)
- [ ] 권한 체크 적용 (`getPagePermissions()`)
- [ ] 로딩/에러/빈 상태 처리
- [ ] 테스트 코드 작성
- [ ] CSP 위반 없음

---

## Troubleshooting

### 자주 발생하는 문제

| 문제 | 원인 | 해결 |
|------|------|------|
| `$state is not defined` | Svelte 4 문법 사용 | `<script lang="ts">` 확인, Svelte 5 Runes 사용 |
| 쿼리가 실행되지 않음 | `enabled: false` | `enableIf()` 조건 확인 |
| 스타일 적용 안됨 | 잘못된 클래스명 | `boxwood-*` 클래스 확인, devtools 검사 |
| CSP 위반 | 외부 스크립트/API | 패키지로 설치 또는 백엔드 프록시 요청 |
| 테스트 실패 | jsdom 환경 차이 | `@testing-library/svelte` 5.x 사용 |
| `effect_update_depth_exceeded` | `$effect` 내부 무한 루프 | `untrack()` 사용, 아래 패턴 참조 |
| UI 전체 freeze | `$effect` 무한 루프 | 여러 `$effect` 통합, `untrack()` 사용 |
| 쿼리 파라미터 네비게이션 안됨 | sv-router 인코딩 이슈 | `navigateHard()` 사용 |

### $effect 무한 루프 방지 패턴

`$effect` 내부에서 상태를 변경하면 effect가 재트리거되어 무한 루프가 발생할 수 있다.

**문제 패턴 1: effect 내부 상태 변경**

```typescript
// BAD: 무한 루프 발생
let previousValue = $state<string | null>(null);

$effect(() => {
  if (previousValue !== currentValue) {
    previousValue = currentValue; // effect 재트리거!
    doSomething();
  }
});
```

**해결: untrack() 사용**

```typescript
import { untrack } from 'svelte';

// GOOD: untrack으로 안전하게 처리
$effect(() => {
  const captured = currentValue; // 의존성 캡처

  untrack(() => {
    if (previousValue !== captured) {
      previousValue = captured; // 재트리거 방지
      doSomething();
    }
  });
});
```

**문제 패턴 2: 여러 effect가 같은 상태를 읽고 씀**

```typescript
// BAD: 여러 effect가 validationErrors를 서로 트리거
$effect(() => {
  validationErrors = clearError(validationErrors, 'name', nameValid);
});
$effect(() => {
  validationErrors = clearError(validationErrors, 'email', emailValid);
});
```

**해결: 하나의 effect로 통합**

```typescript
// GOOD: 하나의 effect로 통합
$effect(() => {
  const nameValid = name.length > 0;
  const emailValid = email.includes('@');

  let errors = { ...validationErrors };
  if (errors['name'] && nameValid) delete errors['name'];
  if (errors['email'] && emailValid) delete errors['email'];

  if (JSON.stringify(errors) !== JSON.stringify(validationErrors)) {
    validationErrors = errors;
  }
});
```

**문제 패턴 3: Snippet에 전달된 $state 배열이 업데이트 안 됨**

```typescript
// BAD: 배열 재할당이 snippet 내부에서 반영 안 됨
let options = $state(getOptions('A'));

function handleChange(category: string) {
  options = getOptions(category); // UI 업데이트 안 됨!
}
```

**해결: 배열 직접 변경 + tick()**

```typescript
import { tick } from 'svelte';

// GOOD: 배열 직접 변경으로 반응성 트리거
async function handleChange(category: string) {
  const newOptions = getOptions(category);
  options.length = 0;
  options.push(...newOptions);
  await tick(); // DOM 업데이트 대기
}
```

### 디버깅 명령어

```bash
# 타입 체크
pnpm automation:type-check

# 린트 확인
pnpm lint

# 테스트 실행 (vitest 직접 호출 - 모노레포에서 가장 확실한 방법)
cd apps/automation && node_modules/.bin/vitest run [필터]

# 예시: 특정 테스트 파일 실행
cd apps/automation && node_modules/.bin/vitest run ioParameterUtils parameterTreeBuilder

# 테스트 UI 모드
cd apps/automation && node_modules/.bin/vitest --ui
```

> **주의**: 이 모노레포에서 `vitest` 바이너리는 `frontend/apps/automation/node_modules/.bin/`에만 설치되어 있다. `frontend/` 루트나 `frontend/packages/*/`에서는 `npx vitest`나 `pnpm automation:test`로 실행되지 않을 수 있다. 항상 `apps/automation` 디렉토리에서 직접 바이너리를 호출하는 것이 가장 안정적이다.
