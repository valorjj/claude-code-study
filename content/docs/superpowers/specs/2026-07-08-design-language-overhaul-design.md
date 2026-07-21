# Design Language Overhaul — process-governance

**Date:** 2026-07-08
**Status:** Approved direction (brainstorm complete; implementation plan to follow)
**Scope:** `apps/process-governance` UI only. PAP-scoped tokens; no changes to
`--boxwood-*` / `--primary-*` globals or other apps.

## Why

Senior dev and company owner agree the overall UI/UX needs serious improvement, but no
one has a specific direction. The owner-developer's values, which this spec encodes:

1. Natural, intuitive UI/UX
2. No noise — no redundant or excessive data laying around
3. Clean and simple color combination

This spec is two things at once:

- a **retrofit direction** for the existing surfaces (Explorer, detail, edit, create,
  approvals, community, …), and
- a **standing rulebook** that every *future* page is born into — document, ruleset,
  common code, user management, organization, LLM history, logging, and beyond. After
  this lands, adding a page is a composition exercise against this spec, not a design
  decision.

Everything is on the table: palette, accent, IA, component usage. Where this spec
contradicts previously test-enforced rules, the guards are updated alongside it.

**Primary user, in priority order:** browsers/consumers (people finding and reading
process assets) first, then authors/stewards, then managers/governance.

## Diagnosis (agreed 2026-07-08)

Ranked by impact, from an audit of 11 current screens:

1. **Two visual languages fighting.** Create speaks consumer-SaaS (gradient hero,
   sparkle, friendly copy); everything else speaks dense enterprise tool. No shared
   tone or density.
2. **Color has no hierarchy.** Every categorical dimension grabbed its own palette:
   L0–L6 level badges (7 hues), asset types (6 hues), status dots, relationship chips,
   count dots, yellow stat cards. `app.css` *documents* the right discipline (blue =
   highlight, green = completion only) but the UI doesn't hold to it. Biggest lever.
3. **Too much chrome before content.** Browse pages stack title → subtitle sentence →
   type tabs → filter row → view switcher → action buttons before any data. The tree
   detail panel stacks seven label:value chips.
4. **Redundant / dead data on display.** Constant-value columns (유형=Process inside
   the Process tab), description lines inflating every row, repeated `—`/`미지정`
   empties, demo scaffolding leaking into the product (DEMO 역할 switcher, "(mockup)").
5. **Inconsistent density.** One tab is 3 fields on an empty page; another is a wall of
   fields; tables are tight; heroes are airy. No shared scale, so nothing feels
   deliberate.
6. **The same thing built several times.** The hierarchy tree exists in ~3
   implementations (Explorer, Community, asset-link modal); chips, badges, and filter
   bars similarly. Consistency and maintenance tax.
7. **Navigation dead weight + weak type hierarchy.** Locked/greyed nav items with role
   labels; bordered card groupings and disclosure chrome in the sidebar; 13.5px base
   with heavy muted-grey makes titles/body read at one flat level.

The user confirmed there are more issues; these seven are the agreed working base.

## Direction — five policies

### P1. Color: ink + one accent + earned color

- **Base is monochrome.** Text, borders, backgrounds, icons draw from one neutral
  ramp. A page at rest is essentially black-and-white.
- **One accent (blue, `--pap-accent`)** for interaction only: primary action,
  selection, focus, links. Never decoration.
- **Semantic intents** (success/warning/danger/info) appear only when they carry
  *state*: lifecycle status, approval decisions, validation. Green remains
  completion-only — now enforced, not just documented.
- **Categorical dimensions lose their palettes.** Level badges (L0–L6) → one neutral
  outlined style; the number is the information. Asset-type badges → neutral chips
  differing by label only. Relationship-type chips → neutral.
- **Rule of thumb: color encodes state, never category.**

### P2. Typography carries hierarchy

- Base font size moves 13.5px → 14px.
- Four named levels: page title / section / body / caption, with real size + weight
  contrast, expressed as tokens.
- Where a colored badge or bordered box currently signals "this is distinct," weight
  and size do that job instead.
- Muted-grey usage is cut back: body text is ink, not fog.

### P3. Chrome budget: one strip, then content

- Every list/browse page gets **exactly one control row**: search + filters + view
  switcher + primary action; rare actions collapse into an overflow menu.
- Subtitle/explainer sentences are removed from page headers. Explanation moves to
  empty states and tooltips — it appears when there is nothing else to show, never
  above real data.
- Locked nav items (e.g. 거버넌스/시스템 for non-managers) disappear entirely rather
  than rendering greyed with role labels.
- The sidebar drops bordered card groupings and disclosure chrome; it becomes a flat,
  quiet list.

### P4. Data earns its pixels

- Empty values (`—`, `미지정`, `없음`) never render as rows/chips; empty fields
  collapse.
- A column whose value is constant across the visible set auto-hides (e.g. the 유형
  column inside a single-type tab).
- Description lines leave table rows; they live in hover affordances or the detail
  panel. Rows return to one line.
- Demo scaffolding (DEMO role switcher, "(mockup …)" strings) goes behind a dev flag.

### P5. Density: three named tiers

- `compact` (tables, trees), `regular` (forms, detail panels), `spacious`
  (entry/hero moments such as Create).
- Every page/section root declares exactly one tier (`data-density` attribute backed
  by spacing token sets).
- This resolves the split personality: Create keeps its welcoming spaciousness but
  adopts the shared ink/accent palette and type scale — one language, two densities.

## Foundation implementation

The existing token architecture in `src/styles/app.css` (semantic `--pap-*` names,
intent quads) is kept; we change **values and rules**, not the concept.

### Tokens

- **Neutral ramp:** replace scattered greys (`#e5e7eb`, `#9ca3af`, `#6b7280`, ad-hoc
  hexes in `components.css`) with one named 8-step ramp `--pap-ink-900 … --pap-ink-050`.
  Every border/text/muted use maps to a step.
- **Demote categorical palettes:** the six `--pap-type-*` pairs and L0–L6 level colors
  keep their token names (call sites don't break) but point at neutral values —
  one-line-per-token change, app-wide effect.
- **Keep:** blue accent, the four intent quads, lifecycle stage colors (those encode
  state; they earned their color).
- **New tokens:** the 4-level type scale (`--pap-text-title/section/body/caption`,
  size + weight) and the 3 density tiers (`--pap-density-*` spacing sets).

### Canonical components

One canonical implementation each of: `AssetTypeChip`, `LevelBadge`, `StatusDot`,
`FilterBar`, empty-state pattern, and **one hierarchy tree**. The tree is built during
the Explorer flagship phase; Community and the asset-link modal adopt it during
rollout. No surface may keep a private fork.

### Guards (rules as failing tests — this repo's established pattern)

Extend the `pap-tokens.test.ts` style:

- no new hex color literals outside `app.css`
- every page root declares a density tier
- no rendering of literal `—` / `미지정` value chips
- no new consumers of the demoted categorical palettes

Guards apply automatically to routes that don't exist yet — a future page physically
cannot ship off-language without a failing test.

### Kill-list sweep (Phase 0 — pure deletion, zero design risk)

Demo role switcher behind a dev flag; "(mockup)" strings removed; locked nav hidden;
page subtitle sentences removed; empty-value chips collapsed. Ships in ~a day and
visibly de-noises every screen before any design work lands.

## Flagship: Explorer rebuilt (direction checkpoint)

Scope: the browse surface at `/assets` — list, tree, matrix views + detail side panel.
Flow view and the asset detail *page* are out of this phase.

- **Page frame:** title becomes "자산" + count; subtitle gone. The three current
  strips collapse into one control row (search, filter, view switcher, 자산 등록).
  Export actions (Excel, PPT, and any future formats) move into a single overflow
  menu — confirmed by owner-developer 2026-07-08: exports are a clutter source and
  must be organized, not top-chrome. Type tabs survive as quiet text-tab filters
  inside the single strip.
- **List view:** one line per row — name (body, ink), neutral level badge only when
  the level axis is relevant, status as the row's single colored element, owner +
  version in caption grey. Description leaves the row. 유형 column auto-hides inside
  a single-type tab. Row height roughly halves; scanning becomes name-first.
- **Tree view (the color-policy test case):** L0–L6 badges go neutral-outline —
  indentation already encodes depth. Team labels and count dots become caption-grey,
  shown on hover/selection. The detail side panel replaces the seven-chip cloud with
  a clean label:value list, empties collapsed, one primary 상세 보기 action.
- **Matrix view:** token fallout only, plus cell highlight moves from flat pale-blue
  fills to a single-hue intensity ramp. No structural rework.
- **Canonical tree component** is built here with Explorer as first consumer.

**Acceptance gate:** old and new Explorer side by side in front of senior dev + owner.
If the new one does not *obviously* read as calmer and faster to scan, the direction
is revised here — before any rollout.

## Standing rulebook: the new-page playbook

The spec doubles as the blueprint for **all future pages** — document, ruleset, common
code, user management, organization, LLM history, logging, and anything after.

### Page anatomy (every page assembles this)

1. Page frame: title + count/context, no subtitle sentence
2. Exactly one control strip (or none)
3. A declared density tier
4. Canonical components only (FilterBar, chips/badges, tree, empty states)

### Layout archetypes (every page picks one)

| Archetype | Shape | Existing examples | Future pages that slot in |
|---|---|---|---|
| **Browse** | list/tree + optional detail panel, `compact` | Explorer, Community | Document library, LLM history, logging |
| **Detail** | tabbed reader, `regular` | Asset detail (8 tabs) | Document detail |
| **Form/Editor** | sectioned form or editor, `regular` | Asset edit, create modal (`spacious`) | Ruleset editor, common code, organization |
| **Queue/Dashboard** | table of actionable items + stat row | Approvals, dashboard, monitoring | User management |

Admin-class pages (common code, user management, organization, LLM history, logging)
are ordinary instances of Browse / Form / Queue — they are covered by the flagship
work, not new design problems.

### Enforcement chain

- **Spec** (this doc) → **archetypes** → **canonical components** → **guards**.
- The `pg-feature-pipeline` skill gains a step: *declare density tier + build from the
  page blueprint*. Every new page already flows through that skill, so the rulebook is
  followed mechanically, by devs and by Claude sessions alike.
- A short "design rules" row is added to the app CLAUDE.md task-router table pointing
  at this spec, so styling sessions load it first.

## Rollout

Each phase independently shippable on `assets/main`:

| Phase | Content | Gate |
|---|---|---|
| **0** | Kill-list sweep (deletions only) | none — ship immediately |
| **1** | Foundation: ink ramp, palette demotion, type scale, density tiers, guards | owner/senior-dev read the one-page spec |
| **2** | Explorer flagship + canonical tree | **side-by-side review — direction checkpoint** |
| **3** | Read surfaces: asset detail page, Community (adopts canonical tree), relation graph | — |
| **4** | Authoring: create modal, edit tabs, pickers/link modal (tree adoption #3) | — |
| **5** | Governance: approvals, dashboard, monitoring | — |

**Drift control during the tail:** guards keep untouched screens from getting worse;
new features built mid-rollout must use new tokens/components from day one — no new
consumers of demoted palettes.

**Stakeholder rhythm:** owner and senior dev are shown exactly two artifacts — the
one-page design-language summary after Phase 1, and the Explorer side-by-side after
Phase 2. Everything after is mechanical application of an approved language.

## Out of scope

- BOXWOOD global tokens (`--boxwood-*`, `--primary-*`) and other apps (`automation`,
  `process-assets`) — untouched.
- Dark theme (light-only remains the rule).
- BPMN modeler canvas internals (inherits tokens only).
- Backend/data-model changes — this is a presentation-layer effort.
- The AI chat/agent UI (`@repo/agent-ui`) — inherits tokens; its own UX is a separate
  effort.

## Decision log (owner-developer, 2026-07-08)

All five open decisions confirmed:

1. Categorical color demotion (L0–L6, asset types → neutral) — **approved**; present
   to senior dev/owner at the Phase 1 spec read, before the Phase 2 gate.
2. Explorer side-by-side gate is a genuine go/revise checkpoint — **approved**.
3. Guard rewrites (`pap-tokens.test.ts` etc.) require an explicit conversation with
   the senior dev — **acknowledged**.
4. Exports (Excel **and PPT**) are a clutter source — consolidate into overflow —
   **approved**.
5. Locked nav items hidden entirely for unauthorized roles — **approved**.

Technical caution items (token-ripple review in a running app; fallback states for
auto-hidden columns/collapsed empties; behavioral inventory of the three tree
implementations before consolidation; visual sweep after the 14px base-font change)
were reviewed and accepted as implementation-phase work.

## Risks

- **Neutral level badges could under-differentiate deep trees.** Mitigation: the
  flagship gate explicitly evaluates tree scannability; outline weight/size can vary
  by level band if needed — still monochrome.
- **Owner may expect "more color = more finished."** Mitigation: the side-by-side
  gate frames the change as before/after against the three stated values.
- **Long rollout tail leaves mixed old/new screens.** Mitigation: Phase 0 + Phase 1
  token demotion move *every* screen most of the way on day one; per-screen phases
  are refinement, not first contact.
