# Runtime boundary — what process-governance authors vs. what the engine runs

> **Scope of this doc.** The invariant that separates *authoring* (this app) from
> *execution* (Camunda, via the Kotlin backend). process-governance is the agent-driven
> successor to `apps/process-assets`; it inherits the same boundary. The fuller
> backend-side treatment (deploy bridge, form delivery, license gating, the four-project
> split) lives — during the migration — in
> [`apps/process-assets/docs/architecture/runtime-boundary.md`](../../../process-assets/docs/architecture/runtime-boundary.md).
> This file is the **SSOT for the invariant as process-governance enforces it in code.**
> **구현 상태(날짜별):** [`../STATUS.md`](../STATUS.md) — 이 문서는 *timeless* 불변식 SSOT; "어디까지 됐나"는 STATUS.

## The invariant

**Every BPMN this app persists carries `isExecutable="false"`, and this app never
authors Camunda *execution* attributes.** The model is an *authoring artifact* — for
editing and governance, not for direct deployment. The Kotlin backend translates
authoring intent into a runnable Camunda model at deploy time; the runtime is **always**
`boxwood-automation-engine` (Camunda 7.24). There is no BPMN runtime inside this app.

## Where it's enforced (this app)

| Concern | Enforcer | Note |
|---|---|---|
| `isExecutable="false"` on save | [`src/shared/lib/bpmnXml.ts`](../../src/shared/lib/bpmnXml.ts) → `forceNonExecutable()` | Single source of truth. Rewrites `isExecutable="true"` → `"false"` on **every** process in the XML, regardless of what the modeler emits. |
| Same rule on the **agent** save path | [`src/shared/lib/agentDraftSave.ts`](../../src/shared/lib/agentDraftSave.ts) → `saveBpmnDraft()` | Runs the XML through `forceNonExecutable` so the propose→save flow can never drift from the editor. Covered by `agentDraftSave.test.ts`. |
| Model-quality checks (no execution concerns) | [`src/features/modeler/lib/bpmn-validation.ts`](../../src/features/modeler/lib/bpmn-validation.ts) | Pure model-level rules (start/end, connectivity, gateway shape, owner-missing, call integrity, duplicate id, call-cycle). Camunda extension properties / form-key wiring / deploy-time correctness are **explicitly out of scope**. |

Because `forceNonExecutable` is the one chokepoint shared by both write paths (editor and
agent), the rule cannot diverge between them.

## What this app does NOT author

process-governance never writes `camunda:assignee`, `camunda:candidateGroups`,
`camunda:formKey`, `camunda:topic`, `camunda:calledElement*`, `camunda:expression`,
`camunda:resultVariable`, or input/output mapping XML. Those are **execution-only**
attributes, written exclusively by the backend at deploy time (or by hand-authored XML /
external tools).

**§9.2 round-trip rule:** if such attributes already exist in imported XML, they must
survive the import → store → export cycle byte-faithfully. The app commits to *not
corrupting* them — not to *editing* them. In this app they are read-only data inside the
XML model.

## Authoring intent — what this app records instead

The app captures *intent* in `boxwood:*` extensions / asset fields; the backend translates
it to Camunda at deploy time:

| Authoring marker | Carries | Camunda translation (backend, at deploy) |
|---|---|---|
| `boxwood:taskOwner` | Designed responsible person (`Person.id`) | `camunda:assignee` or a resolving TaskListener |
| `boxwood:AutomationCandidate` | Automation strategy metadata | Read-only reporting metadata; not used by the runtime |
| `flowConditions[flowId]` (structured rule) | `always` / `formField op value` — **never FEEL** | Camunda condition expression (typically JUEL) |
| `userTaskForms[]` (HTML keyed by element id) | Form bodies | Uploaded as deployment resources + `camunda:formKey` stamped |
| `isExecutable="false"` (always) | "this is an authoring model" marker | Backend flips to `true` (or omits) at deploy |

## Condition language

FEEL is locked out. Conditions are authored as structured rules
(`{ kind: 'always' }` or `{ kind: 'formField'; field; op; value }`, where `op` is
`eq | neq | gt | gte | lt | lte | contains`) and translated to Camunda condition
expressions by the backend at deploy time.

## Anti-patterns

- **Embedding a BPMN runtime in this app.** There's already an engine — don't reinvent it.
- **Writing Camunda execution attributes from authoring code.** Intent (`boxwood:*`) only.
- **Talking to the engine directly from the frontend.** The Kotlin backend is the only
  point of contact (license gating + tenant scoping + audit happen there).
- **Bypassing `forceNonExecutable` on any new save path.** Route all BPMN writes through
  `bpmnXml.ts` so the invariant holds everywhere.

## Related

- [`apps/process-assets/docs/architecture/runtime-boundary.md`](../../../process-assets/docs/architecture/runtime-boundary.md)
  — fuller backend-side treatment (deploy bridge, form delivery, license gating). Migrates
  into this app as that scope reaches parity.
- [`docs/architecture/bff-sse.md`](./bff-sse.md) — the BFF + SSE transport SSOT.
- [`docs/README.md`](../README.md) — doc map / entry point.
