# Automated guards — executable policy

> **Why this exists.** Some rules in this project are load-bearing: breaking one
> produces a *silent* defect (a wrong-coloured pixel, an agent that can't navigate,
> a vendor lock-in that breaks the Gemini→Claude swap). Prose policy rots and gets
> skipped under time pressure; a test does not. Every rule listed here is enforced by
> a check that **fails the normal test run**, so the rule holds the same way for every
> dev and every CI run — no memory, no review vigilance required.
>
> These are the strongest rung of the policy ladder: `buried doc < CLAUDE.md prose <
> skill checklist < **lint/test** < hook`. A rule that can be cheaply made executable
> belongs here, not in prose.

## The guards

| Guard | Rule (what it forbids) | Enforced by | Why it matters |
|---|---|---|---|
| **Route coverage** | `APP_ROUTES` must have unique ids/paths, use base-less paths, and cover **every** navigable sidebar leaf in `nav-menu.ts`. | `src/lib/routes.test.ts` | `APP_ROUTES` feeds the agent's `navigate_to` tool. Drift = the agent silently can't reach pages. |
| **PAP accent tokens** | No `var(--primary-*)` **reads** anywhere in the PAP surface (`apps/process-governance/src` + `packages/agent-ui/src`). | `src/lib/pap-tokens.test.ts` | `--primary-*` is the per-app re-brand (green in ecoletree, teal in `automation`). A shared widget that reads it silently inherits the wrong brand instead of PAP blue (`--pap-accent`). |
| **Vendor boundary** (req #2) | Vendor SDKs/endpoints (`@google/genai`, `@anthropic-ai`, `generativelanguage.googleapis…`, `GoogleGenAI`, `new Anthropic`) and **real** model ids (`gemini-3…`, `claude-sonnet…`) appear **only** in `packages/agent-core/src/llm/`. | `src/lib/vendor-boundary.test.ts` | Keeps the Gemini→Claude swap a one-line config change. Vendor coupling anywhere else defeats the `LLMProvider` seam. |

## design-guards (src/lib/design-guards.test.ts)

- **Density declaration** — every `features/*/pages/*.svelte` (+ the create route)
  must declare `data-density="compact|regular|spacious"` on its root. Spec P5.
- **Hex baseline** — no file outside `styles/app.css` may *gain* hex color
  literals; counts are frozen in `design-guards.baseline.json` and may only
  shrink. Rebaseline after debt reduction with `UPDATE_DESIGN_BASELINE=1`. Spec P1.
- **Route coverage hole:** the density guard's `pageFiles()` only walks
  `features/*/pages/*.svelte` plus the `(portal)/create` route — a future page hosted
  directly under `src/routes/**/+page.svelte` (rather than a `features/*/pages/`
  component) will **not** be scanned and must be added to `pageFiles()` by hand.
  `src/routes/drafts/+page.svelte` is a known non-portal stub outside the guard today.

## What is deliberately *allowed*

So the guards don't over-fire, each draws a precise line:

- **PAP tokens:** the pattern matches `var(--primary-` (a *read*), not bare `--primary-`. So
  rule-documenting comments are fine, and the sanctioned remap layer
  `styles/ecoletree-overrides.css` (`--primary-500: var(--pap-accent)` — a *definition*) is fine.
- **Vendor boundary:** the provider *wrapper* class name `GeminiProvider` is allowed — it's OUR
  seam (the one-line swap point the host instantiates), not a vendor SDK symbol. Placeholder
  model names in tests (`gemini-custom`, `test-model-x`) are allowed — the model-id pattern only
  matches a *real* id (a digit / `opus|sonnet|haiku` right after the dash). The separate
  `apps/automation` app has its own user-facing model picker and is **not** policed here.

## How they run

All three are plain Vitest tests under `src/lib/` and run as part of the normal suite:

```bash
pnpm --filter process-governance test            # whole suite (CI)
pnpm --filter process-governance test -- routes pap-tokens vendor-boundary   # just the guards
```

No husky, no extra tooling, no new deps — they ride the pipeline the team already runs. This
matches the repo's existing guard pattern (`routes.test.ts` predates this doc).

## Strongest rung: the pre-write hook

Two of these rules (PAP accent tokens · vendor boundary) are *also* enforced up front by a
**PreToolUse hook** — `.claude/hooks/pap-policy-guard.mjs`, wired in `.claude/settings.json`
(`Edit|Write|MultiEdit`). It scans the text about to be written and **blocks the edit**
(exit 2) before it lands, mirroring the two tests' regexes exactly, so Claude Code self-corrects
immediately instead of finding out at CI.

- Hook = fast, pre-write, **Claude Code sessions only**. Test = the **CI backstop** that also
  catches human/non-Claude edits. Keep both — defense in depth.
- The hook fails **open** (never wedges editing) and allows the same legitimate forms the tests do
  (the remap layer, the `GeminiProvider` seam, test placeholders, the two guard files, the
  `agent-core/src/llm` vendor home, `apps/automation`, docs).
- **These tests are the SSOT for the rule wording.** If you change a regex here, change it in the
  hook too (and re-run the case checks) so the two never disagree.

## Adding a new guard

When a rule keeps getting violated in review, promote it from prose to a guard:

1. Write a Vitest test in `src/lib/<name>.test.ts` that scans source text (use the fs-walk in
   `pap-tokens.test.ts` / `vendor-boundary.test.ts` as the template) and `expect(offenders).toEqual([])`
   with a message that names the fix.
2. **Match the consuming form, not the topic** — e.g. `var(--primary-` (a read), a *real* model
   id — so legitimate mentions (comments, definitions, placeholders) don't false-fire.
3. **Prove it fails on a violation before trusting it.** A guard you've never seen go red is a
   hope, not a guard. (Quick `node -e` regex check, or temporarily inject a violation.)
4. Register it in the table above and, if it encodes a CLAUDE.md rule, add an "Enforced by" note
   next to that rule so the prose and the check point at each other.
