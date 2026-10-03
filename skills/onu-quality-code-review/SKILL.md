---
name: onu-quality-code-review
description: 'Orchestrate an autonomous production-readiness code review end to end: resolve the review target and comparison range, select review capabilities, drive plan approval, delegate bounded sub-reviews, synthesize findings, and emit the final verdict. Composes capability skills such as $onu-quality-code-review-be, which own the per-language/domain review methodology.'
---

# Code Review Orchestrator

This skill is the **router** for code review. It owns orchestration only and stays concise and non-duplicative: review methodology lives in the capability skills it composes (e.g. `$onu-quality-code-review-be`), and static governance lives in each capability's policy layer (e.g. `BackendCoreReviewPolicy.md`).

## Responsibilities (orchestration only)

1. Session & review-target intake
2. Capability discovery & selection
3. Review-plan approval governance
4. Delegation decision & return contract
5. Cross-skill synthesis & final outcome
6. Hard-stop & precondition enforcement

## Capability discovery & selection

Select capability skills by matching each one's `## Review Capability Contract` (`applies_when`, `areas_owned`, `areas_supplemented`) against the changed file types, technologies, architectural areas, and the user story.

- Record each selected capability in the plan's `review_capabilities` with `mode` (primary/supplementary) and `execution` (inline/delegate_candidate).
- Exactly one capability is `primary` owner of an area; others are `supplementary`.
- Mark a capability `delegate_candidate` only if its contract declares `delegable: true` and a bounded, independently-analyzable sub-area exists.
- Load each selected capability via the `skill` tool; each owns its own methodology.

Current capabilities:

- `$onu-quality-code-review-be` — .NET backend methodology (primary for backend changes).

## Session & review-target intake

Resolve the review session and target before any review work. Follow [BranchGitResolution.md](references/BranchGitResolution.md) for the full procedure (working-tree precedence, base-branch confirmation, safe repo prep, merge-base computation, guardrails).

Establish:

- Session ID
- Review target & comparison mode (working tree | branch delta | commit pair)
- Review branch + base branch
- user story / acceptance criteria (or explicit "none")
- linked work item(s)

## Approval governance

1. Produce the review plan — delegating plan creation to the selected capability's planner (e.g. `BackendCodeReviewPlanner.md`) — share its path, and stop for approval.
2. Continue only after one accepted response: `approved`, `approve plan`, `looks good`, or `proceed`.
3. If the user edits the plan, re-read it, summarize, and wait again for one accepted reply.
4. Treat any non-approved edit to a gated artifact as a logged deviation.

### Review approval gate (mandatory)

Obtain explicit confirmation of all three before starting the review:

```
Session ID: <id>
Review Branch: <branch>
Base Branch: <branch>
```

Do not start until all three are confirmed. If any is unclear, ask; never proceed on an assumption.

## Delegation decision & return contract

A capability's `delegable: true` is **permission**, not a command. Decide per review whether to delegate all or part of a capability's work to a sub-agent (`task` tool).

Decide using: complexity; specialization required; number of changed files; separability of the work; dependency between review areas; whether independent context improves analysis; duplicated-effort risk; whether another sub-agent already examines the same path; whether delegation improves quality; whether you need the context yourself to synthesize the final verdict.

- Delegate only when a well-scoped, independently-analyzable sub-problem exists and independent context helps.
- **Scale trigger (default-delegate):** for a LARGE change set, delegation is the DEFAULT. Partition bounded areas to sub-agents and keep inline only cross-cutting concerns (authorization/tenant boundaries, DI-lifetime consistency, cross-area invariants) plus final synthesis. Inline-only on a large set requires an explicit justification in `review_strategy.delegation_plan`.
- Proportional means effort scales with risk: a large set gets MORE total effort, partitioned via delegation.
- Do **not** spawn a sub-agent swarm for a small/simple PR.
- Never delegate the final verdict, cross-skill synthesis, or coverage-completeness assertion.

### Delegation return contract

Require each sub-agent to return a **structured** result covering at minimum:

- `reviewed_scope`, `files_areas_inspected`, `evidence_gathered`, `confirmed_findings`, `suspected_risks`, `validation_performed`, `unresolved_questions`, `assumptions`, `confidence`, `remaining_work`.

**Before** promoting a delegated `confirmed_finding` to authoritative, validate it against repository evidence yourself. If delegation tooling is unavailable or the sub-agent returns insufficient evidence, run the same methodology inline — never skip the capability.

## Cross-skill synthesis & final outcome

Own the authoritative synthesis of everything discovered — by any sub-agent or capability:

- scope correctness;
- review completeness (coverage ledger reaches zero `REMAINING`);
- acceptance-criteria reconciliation;
- cross-skill conflict resolution (one root cause = one finding; strongest evidence retained; specialist consequences preserved; severity from the global severity policy; all rule references recorded);
- deduplication (merge only same root cause);
- severity consistency;
- final findings, final verdict, final report.

A sub-agent never determines the authoritative final verdict.

## Hard-stop conditions

Stop and report the blocker when:

- the review plan is missing, malformed, or not explicitly approved;
- the plan asks for solution-wide or unfiltered test/coverage execution;
- the user asks to implement fixes, create tests, refactor code, update migrations, or bypass plan approval;
- approved verification commands would mutate the repository, database, remote services, or external systems.

Refusal template:

`Cannot proceed: required review inputs or plan-approval gates are not satisfied. Please provide the missing item or approve the review plan.`

## Reference files

1. `references/BranchGitResolution.md` — full branch & git resolution procedure (working-tree precedence, base-branch confirmation, safe repo prep, merge-base computation, guardrails).
