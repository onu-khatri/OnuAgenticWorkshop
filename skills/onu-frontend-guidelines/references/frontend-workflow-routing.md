# Frontend Workflow Routing

Use this reference to choose the smallest effective frontend workflow. It defines coordination only; implementation standards remain in the routed frontend-guidelines references.

## Default Order

1. Start from the requirement, route, current behavior, applicable contract, and local repository evidence.
2. Use `$onu-research-deep` only when significant ambiguity or cross-cutting impact remains after local discovery. Its decision brief becomes input to the next owner.
3. Use `$onu-workflow-user-interview` when a material product, audience, scope, priority, constraint, or approval decision remains unresolved after available evidence. It returns confirmed decisions to the calling workflow.
4. Use `$onu-frontend-design` only when visual direction, hierarchy, copy, or interaction intent is missing or deliberately changing. Its output is a handoff, not code delivery.
5. Use `$onu-frontend-development` as the default primary implementation owner. It reads `$onu-frontend-guidelines` for standards and applies them directly. For an explicitly UI/visual-dominant request, use its UI-dominant mode.
6. Use exactly one specialist only when its trigger applies, then return its constraints or findings to the primary owner.
7. After an inspectable implementation exists, route review by need: `$onu-quality-code-review-fe` (via `$onu-quality-code-review`) for production-readiness code review, `$onu-frontend-design` review mode for a visual critique or pre-ship design check, and `$onu-frontend-presentations` only when the deliverable is a presentation.

## Specialist Triggers

| Need | Select | Do not select when |
| --- | --- | --- |
| Significant ambiguity across requirements, source, tests, users, or current external standards | `$onu-research-deep` before design or implementation | A focused local inspection can answer the decision confidently. |
| Material goal, scope, audience, constraint, tradeoff, or approval decision lacks an evidence-backed answer | `$onu-workflow-user-interview` before the blocked decision | The answer is already available from the request, repository, or authoritative source. |
| Shared client architecture, data, forms, routes, state, accessibility, or tests | `$onu-frontend-guidelines` with the primary owner | The task is visual direction only. |
| A React or TypeScript pattern decision that remains unclear after local inspection | `$onu-frontend-guidelines` → `references/react-patterns.md` | It would duplicate existing source patterns. |
| Auth, redirects, untrusted content, sensitive data, or browser trust boundary | `$onu-frontend-security` | No client trust boundary changes. |
| Measured or visible rendering, bundle, network, or responsiveness regression | `$onu-quality-performance` | No concrete performance problem exists. |
| Design direction, critique, or pre-ship visual review | `$onu-frontend-design` (create or review mode) | The task is implementation-only with no design decision. |
| Production-readiness code review of a frontend change | `$onu-quality-code-review-fe` (via `$onu-quality-code-review`) | The change is backend-only or design-only. |
| Stakeholder walkthrough or presentation | `$onu-frontend-presentations` | Production code is the deliverable. |

## Loop Guards

- A workstream has one primary owner: `$onu-frontend-development` or `onu-frontend-implementer`; never more than one concurrently.
- `$onu-frontend-development` is the default primary lane for feature/behavior work (routes, data, state, forms, API integration). Use its UI-dominant mode only for an explicitly UI/visual-dominant request (layout, hierarchy, polish, theming) where behavior wiring is secondary.
- `$onu-frontend-guidelines` and the specialists are consulted references or bounded review passes, not separate delivery coordinators.
- A specialist does not invoke another frontend skill or agent. It returns a concrete handoff, finding, or constraint to the primary owner.
- `$onu-research-deep` may use `$onu-workflow-user-interview` only to frame an otherwise unanswerable decision; `$onu-workflow-user-interview` never starts research or implementation. After either completes, control returns to the calling workflow.
- The primary owner may request at most the specialists whose triggers are present. It does not re-enter design after an approved handoff unless the requirement materially changes.
- `onu-frontend-implementer` does not delegate or create subagents. A parent coordinator owns cross-layer contracts, synthesis, and any parallelization.
- `onu-frontend-implementer` does not interview the user or open a broad research workstream. It reports the exact unresolved decision and evidence gap to its parent, which selects the gate.
- For a frontend/backend shared contract, use `$onu-delivery-full-stack-feature` or `onu-story-orchestrator`; do not split the contract across frontend specialists.
