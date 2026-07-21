# process-governance — System Architecture (overview)

> **Status:** living SSOT for *the shape of the system*. This is the top-level map;
> the transport detail lives in [`bff-sse.md`](bff-sse.md) and the authoring/execution
> invariant in [`runtime-boundary.md`](runtime-boundary.md). The durable anchor is
> [`../../CLAUDE.md`](../../CLAUDE.md). When this file and the specs disagree, the specs win —
> fix this file in the same change (the keep-honest rule).
> **구현 상태(날짜별):** [`../STATUS.md`](../STATUS.md) — 이 문서는 *timeless* 구조 SSOT; "어디까지 됐나"는 STATUS.

## Reading this doc

**The UI/UX changes at any time; the architecture does not.** This document records the
*durable* structure — the layers, the invariants, the decoupling seams, the domain model.
Screen layouts, navigation copy, and the information architecture (§7) are the fluid
surface and are expected to be re-cut often. So: trust the boundaries and contracts here;
treat any specific screen described as illustrative, not load-bearing.

---

## 1. What the system is (one paragraph)

process-governance is a **conversational AI agent that authors BOXWOOD process assets
through chat** — it generates the L0→L7 process hierarchy, draws/updates **drawing-only
BPMN**, and creates **tasks** and **SOPs**. Generated artifacts are **proposed** into a
live working area; the user **saves** them (propose → save). It is a **SvelteKit app**
that is simultaneously the **SPA** the user sees and the **BFF** that holds the LLM key
and runs the agent loop. It is the successor to `apps/process-assets` and is built to
**export its agent** into the native `automation` app later.

**Generation ≠ trust.** The agent *proposes*; correctness is decided by the customer in
the field (pilot), not asserted by us. This principle shapes the whole product: every
generated artifact passes through a human save/gate.

---

## 2. The durable invariants (do not violate)

These are the load-bearing rules. Code that breaks one is wrong even if it "works".

| # | Invariant | Where it lives / is enforced |
|---|---|---|
| 1 | **Mock-only: no backend DTO, DB, user, or auth — for now.** Assets are mock JSON; saved artifacts persist in **IndexedDB** (client). | `asset.store` (in-memory + IDB), `session.store` (stub user), `hooks.server.ts` (no auth). The only future backend role is the AI-agent path, wired **last**. |
| 2 | **LLM is swappable.** All model access goes through `LLMProvider`. **No vendor SDK or model id appears outside `lib/server/`** (today `lib/server/agent.ts` + `@repo/agent-core`'s `GeminiProvider`). | Swap to Claude = one-line config change. |
| 3 | **Agent knowledge is in-project, versioned.** L0–L7 / BPMN / task / SOP authoring rules live in [`docs/llm/`](../llm/) and load into the system prompt at runtime. | `loadKnowledgeDocs()` in `lib/server/agent.ts`. Migrates to backend later behind the same loader. |
| 4 | **Tools are a registry (data), not hardcoded.** Each agent tool = `{ name, description, enabled, schema, run }` + usage counters. | `ToolRegistry` (`@repo/agent-core`). Enables a future admin enable/disable/stats screen with no code change. |
| 5 | **Stay exportable to `automation`.** The reusable agent is `@repo/agent-core` (Node) + `@repo/agent-ui` (Svelte 5, **no SvelteKit imports**) + `@repo/agent-types`. This app is a thin host that injects everything host-specific through **seams** (§4). | `@repo/agent-ui/*` never imports `$app`/`$lib` or a specific bpmn-js instance. |
| 6 | **Authoring ≠ execution.** BPMN is **drawing-only**: `isExecutable="false"`, no Camunda execution attributes. | `shared/lib/bpmnXml.ts` `forceNonExecutable()` runs on every save. See [`runtime-boundary.md`](runtime-boundary.md). |
| 7 | **One accent token: `--pap-accent`** (`#4c8ff0`). Never reference `--primary-500/600` raw (those re-brand per app → green/teal leak). | App + `@repo/agent-ui` UI. Light theme only; no OS color emoji. |
| 8 | **Svelte 5 Runes only**; **SSR-safe**. `lib/server/**` is server-only (never imports `window`/`document`); browser-only libs (bpmn-js, Monaco) load client-side. | Every store is `*.svelte.ts` using `$state`/`$derived`. The `(portal)` route group is `ssr=false`. |

---

## 3. Layered architecture & the turn lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER  (SPA — (portal) route group, ssr=false)                     │
│   • Portal shell: TopNav · SidebarNav · global modals                 │
│   • Floating ChatWidget (@repo/agent-ui)  • bpmn-js modeler           │
│   • Svelte 5 Runes stores  • IndexedDB (catalog · files · knowledge)  │
└───────────────▲───────────────────────────────┬──────────────────────┘
   SSE (server push:                 POST /api/agent/chat
   text-token · tool-call ·          { message, transcript, context,
   tool-result · artifact ·            attachments }   (full transcript
   done · error)                       rides each request → stateless)
                │                               ▼
┌───────────────┴───────────────────────────────────────────────────────┐
│  SvelteKit SERVER (BFF) — Node/adapter-node — STATELESS — :5006         │
│   hooks.server.ts → /api/agent/chat (+server.ts, SSE)                   │
│   buildAgentRuntime():  LLMProvider  +  ToolRegistry  +  system prompt  │
│   runAgentTurn() (agent loop, @repo/agent-core)                         │
│   /api/assets (mock adapter read; save = echo, IndexedDB is truth)      │
└───────────────┬────────────────────────────────────────────────────────┘
                ▼  (FUTURE ONLY — not wired)
        Kotlin backend — AI-connection path; no DB/auth/DTO now
```

- **Transport: POST in, SSE out** (no WebSocket). The full event protocol + turn lifecycle
  is the SSOT in [`bff-sse.md`](bff-sse.md); the in-app **System Guide** (`features/guide`)
  is its visual presentation.
- **Stateless BFF:** the whole transcript rides each request, so the server holds no
  session and scales horizontally.
- **Artifacts** (hierarchy / bpmn / task / sop / export / navigate) stream back as `artifact`
  events; the host turns them into **draft panels** the user reviews and **saves**
  (propose → save) via `shared/lib/agentDraftSave.ts`.

---

## 4. The decoupling seams (the exportability contract)

`@repo/agent-ui`'s `ChatWidget` knows nothing about this host. Everything host-specific is
injected through **props that are plain getters/callbacks** — the single most important
architectural pattern in the app, because it is what lets the agent move to `automation`
untouched. All seams are wired in `src/routes/(portal)/+layout.svelte`.

| Seam (ChatWidget prop) | Direction | What the host injects |
|---|---|---|
| `onArtifact(artifact)` | widget → host | Host owns routing + persistence: opens draft panels, saves, navigates. The widget never calls `goto()` or writes stores. |
| `getContext()` | widget → host (pull) | Host builds a live `ChatContext` (asset **catalog** + `activeAssetRef` derived from the `/assets/:id` URL + user-picked `selectedAssetRefs` with full `focusedDetails`). Called fresh per turn. |
| `intent` | host → widget (reactive getter) | `() => uiStore.composeIntent` (`{ text, nonce }`). When `nonce` bumps, the widget opens + sends. Drives the "만들기" hero and the "대화로 편집" CTA without any compose surface importing the chat store. |
| `inputAccessory` | host slot | The host's @-mention asset-reference picker, rendered above the input. |
| `fileStore` | host → widget | A `FileStore` impl (`idbFileStore`) for attachment blobs. Swappable for an API-backed store later. |

**Rule of thumb:** if a feature needs the chat, it talks to **`uiStore`** (host state),
never to the widget. The widget only ever sees the five seams above.

---

## 5. Client state & persistence

State is a set of **class stores** (`src/shared/stores/*.svelte.ts`) using Runes; there is
no global store framework. Each store owns one concern and exposes `$state`/`$derived` plus
mutators. The ones that carry architectural weight:

| Store | Role |
|---|---|
| `asset.store` | The asset **catalog** SSOT (in-memory sample, hydrated/persisted via IndexedDB). All asset CRUD funnels here. |
| `ui.store` | Cross-cutting UI: `createModalOpen`, `explorerView` (persisted), **`expertMode`** (detail progressive disclosure, persisted), **`composeIntent` + `startCompose()`** (the chat bridge, §4). |
| `role.store` | **Demo-only** role (`citizen`/`manager`/`admin`, persisted) + `canSee(required)`. The swap point for real permissions; today it only drives IA disclosure (§7). |
| `session.store` | Stub current user; the future `/me` swap point. Hydrates per-user stores. |
| `conversations.store` | **Chat history SSOT** — AI-agent conversations (transcript + title + ts), persisted via IndexedDB. Shared by the floating FAB and the **AI 대화 기록** page (`/chat`); both surfaces save/resume here. See [`chat-history.md`](chat-history.md). |
| `favorites` / `recent` | Per-user lists, persisted to localStorage. |

Other feature stores (filter, explorer-query, view-axes, feedback, rulesets, documents,
systems, changeProposal, commonCode, knowledgePage) follow the same shape.

**Persistence (mock-era, all client-side, all swappable seams):**

- `shared/lib/idb-catalog.ts` — asset catalog (edits survive reload).
- `shared/lib/idb-files.ts` — `FileStore` impl for chat attachments.
- `shared/lib/idb-knowledge.ts` — community knowledge pages.
- `shared/lib/idb-conversations.ts` — chat-history conversations (FAB + `/chat` page share it).
- `shared/lib/query/queryClient.ts` — TanStack Query client (asset hydration; the path that
  becomes the real backend fetch). `shared/api/*` already holds the DTO mapper + query/
  mutation factories for that future swap.

---

## 6. Domain model

Product spine (the moat is the AI authoring engine that produces this):

```
Template (재사용 가능한 청사진)  →  Case (실제 케이스)  →  Event (이벤트/실행)
                  └─ Task / Step (태스크·단계 = Camunda user-task, authoring-only here)
```

In code today the asset spine is (`src/shared/types/asset.ts`):

- **`CallableModelAsset`** — the BPMN-bearing shape shared by:
  - **`ProcessAsset`** — has a parent + L-level (L0–L7), trigger/SLA/KPIs, RACI, forms.
  - **`TaskBundleAsset`** — reusable Call-Activity target (no parent / L-level).
- **`SopAsset`** — ordered steps, optionally linked to a process + BPMN elements.
- Plus metadata-only `Policy` / `Template` / `WorkInstruction`.

Every asset carries multi-axis **classification** (level, line-of-business, e2e, solution,
module, business-objects), **versions**, typed **relatedAssets** links, RuleSet-driven
custom fields, and an optional **externalRef**.

**Lifecycle** (`LifecycleStage`, spec §11.1) is a 9-stage chain governing the save/approve
flow: `Proposed → RequirementsReview → RequirementsApproved → InDevelopment → Verification
→ OperationApprovalRequested → OperationApproved → InOperation → Retired`. Mock seed data
lives in `src/shared/data/*` (assets, people, categories, classification catalogs, gate
criteria, …). The **BFF asset seed** (served by `/api/assets`) is host-owned at
`src/lib/server/mock/assets.{ts,json}` — deliberately in the host, not in `@repo/agent-core`,
so the reusable agent packages carry no domain data and stay portable to `automation`.

---

## 6.5 The DSL intent layer  *(forward-looking keystone)*

Above the asset/version data sits a **structured intent layer** — the execution-noise-free
representation of *what a process means*, separate from *how it is drawn* (BPMN) and *how it
runs* (Camunda, later). It is the keystone the hardest client requirements converge on:
**version diff, 정합성 논리 검증, Excel↔BPMN round-trip, RealBPA migration, ⑦ auto-layout**
are each a *projection of, or operation on, this intent* — not a bespoke BPMN-XML
manipulation. Building them against one intent model (vs. six fragile XML hacks) is why the
build axis is **"DSL first."**

- **[TODAY]** Intent is already structured beside the BPMN string on every version —
  `flowConditions` (`FlowConditionRef {scriptRef}`), `scripts[]` (catalog), `parameters`/
  `taskParameters` (`TaskInput.source: TypedValue`), `userTaskForms`, `taskOwners` (B2b:
  asset now speaks the DSL's catalog+reference language end-to-end) — and
  `packages/bpmn/.../conditionRuleConverter.ts` already does a structured-rules ⇄ script
  projection. The DSL **generalizes** these fragments.
- **[TARGET]** A single canonical intent model from which BPMN is regenerated; diff/validation/
  migration implemented as DSL operations. **Not yet built**; grown incrementally, no big-bang.
- Consistent with invariant #6 (BPMN is drawing-only): the DSL is the source of *meaning*,
  BPMN one *rendering* of it.

**Full SSOT + convergence rationale:** [`dsl-intent-layer.md`](dsl-intent-layer.md). **How
the 15 client-requirement clusters map onto this architecture (and the scope fence — what is
deliberately out: backend/auth/integration/PPT):**
[`../product/2026-06-25-requirements-architecture.ko.md`](../product/2026-06-25-requirements-architecture.ko.md).

---

## 7. Feature architecture & IA  *(the fluid layer — re-cut freely)*

**Screaming architecture:** every domain is a vertical slice under `src/features/<name>/`
(`apis` · `queries` · `components` · `pages` · `services` · `types`). Current slices:
`dashboard`, `detail`, `explorer`, `monitoring`, `feedback`, `modeler`, `governance`,
`community`, `documents`, `approvals`, `hierarchy`, `graph`, `glossary`, `guide`, `system`,
`tasks`, `account`.

**IA = data-driven** (`src/shared/layout/nav-menu.ts`): `primaryNav`/`utilityNav` are arrays
of `NavItem`, rendered recursively by `NavItem.svelte`. The sidebar is grouped by the user's
**job** (만들기 → 실행 → 거버넌스 → 시스템), default audience = citizen developer.

**Progressive disclosure** has two independent dials:

- **Role** (`role.store.canSee`) gates whole nav groups: citizen sees 만들기+실행; manager
  adds 거버넌스; admin adds 시스템. (Demo only — real permissions swap in behind `canSee`.)
- **Expert mode** (`ui.store.expertMode`) toggles the asset-detail surface between the
  simplified 2-pane (`SimpleDetailView`: read-only preview + "대화로 편집") and the full
  tabbed expert view (`TabShell`).

**Authoring entry** is unified on the chat: the "새 프로세스" CTA navigates to the dedicated
`/create` page (`MakerHero`), and both that page and the citizen landing (`MakerHome`) feed
`uiStore.startCompose()` → the chat seam (§4).

> Because this layer is the fluid surface, prefer to read the code (`nav-menu.ts`,
> `role.store`, `ui.store`) over trusting any screenshot — it is the part that moves most.

---

## 8. Where things live (cross-references)

| Concern | SSOT |
|---|---|
| Durable anchor (read first) | [`../../CLAUDE.md`](../../CLAUDE.md) |
| This map | **this file** |
| BFF + SSE transport, turn lifecycle, event protocol | [`architecture/bff-sse.md`](bff-sse.md) |
| Authoring-vs-execution invariant | [`architecture/runtime-boundary.md`](runtime-boundary.md) |
| **DSL intent layer (keystone; diff/validation/migration converge here)** | [`architecture/dsl-intent-layer.md`](dsl-intent-layer.md) |
| **Client requirements → architecture mapping + scope fence** | [`product/2026-06-25-requirements-architecture.ko.md`](../product/2026-06-25-requirements-architecture.ko.md) |
| Agent knowledge (system-prompt material) | [`llm/`](../llm/) |
| Product definition · scenarios · IA · blueprint | [`product/`](../product/) (incl. `product-blueprint.xlsx`) |
| Design / dataflow / overview specs | repo root `docs/superpowers/specs/2026-06-18-process-governance-*` |
| Doc map (what lives where) | [`README.md`](../README.md) |
