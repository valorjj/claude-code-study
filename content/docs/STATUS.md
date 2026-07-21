# 구현 상태 원장 (STATUS) — process-governance

> **이 문서의 역할 (B8 — 상태 원장):** 날짜가 붙는 *구현 현황*을 **한 곳**에 모은다.
> 각 SSOT 스펙(아키텍처·제품 정의·IA)은 *timeless*로 유지하고, "지금 무엇이 되어 있나"는
> 여기서 본다. SSOT가 **무엇을/왜**라면, 이 원장은 **어디까지 됐나**다.
>
> **갱신일:** 2026-07-08 · 브랜치 `assets/design-p0p1`. 상태를 고칠 때 날짜를 함께 적는다.
> **상세 원장(중복 금지 — 여기서 링크만):** IA는
> [`product/2026-06-24-ia-implementation-plan.ko.md`](product/2026-06-24-ia-implementation-plan.ko.md)(as-built),
> 진단·개선 항목은 [`product/2026-06-25-consultant-review.ko.md`](product/2026-06-25-consultant-review.ko.md),
> 도구 리뷰는 System Guide(`src/features/guide`).
>
> 범례: ✅ 구현 · ⏳ 계획/부분 · ❌ 의도적 미구현(mock-only, req#1).

---

## 1. 아키텍처 (top priority — SSOT는 [`architecture/`](architecture/))

| 관심사 | 상태 | SSOT |
|---|---|---|
| BFF (SvelteKit adapter-node, **stateless**) | ✅ | [bff-sse](architecture/bff-sse.md) · [system-overview](architecture/system-overview.md) |
| SSE 전송 (POST→SSE · 이벤트 6종 · 15s keep-alive) | ✅ | [bff-sse](architecture/bff-sse.md) |
| 에이전트 루프 (2-turn 함수콜 · maxToolRounds=8) | ✅ | [bff-sse](architecture/bff-sse.md) |
| 도구 레지스트리 (admin 시임 · enable/통계) | ✅ 레지스트리 · ⏳ admin UI 미구현 | [bff-sse](architecture/bff-sse.md) |
| 도구 오류/수정 계약 (throw → ok:false → 자기수정) | ✅ | [bff-sse](architecture/bff-sse.md) |
| 컨텍스트 시임 (catalog/focusedDetails per-turn) | ✅ · **시드는 host 소유**(`lib/server/mock`) · agent-core 도메인 데이터 0 (a4c7a242) | [bff-sse](architecture/bff-sse.md) |
| LLM 추상화 (`LLMProvider`) | ✅ Gemini · ⏳ Claude (설정 한 줄, 미전환) | [bff-sse](architecture/bff-sse.md) |
| 런타임 경계 (`isExecutable="false"`) | ✅ 코드 강제(`shared/lib/bpmnXml.ts`) | [runtime-boundary](architecture/runtime-boundary.md) |
| **DSL 의도 레이어 (keystone)** | ⏳ v0 + projection 다수 — 실행모델 **YAML-first 확정**(2026-06-26, §4.5). `src/shared/dsl/`: intent·analyze·**YAML codec(parseYaml/toYaml, 무손실)·fromBpmn/fromVersion·toBpmn(W0; topology, 기하는 `bpmnAutoLayout` seam; `fromBpmn(toBpmn(i))≡i`)·diff·validate(W1)** ✅ (test 34) — **YAML⇄Intent⇄BPMN 루프 양방향 TS 동작**. **UI 연결 ✅**: diff→버전 비교 모달(VersionsTab `10ddcbd0`) + **캔버스 시각 오버레이**(목록/캔버스 토글, 추가=success/변경=accent 마킹, `BpmnDiffView`, `d42fad59`) · validate→§8.2 검증 strip(논리 검사 unreachable/loop/parallel, `0151a7aa`). **DSL v1 — loop (multi-instance/standard) + custom props shipped (round-trip · validate · diff).** **compile(실행 메타 주입 — `execution.ts` inert)·migration [TARGET]** | [dsl-intent-layer](architecture/dsl-intent-layer.md) · [dsl-schema-v0](architecture/dsl-schema-v0.md) |
| 감사로그 · 버전 복원 (append-only) | ✅ Wave 3 — `restoreVersion`(원본 복사 새 버전, `restoredFrom`) + `buildAuditLog`(versions+lifecycle+retirement 파생 뷰) · VersionsTab 복원 버튼 + AuditLog 타임라인 | [audit-and-restore](architecture/audit-and-restore.md) |
| 알림 · 승인 | ✅ Wave 3 — 승인엔진(`applyDecision`+StageDetailModal) 재사용 · TopNav 글로벌 알림 벨 = `buildNotifications` 파생 뷰(내 승인/코멘트/제안) | [notifications-and-approval](architecture/notifications-and-approval.md) |
| 모델링 싼 언락 (항해) | ✅ Wave 3 — Call-Activity 클릭스루(편집 캔버스 더블클릭+strip/모달 "열기" → `calledElement` 대상 새 탭). 키보드 단축키는 공유 bpmn-js Modeler가 **이미 제공**(재주입 안 함). 스윔레인/XML I/O는 보류(공유 패키지 config-gate 필요) | [modeling-unlocks](architecture/modeling-unlocks.md) |
| 영속 (IndexedDB) | ✅ mock-only (req#1) | [system-overview](architecture/system-overview.md) |
| Kotlin 백엔드 (DTO/DB/auth/AI-connection) | ❌ 미연결 (의도적, **정책 정의 후**) · 경계 문서화 · process-assets POC 제거(kotlin `b77470e7`) | [backend-boundary](architecture/backend-boundary.md) |

## 2. 에이전트 도구 (11종)

- ✅ 동작: `propose_process_hierarchy` · `draw_bpmn`/`update_bpmn` · `create_task`/`update_task` · `create_sop`/`update_sop` · `export_presentation` · `navigate_to` · `search_assets` · `get_asset`.
- ✅ 2026-06-25: navigate routes-as-data(`APP_ROUTES`) · BPMN throw 계약 · **A3 신뢰층**(제안 근거 `Artifact.rationale` + update-task diff, 커밋 `5fa16cf3`).
- 상세: [consultant-review](product/2026-06-25-consultant-review.ko.md) · System Guide.

## 3. IA (사이드바·랜딩·자산 상세)

- ✅ Phase 1–5 + "새 프로세스" CTA 통일 + 역할 게이팅(DEMO) 전부 반영.
- **상세 as-built 원장 = [ia-implementation-plan](product/2026-06-24-ia-implementation-plan.ko.md)** — 거기서 본다(중복 금지).

## 4. 제품 MVP — 코모디티 vs 모트

- ✅ **코모디티(생성):** 에이전트가 process·task·SOP를 propose→save로 실제 생성(라이브 검증).
- ✅ **A3 신뢰 어포던스:** P1 제안 근거 · P2 update-task diff (mockup-now 격상·구현, `5fa16cf3`).
- ⏳ **모트(미증명):** 거버넌스-오버-타임 · 의미검색 = 목업 범위 증명 대상(미증명).
- ⏳ **automation 컴파일:** 의도적 장기 보류(~3개월) — 목업은 "automation 가능" 토글로 *개념만* 대표.
- 기준·합격 시험: [product-definition](product/2026-06-24-product-definition.ko.md) §3·§5.

## 5. 디자인 언어 (design language overhaul)

- ✅ 2026-07-08, 브랜치 `assets/design-p0p1`: Phase 0(kill-list sweep) + Phase 1(ink ramp · categorical 색상 demotion · 4단계 타입 스케일 · density tiers · design guards) shipped(merge `e74da329d`→assets/main). 스펙: [design-language-overhaul](superpowers/specs/2026-07-08-design-language-overhaul-design.md).
- ✅ 2026-07-08, 브랜치 `assets/design-p2`: Phase 2(Explorer flagship) — 캐노니컬 `AssetTree`(3중 구현 통합) · 공용 `AssetDetailPanel` · 컨트롤 스트립 1줄화(내보내기 overflow) · name-first 목록 행+hover preview · 트리 재구성(810→504줄) · 매트릭스 intensity ramp · 죽은 컴포넌트/CSS 삭제 · hex baseline 축소. ⏳ **side-by-side 게이트(신·구 나란히, owner+시니어) 미실시** → go/revise 결정 후 Phase 3(read surfaces). 스펙: [explorer-flagship](superpowers/specs/2026-07-08-explorer-flagship-design.md) · 스키마 델타(DTO 워크스트림 인터페이스): [explorer-schema-deltas](product/2026-07-08-explorer-schema-deltas.md).

## 6. 보류 · 예정 (deferred / planned)

automation 컴파일 연동(~3개월) · 의미검색(의도 추론) · 상태/라이프사이클 가시화 · Case/Event 기록 ·
불확실성 신호 · 실 auth/권한(roleStore→실권한 swap) · i18n 키 전환 ·
placeholder 페이지(tasks/lifecycle/audit/system-*) 기능 · admin 도구 관리 UI · B8 product 문서 잔여 정리.

**고객 요구 15클러스터 (참조점, 백로그 아님) — 범위 펜스·매핑 SSOT = [requirements-architecture](product/2026-06-25-requirements-architecture.ko.md):**
🟢 covered 6 · 🟡 mock-now 7(DSL 중심축: diff·논리검증·마이그레이션 변환) · 🔵 P5 백엔드 제외(통합/실알림/실마이닝/번역) ·
🔴 req#1 제외(RBAC) · 🟣 마이그레이션(RealBPA XML→DSL→BPMN; PPT 최후순위) · ❓ 참조만(IDEF/UML/DFD).

---

## 갱신 규칙 (keep-honest)

1. 코드가 위 상태를 바꾸면 **같은 변경에서 이 줄을 고친다.**
2. 본문 스펙(아키텍처·제품 정의)에는 status를 **흩뿌리지 않는다** — 날짜·커밋·✅는 여기로 모은다(B8).
3. 한 줄에 하나의 사실 + (있으면) 커밋 해시. 상세는 이 원장이 아니라 링크된 SSOT/원장에서.
