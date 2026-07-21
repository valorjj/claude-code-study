# Chip system — the color + hierarchy grammar

**Status:** canonical (SSoT). Codifies the rules applied across the 2026-07
operating-map / design-language rollout. When a page and this doc disagree, the
page is the bug — fix the page.

Related: the design-language overhaul spec
(`docs/superpowers/specs/2026-07-08-design-language-overhaul-design.md`) and the
token definitions in `src/styles/app.css`.

## The one rule

> **Color encodes STATE or SEVERITY — never CATEGORY. Identity is monochrome.**

- **State / severity** → color (a lifecycle stage, an approval status, a
  maturity level, a health/attention severity). Color is load-bearing: it tells
  you *how something is doing*.
- **Category / identity** → neutral ink, differentiated by **label** (and, where
  useful, by **shape**, **size**, or **position** — never hue). Asset type,
  classification axis value, system category, department, hierarchy level, owner:
  these say *what something is*, not how it's doing.

Corollaries:
- A chip's hue must not **vary by a category value** (e.g. one hue per asset
  type, one hue per department). That is the "rainbow-by-category" anti-pattern.
- **Accent (`--pap-accent`) is for interactive affordances** (links, selected
  filters, focus) — not for labeling a category. A static category label is
  neutral ink even if the hue would be uniform across values.
- No left-border / accent-bar highlight for active/selected state — use a
  soft-accent fill or weight instead.
- Owner/person = **monochrome** initials avatar (`OwnerAvatar`), never a colored
  identity chip.

## Token families (from `app.css`)

| Family | Purpose | Examples |
|---|---|---|
| `--pap-ink-{050..900}` | neutral ramp — text, borders, category chips | `ink-050` bg, `ink-700` text, `ink-500` count |
| `--pap-stage-*` | lifecycle **state** colors | proposed/requirements/development/verification/operation/retired |
| `--pap-status-*` | asset **status** colors | draft/review/active/deprecated |
| `--pap-sev-{none,low,med,high}` | **severity** ramp (health) | success→warning→danger |
| `--pap-{success,warning,danger,info}-{soft,text,border}` | semantic **state** intents | approval status, deactivation, attention |
| `--pap-accent{,-soft,-strong}` | interactive **affordance** only | links, active filter chip, focus ring |

## Canonical chip → role → color map

Every chip component in `src/shared/components/` and where it sits on the rule:

```yaml
# role: category|identity  → neutral ink (label-differentiated)
# role: state|severity      → colored (token below)
chips:
  type:            # asset type: Process/SOP/Policy/Template/TaskBundle/WorkInstruction
    role: category
    color: neutral            # ink-700 on ink-050 — SAME for every type
    tokens: [--pap-type-*]    # all resolve to ink-700 / ink-050
    component: Badge
  templateKind:    # process/task/fragment/object
    role: category
    color: neutral            # ink-700 on ink-050 (matches Badge)
    component: TemplateCard .tcard__kind
  systemCategory:  # SAP/legacy/manual/none
    role: category
    color: neutral            # ink-700 on ink-050
    component: TemplateCard .tcard__sys, SaveAsTemplateModal, TemplatesPage filter
  classification:  # multi-axis lens values (LoB, module, e2e, …)
    role: category
    color: neutral
    component: ClassificationChips
  externalRef:     # link to an external system/service
    role: identity
    color: neutral
    component: ExternalRefChip
  level:           # L0–L7 hierarchy depth
    role: category
    color: neutral            # tier by WEIGHT/size, not hue (L0/L1 heavier)
    component: tree level chip (TreeView / AssetTreeNode)
  count:           # child/group/relation counts
    role: structural
    color: neutral            # ink-500 on ink-100, mono
    component: CountPill
  owner:           # a person (steward / 정·부 담당 / author)
    role: identity
    color: monochrome         # ink initials
    component: OwnerAvatar
  # ---- colored (state / severity) ----
  state:           # lifecycle stage 제안→요건검토→개발→검증→운영→폐기
    role: state
    color: --pap-stage-*      # via stageColorVar()
    component: StateChip      # pill reuses .stage-badge; dot variant = colored dot + neutral label
  status:          # AssetStatus (draft/active/deprecated…)
    role: state
    color: --pap-status-*
    component: StatusBadge
  maturity:        # Draft→Reviewed→Certified→Deprecated
    role: state                # an ordered maturity ramp
    color: [ink-600, info, success, danger]   # draft neutral → certified green → deprecated red
    component: MaturityBadge
  deactivated:     # reversible "stop new runs" caution state
    role: state
    color: --pap-warning-*    # caution, NOT danger (danger = terminal Retired)
    component: DeactivatedBadge
  mode:            # transient UI mode — you-are-here signal (e.g. "편집 모드")
    role: state                # a mode is a state of the view, not a category
    color: --pap-warning-*     # amber caution: unsaved/editing mode
    component: EditPage .edit__mode-pill
  severity:        # attention/health tiers (unowned, stale, overdue, completeness band)
    role: severity
    color: --pap-sev-* / danger|warning|info   # danger > warning > info
    component: AttentionPanel chips, monitoring RiskMatrix / completeness bands
  statTile:        # a headline metric
    role: number + optional state dot
    color: neutral number; optional leading state dot (dotColor)
    component: StatTile
```

## Chip visual hierarchy (per chip)

Within a single chip, rank the signal:
1. **State/severity color** — the strongest signal, reserved for how-it's-doing.
2. **Label** — carries category/identity; always present, always readable.
3. **Weight / size** — tiering (e.g. tree L0/L1 heavier), not decoration.
4. **Accent** — only if the chip is interactive (link/filter/selected).

A row should carry **at most one colored (state) chip** as its status signal;
everything else on the row is neutral. Two colored chips compete and the row
reads as noise.

## Per-surface chip hierarchy

The chips each surface shows, in reading order (bracketed = a chip; colored ones
noted). `state` = StateChip, everything unbracketed-colored is neutral.

| Surface | Row / header grammar |
|---|---|
| **Explorer tree** (TreeView) | `[level]` · **name** · `[state·dot]` (colored) · owner-avatar · `[count]` — L0/L1 heavier |
| **Explorer list** (AssetTable) | favorite · **name** `[type]`(All tab) · `[state]`(colored) · owner-avatar+name · version |
| **Detail** (OverviewTab) | `[type]` · `[state]`(colored) · person avatars; LifecycleStepper (Process only) |
| **Matrix drill-down** | **name** ·id · `[state]`(colored) · owner-avatar+name |
| **Approval inbox** | **name** · `[maturity]`(colored ramp) · approval `[status]`(colored) |
| **Monitoring** | state distribution bars (colored=stage) · severity bands (colored=sev) · level bars (neutral) |
| **Dashboard** | KPI numbers (severity-colored) · inbox kind chips (neutral) · attention chips (severity) · dept bars (neutral) |
| **Templates** | section by kind · `[kind]` · `[systemCategory]` (both neutral) · `원본→` link(accent) · `[count]` · ⤓downloads |
| **Community** | `[status]` open/resolved (colored) · severity KPI cards |
| **Relationship graph** | nodes neutral by default (type via size+filter+label); color is an opt-in axis channel; edges colored by health-state |

## Adding a new chip — decision procedure

1. **Does the value say how-it's-doing (state) or what-it-is (category)?**
   - how-it's-doing → pick a state/severity token family; color it.
   - what-it-is → neutral ink (`ink-700`/`ink-050`), differentiate by label.
2. **Is it interactive** (click filters/navigates)? Only then may it use accent
   for its active/hover affordance — never to label a category.
3. **Reuse a component** before adding one: `StateChip` for any lifecycle state,
   `Badge` for a type, `CountPill` for a count, `OwnerAvatar` for a person.
4. **One status color per row.** If the row already has a state chip, the new
   chip is neutral.
5. Never introduce a new hex literal outside `app.css`; reference a token.

## Known exception / open question

- **Template kind chip** (`TemplateCard .tcard__kind`) is currently **neutral
  ink** (color=category rule). An earlier iteration left it accent under a
  "uniform accent = affordance" reading; the 2026-07-13 review neutralized it and
  the design lead confirmed keeping it neutral. If a future **chip + status
  hierarchy** pass (planned, across tree/approval/other surfaces) introduces a
  deliberate primary-descriptor emphasis, revisit here and update this doc first.
