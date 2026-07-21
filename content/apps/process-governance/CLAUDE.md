# process-governance — Developer Guide (CLAUDE.md)

> **Status:** scaffolding. Design is complete and committed. This file is the durable
> anchor — read it first every session. Full detail lives in the spec docs (see
> **References**). When this file and the specs disagree, the specs win; update this file.

## What this is

A **conversational AI agent** that authors BOXWOOD process assets through chat: it
generates the **L0→L6 process hierarchy**, draws/updates **BPMN**, and creates **tasks**
and **SOPs**. Generated artifacts are **proposed** into a live working area; the user
**saves** them (propose → save).

It **replaces `apps/process-assets`**, which is now an **ABANDONED LEGACY project — do
not touch it, read it, or spend any effort on it.** All active work is in
`apps/process-governance` only; never edit process-assets, never fix its bugs, and never
extend a governance change into it "for consistency." Built on **SvelteKit** (SSR + `adapter-node`)
so the server can stream work to the client over **SSE** ("the backend calls the
frontend"). It is also the **BFF** that holds the LLM key and runs the agent loop.

## Start here — task router

This file is the **anchor** (invariants + where to go), not the whole library. Before
acting, load the source for your task — that's what keeps the work identical across devs.

| When you're about to… | Load first |
|---|---|
| add/modify an **agent tool** | skill **`pg-agent-tool`** |
| add a **new feature / page / sidebar route** | skill **`pg-feature-pipeline`** |
| craft a **component / styling**, Svelte/Runes/TanStack detail | skill **`svelte5-boxwood`** |
| touch **BFF · SSE · agent loop** internals | [`docs/architecture/bff-sse.md`](docs/architecture/bff-sse.md) |
| build **chat history / conversation persistence** (FAB ↔ /chat page, shared IndexedDB store) | [`docs/architecture/chat-history.md`](docs/architecture/chat-history.md) |
| change **BPMN** (authoring-vs-execution invariant) | [`docs/architecture/runtime-boundary.md`](docs/architecture/runtime-boundary.md) |
| build the **process-detail editor** (bpmn-io XML ⇄ YAML ⇄ intent · reconcile-at-save · hidden panel) | [`docs/architecture/process-detail-editing-model.md`](docs/architecture/process-detail-editing-model.md) |
| build **diff · 정합성 검증 · Excel↔BPMN · migration** (the DSL-first work) | [`docs/architecture/dsl-intent-layer.md`](docs/architecture/dsl-intent-layer.md) |
| understand/change the **asset data model** (DDL tables · columns · code registry · generated TS row types) | [`docs/architecture/asset-schema.yaml`](docs/architecture/asset-schema.yaml) — **SSOT**; edit it + re-run the 3 generators → xlsx/json/`src/shared/types/generated/db-schema.ts`. Domain↔row map: [`asset-schema-mapping.md`](docs/architecture/asset-schema-mapping.md) |
| see **client requirements → architecture** mapping + scope fence | [`docs/product/2026-06-25-requirements-architecture.ko.md`](docs/product/2026-06-25-requirements-architecture.ko.md) |
| understand the **whole system shape** | [`docs/architecture/system-overview.md`](docs/architecture/system-overview.md) |
| wire/understand the **interim asset backend** (SvelteKit server, gateway seam, Kotlin swap) | [`docs/architecture/backend-wiring.md`](docs/architecture/backend-wiring.md) · `$lib/server/asset-catalog.ts` · `shared/api/asset-gateway.ts` |
| understand the **FE/BE boundary** (what the Kotlin backend owns vs this app) | [`docs/architecture/backend-boundary.md`](docs/architecture/backend-boundary.md) |
| build **audit log · 버전 복원** (append-only history, derived audit view) | [`docs/architecture/audit-and-restore.md`](docs/architecture/audit-and-restore.md) |
| build **알림 · 승인** (derived notification view, reused approval engine) | [`docs/architecture/notifications-and-approval.md`](docs/architecture/notifications-and-approval.md) |
| build the **자산 관리자 관제 화면 · 변경 추적/관측** (owner-facing change feed: 담당·폼·파라미터·역할·권한 · 오류 로그·오류율 · 마감일 · 알림) | [`docs/architecture/asset-manager-cockpit.md`](docs/architecture/asset-manager-cockpit.md) |
| add **모델링 항해 / 싼 언락** (Call-Activity click-through; pg-local, no shared @repo/bpmn edit) | [`docs/architecture/modeling-unlocks.md`](docs/architecture/modeling-unlocks.md) |
| know **"how far is it built"** | [`docs/STATUS.md`](docs/STATUS.md) |
| check a rule is **machine-enforced** (guards) | [`docs/guards.md`](docs/guards.md) |
| do any **styling / UI / new page visual** work | design spec [`docs/superpowers/specs/2026-07-08-design-language-overhaul-design.md`](docs/superpowers/specs/2026-07-08-design-language-overhaul-design.md) — color=state-never-category, one control strip, density tiers, ink ramp |
| add/change a **chip, badge, status pill, or count** (or any state-vs-category color call) | **SSoT** [`docs/architecture/chip-system.md`](docs/architecture/chip-system.md) — the color+hierarchy grammar: canonical chip→role→token YAML map, per-surface chip hierarchy, "adding a new chip" procedure |
| change **IA / sidebar / routes** | [`docs/product/2026-06-24-ia-implementation-plan.ko.md`](docs/product/2026-06-24-ia-implementation-plan.ko.md) |
| **find any doc** | [`docs/README.md`](docs/README.md) |
| cross-cutting **security / permission / exception / logging / DTO** policy | [`docs/policy/README.md`](docs/policy/README.md) |

## Standing requirements (do not violate)

1. **No Kotlin backend DTO, no real DB, no user, no auth — for now.** The Kotlin backend is
   **not wired**. The only future backend role is the **AI-agent connection** path; it is
   wired **last**. Until then, **the default asset persistence is the SvelteKit server itself**
   — an **in-memory catalog** (`$lib/server/asset-catalog.ts`, seeded from bundled sample data,
   reseeds on restart) served over `GET`/`PUT /api/assets`, reached by the client only through
   the **`AssetGateway`** seam (`shared/api/asset-gateway.ts`) — **not IndexedDB**. See
   [`docs/architecture/backend-wiring.md`](docs/architecture/backend-wiring.md) for the full
   seam + the two Kotlin swap points. (The other client stores — templates, knowledge base,
   chat conversations — are unaffected: they still persist to **IndexedDB**.) Do **not**
   scaffold Kotlin DTOs, a real database, login, or permissions. (The generated
   `src/shared/types/generated/db-schema.ts` DDL row types are **types-only** — the forward
   wire contract derived from `asset-schema.yaml`, not a wired backend.)
2. **LLM is swappable — Gemini now, Claude later.** All model access goes through the
   **`LLMProvider`** interface. Today: `GeminiProvider` (`gemini-3.1-flash-lite`, free tier).
   In a few weeks: `ClaudeProvider` (paid). **No vendor SDK or model id may appear outside
   `packages/agent-core/src/llm/`** — the `LLMProvider` home (moved out of this app so the
   reusable agent stays portable; this app's `lib/server/agent.ts` only *wires* it). Keep the
   swap a one-line config change. **Enforced by `src/lib/vendor-boundary.test.ts`** (see
   [`docs/guards.md`](docs/guards.md)).
3. **LLM reference docs live in-project, versioned.** The agent's knowledge / system-prompt
   material (authoring rules, L0–L6 definitions, BPMN & SOP conventions, glossary) lives in
   **`docs/llm/`** and is loaded into the system prompt at runtime. These **migrate to the
   backend later** — keep them as standalone files behind a small loader so the move is easy.
4. **Tools are a registry (data), not hardcoded.** Every agent tool is registered with
   `{ name, description, enabled, schema, run }` plus usage counters. This exists so the
   **admin menu** can enable/disable/delete tools and show **statistics** without code
   changes. Build the tool layer registry-first from day one.
5. **Stay exportable to `automation`.** The reusable agent is split into `@repo/agent-core`
   (Node), `@repo/agent-ui` (Svelte 5, no SvelteKit imports), `@repo/agent-types`. This
   app is a thin host. Senior dev's long-term plan is to export the feature into the
   native-Svelte `automation` app — so never couple `@repo/agent-ui` to SvelteKit (`$app`,
   `$lib`) or to a specific bpmn-js instance (the host injects the modeler via `onArtifact`).

## Architecture (one screen)

```
Browser (floating chat widget · bpmn-js · IndexedDB)
   ▲ SSE (server push: tokens / artifacts / done)   │ POST (message + transcript + context)
   │                                                 ▼
SvelteKit server (BFF) — Node/adapter-node — STATELESS — :5006 behind nginx /process-governance/
   hooks.server.ts · /api/agent/chat (+server.ts, SSE) · agent loop · LLMProvider · tool registry · asset-catalog (/api/assets)
   │
   ▼ (FUTURE only) Kotlin — AI-connection path; no DB/auth/DTO now
```

- **Transport:** POST in, **SSE** out (no WebSocket). See dataflow blueprint for every event.
- **Stateless BFF:** full transcript rides each request (scales horizontally).
- **Model:** `gemini-3.1-flash-lite` — uses `thinking_level` (not `thinking_budget`) and requires
  function-response `id`/`name`/count matching.

## Conventions

- **Svelte 5 Runes only** (`$state`, `$derived`, `$effect`, `$props`); no Svelte 4 legacy.
- **SSR-safety is critical.** Anything under `lib/server/**` is server-only (never import
  `window`/`document`). Browser-only libs (**bpmn-js**, Monaco) load **client-side only**
  (`onMount` / `browser`). `lib/server/**` must never be imported by client code.
- **Detailed comments while scaffolding.** During this initial build, every new component
  and util gets a header comment: its **purpose**, **inputs/outputs (props/args)**, and
  **dependencies / SSR-safety** (client-only? server-only?). We're establishing the skeleton
  — bias toward explaining intent. (Density can relax once the shape is proven.)
- **Reuse `@repo/ui`** Ecoletree components (no raw `input`/`select`); BOXWOOD design tokens;
  **light theme only**; no OS color emoji.
- **Accent color = blue, via `--pap-accent` (`#4c8ff0`, hover `--pap-accent-strong`).** This is
  the PAP brand; both PAP hosts define it and it is the only accent token PAP/`@repo/agent-ui`
  UI may reference. **Never reference `--primary-500`/`--primary-600` raw** — those are the
  *per-app re-branded* token (green `#6D9787` in legacy `@repo/ui` ecoletree, teal in
  `automation`), so a shared widget that uses them silently inherits green/teal. If a color
  looks green here, it's a `--primary-500` leak — fix it by pointing at `--pap-accent`, not by
  re-overriding. **Enforced by `src/lib/pap-tokens.test.ts`** (see [`docs/guards.md`](docs/guards.md)).
- **Design language (2026-07-08 spec):** monochrome ink ramp (`--pap-ink-*`) + blue accent
  + semantic intents only — color encodes **state, never category**. Every page root
  declares `data-density`. Font sizes come from `--pap-fs-*`. No new hex literals outside
  `styles/app.css`. **Enforced by `src/lib/design-guards.test.ts`.**
- **Tests:** Vitest; mock the `LLMProvider` with deterministic tool-call scripts.
- **Adding/editing an agent tool → follow the `pg-agent-tool` skill** (`.claude/skills/pg-agent-tool/`).
  6 steps: define → register (`buildCoreTools`) → error contract → artifact/host wiring → co-located
  test → build agent-core. Keeps the tool pipeline identical across devs (req #4/#5).
- **Adding a feature / page / route → follow the `pg-feature-pipeline` skill**
  (`.claude/skills/pg-feature-pipeline/`). 4 registration sites (paths · nav-menu · APP_ROUTES ·
  nav-icons) + 2 guards (routes.test · nav-menu.test) + the persistence choice; role gating is
  **group-level only**.
- **Automated guards = executable policy.** Load-bearing rules (route coverage, PAP accent
  tokens, vendor boundary) are enforced by Vitest checks that fail the normal `pnpm --filter
  process-governance test` run — not by memory or review. Promote a repeatedly-violated rule
  from prose to a guard; registry + how-to-add: [`docs/guards.md`](docs/guards.md).

## Target file structure

```
apps/process-governance/
├─ svelte.config.js / vite.config.ts / tsconfig.json
├─ docs/llm/                      # req #3 — agent knowledge (→ backend later)
└─ src/
   ├─ hooks.server.ts             # middleware (CORS, ctx) — auth added LAST, additively
   ├─ routes/
   │  ├─ +page.svelte             # floating chat widget host
   │  ├─ api/agent/chat/+server.ts  # POST → SSE
   │  ├─ api/assets/+server.ts      # reads/writes the in-memory asset-catalog (persists for process lifetime)
   │  └─ admin/                     # req #4 — tool enable/disable/delete + stats
   └─ lib/
      ├─ server/                  # SERVER-ONLY
      │  ├─ agent.ts                          # wires the reusable agent into this host (req #5)
      │  │     # req #2/#4 — provider (vendor), loop, registry & tools live in @repo/agent-core;
      │  │     #   agent-core/src/llm is the ONLY place that knows a vendor (see docs/guards.md)
      │  ├─ knowledge/loader.ts                # req #3 — loads docs/llm/*
      │  ├─ asset-catalog.ts                    # req #1 — in-memory catalog, served over /api/assets
      │  └─ sse.ts
      ├─ client/                  # browser-only — stores, persistence/idb.ts, sse-client.ts
      ├─ admin/                   # req #4 — admin UI + stats client
      └─ types/                   # SSE event + artifact types (mirror @repo/agent-types)
```

## Commands (after scaffold)

```
pnpm --filter process-governance dev        # SvelteKit dev (port 5006)
pnpm --filter process-governance build      # adapter-node build
pnpm --filter process-governance check      # svelte-check
```
Env: `GEMINI_API_KEY` (server-only), `PA_AGENT_MODEL` (default `gemini-3.1-flash-lite`).

## References (source of truth)

> **Doc map:** [`docs/README.md`](docs/README.md) is the human entry point — what lives
> where (this app's SSOT docs, the repo-root anchor specs, inherited PA docs, and the
> known doc debt). Read it when hunting for a doc.

**This app's docs** (paths relative to this app):

- `docs/architecture/bff-sse.md` — **BFF + SSE under-the-hood SSOT** (turn lifecycle,
  SSE event protocol, agent loop, statelessness & scaling). The in-app System Guide page
  (`features/guide`) is the visual presentation of this doc.
- `docs/architecture/runtime-boundary.md` — **authoring-vs-execution invariant SSOT**
  (`isExecutable="false"`; no Camunda execution attrs). Enforced by `shared/lib/bpmnXml.ts`.
- `docs/architecture/asset-schema.yaml` — **machine-readable asset-schema SSOT** (22 tables +
  code registry). The Excel workbook (`asset-ddl-workbook.xlsx`), `asset-schema.json`, and
  generated `src/shared/types/generated/db-schema.ts` all derive from it (drift-proof — edit the
  YAML, re-run `build-*.py`). Domain↔DDL mapping: `docs/architecture/asset-schema-mapping.md`.
- `docs/architecture/dsl-intent-layer.md` — **DSL intent-layer keystone (forward-looking)**.
  The structured intent between authoring and execution that version diff / 정합성 논리검증 /
  Excel↔BPMN / RealBPA migration all converge on — hence new work is "DSL first". [TODAY]
  proto-DSL fragments exist; [TARGET] single model + projections not yet built. The
  business-requirements → architecture mapping (+ scope fence) is
  `docs/product/2026-06-25-requirements-architecture.ko.md`.

**Anchor specs — at the repo root** (`../../` from this app), not under `docs/`:

- `../../docs/superpowers/specs/2026-06-18-process-governance-design.md` — design spec
- `../../docs/superpowers/specs/2026-06-18-process-governance-dataflow.md` — **dataflow blueprint
  (the build contract: every request/response shape + Mermaid diagrams)**
- `../../docs/superpowers/specs/2026-06-18-process-governance-overview.en.html` / `.ko.html` — overview deck
- `../../scripts/translate-doc.py` — EN→KO doc translation (Gemini, hash-cached)

## Authoritative cross-cutting docs (planned — senior-dev-owned)

The homes + maintenance rules for the planned repo-wide policy docs (DTO contracts,
security, permission, exception, logging/audit) live in
[`docs/policy/README.md`](docs/policy/README.md) — **not duplicated here**. They plug into
the agent knowledge loader (`docs/llm/`, req #3) when written.

Home branch: **`assets/main`** (not `main`).
