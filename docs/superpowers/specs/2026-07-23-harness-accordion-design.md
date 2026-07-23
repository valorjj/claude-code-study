# Design: Harness section accordion with real-code examples

Date: 2026-07-23

Turn the static "하네스 구성요소" table into an accordion: clicking a harness-element row
expands a detail panel explaining what it is / why it matters, plus real-code `FileChip`s
(from the process-governance project) that open the existing Monokai markdown modal.

## Approach

**Accordion rows** (chosen over a modal): progressive disclosure, mobile-friendly, no
overlay chrome. One row open at a time. The table stays a real `<table>` (reads as data);
the detail is a full-width `<tr colSpan=5>` beneath the clicked row.

**Real code reuses existing infra**: `FileChip` → `MdModalProvider`. Example files are
embedded from `content/` (SSOT), so "actual code" needs no new viewer.

## Changes

### Data — `src/lib/data/harnessRows.ts`
`HARNESS_ROWS: HarnessRow[]` with the 5 table cells + `what` (explanation), `why` (one-liner),
and `files` (example keys). Answers the user's questions: What is SSOT? What are skills /
subagents for? How does memory work?

### Component — `src/components/HarnessTable.tsx` (+ `.css`)
Client accordion. `openId` state; row is `role=button` + `aria-expanded`/`aria-controls`,
keyboard (Enter/Space), rotating caret. Detail panel shows `what`, `why`, and `실제 예시`
chips. `.md-clickable` chip affordance mirrored locally (the walkthrough's rule is scoped to
`#walk`).

### Section — `src/components/sections/Harness.tsx`
Server component now renders `<HarnessTable/>` (was an inline static table); keeps the
eyebrow/h2/intro/takeaway. Adds a hint: "각 행을 클릭하면 설명과 실제 코드가 열린다."

### Embedded content (new reference files)
Copied from the process-governance monorepo into `content/`, added to `content/manifest.json`,
regenerated via `npm run content`:
- `.claude/agents/code-reviewer.md` — real subagent definition (subagents row).
- `.claude/skills/pg-feature-pipeline/SKILL.md` — real task-recipe skill (skills row).

Other rows reuse already-embedded files (`CLAUDE.md`, app `CLAUDE.md`, `docs/*`,
`memory/MEMORY.md`, `svelte5-boxwood`). `scratchpad` is conceptual — no file chip.

## Verification
- `npm run content` embeds the two new files (19 total); committed `mdFiles.json` /
  `mdFileKeys.json` regenerated (CI drift gate).
- typecheck, lint, tests, Next build pass; single-file `npm run html` still emits one file.
- Manual: click each row → detail expands, chips open the correct file in the modal; search
  now surfaces the two new files (SearchBox indexes all embedded files).
