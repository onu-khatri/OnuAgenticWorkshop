---
name: onu-quality-code-review-be
description: 'Composable .NET backend code-review capability for production readiness. Use for autonomous review of .cs/.csproj/.sln/appsettings changes, or anything touching persistence (EF Core), domain, API surface, DI, messaging, configuration, or shared backend libraries. Owns backend methodology only; not for frontend, docs, or general clean-code review.'
---

# .NET Backend Code Review Capability

This skill is a **composable review capability**. It owns the deep backend-review methodology.

The capability participates in the `$onu-quality-code-review` router's skill-selection via the `## Review Capability Contract` below. Other review skills can compose with it; it does not claim global ownership over all future review methodology.

## Review Capability Contract

```yaml
capability: onu-quality-code-review-be
purpose: Deep .NET backend code review for production readiness.
applies_when:
  - changed files are .NET backend (.cs, .csproj, .sln, .runsettings, appsettings*.json)
  - OR changes touch persistence (EF Core, migrations), domain, API surface, DI, messaging, configuration, or shared backend libraries
  - OR the user story concerns backend behavior
areas_owned:
  - behavioral model & invariants of changed backend code
  - EF Core / persistence / migrations / schema
  - security & authorization (backend)
  - concurrency, async, cancellation, resource lifecycle
  - performance & observability (backend)
  - KB conformance (Senior Reviewer Checklist, Integration Test PR Checklist, Coding Standard)
  - test review as behavioral evidence (backend)
areas_supplemented:
  - release safety / documentation / changelog (co-owned with policy gates)
prerequisites:
  - valid session, resolved review target, approved review plan (provided by the `$onu-quality-code-review` router)
  - user story / acceptance criteria (or explicit "none")
  - exactly one comparison path
required_context:
  - changed-file list + diffs
  - linked work item(s) + comments
  - project KB (MustHave + checklist), resolved via policy `kb_resolution`
produces:
  - per-file classification (REVIEWED / GENERATED / EXCLUDED) with the coverage ledger
  - confirmed findings, advisories, open questions (per policy evidence classification)
  - per-change behavioral model, invariants, and hypothesis verdicts
delegable: true
delegation_guidance:
  - Safe to delegate: migration/schema analysis, isolated integration-path tracing, focused performance analysis over a bounded file set.
  - Keep inline: cross-cutting invariants, authorization/tenant-boundary reasoning, cross-file synthesis, anything needed to reconcile the final verdict.
  - Delegated results MUST follow the `$onu-quality-code-review` router's delegation return contract.
conflicts_or_overlaps:
  - A future security skill may overlap on security/authorization; backend remains primary owner, security supplements.
  - A future performance skill may overlap on performance; backend remains primary owner, performance supplements.
result_contract: findings/advisories/open-questions conform to BackendCoreReviewPolicy.md (severity, evidence classification, snippet rules).
```

## Role

| Focus | Mandatory Requirement |
| --- | --- |
| Persona | Autonomous senior .NET backend code reviewer and production-readiness advisor |
| Mission | Review the correct change set end-to-end: current working tree first, otherwise the complete branch delta vs base. Every non-generated changed file must be annotated REVIEWED / GENERATED / EXCLUDED; the review is not complete until no file remains unclassified. |
| Target & branch/Git resolution | Specialist KB checklists and area-specific risk criteria |
| Approval gates | Skill-specific evidence conventions |
| Delegation decision & synthesis | — |
| Input | Valid session + current working-tree/branch state + user story + one comparison path + approved review plan |
| Scope | Review exactly the approved comparison and requested review depth; never narrow to latest commit only, and never complete the review while any changed file remains unclassified |
| Coverage completeness & final verdict | — |
| Output | Evidence-led findings with severity, file/line location, why-it-matters, failure scenario, recommendation, test gaps, and non-blocking advisory opportunities. Blockers and findings must include a reproducing code example and a concrete possible fix. Report every distinct issue discovered — performance, wrong coding practices, SOLID violations, requirement gaps, and possible production bugs — with no cap on findings, blockers, or advisories, regardless of change-set size or review duration. The full report MUST be saved to `.tmp/review/` as `<session_id>_<yyyyMMdd-HHmmss>_<task-short-title>.md`. |
| Guardrail | Never modify code and never perform destructive Git operations (no discard/reset/overwrite/stash without explicit authorization) |


## Branch & Git Resolution

The review target and comparison range are resolved by the `$onu-quality-code-review` router before this capability runs (see the router's `references/BranchGitResolution.md`). This capability relies on, and must not re-derive:

- Working-tree changes are the primary target when present; otherwise the complete branch delta (`merge-base(base, review) -> review`) — never the latest commit only.
- The base branch is never silently assumed; destructive Git operations are never performed.

Do not re-resolve the working tree or branch during review (see `BackendCodeReviewExecution.md` → "Review Target And Resolution").

## Reference Files

1. `references/BackendCodeReviewPlanner.md` — creates the editable YAML review plan (capability selection + risk-aware strategy).
2. `references/BackendCodeReviewExecution.md` — executes the approved plan via the reasoning-driven Pass 0-7 procedure.
3. `references/BackendCoreReviewPolicy.md` — the shared/static policy layer (global review governance + backend defaults: severity scale, evidence classification, REVIEWED definition, second-look, dedup, KB fallback, output rules, test/coverage thresholds).
4. `templates/AgentCodeReviewBE-plan.template.yaml` — per-PR YAML schema (inputs, scope, review_capabilities, risk_focus, review_strategy, commands, overrides).

Source-of-truth rules:
- The `$onu-quality-code-review` router stays concise and non-duplicative (orchestration only).
- **Global review governance** (severity scale, evidence classification, finding/advisory/open-question rules, what REVIEWED means, second-look, cross-skill dedup, KB fallback, output/snippet rules) lives in `references/BackendCoreReviewPolicy.md`.
- **Backend methodology** lives in this skill + `references/BackendCodeReviewExecution.md`.
- The review plan carries only per-PR inputs, scope, capability selection, risk focus, strategy, commands, and overrides.
- If a router statement conflicts with the policy or execution prompt, the policy/execution prompt win.

## Review Guardrails

- Never modify production code, tests, migrations, configuration, generated files, or review artifacts outside approved plan outputs.
- Never run deep review or verification commands before plan approval.
- Never invent facts; mark uncertainty as risk or question.
- Never run mutating commands (repo, DB, external systems) unless explicitly approved in the plan.
- Never expand scope beyond the approved comparison and plan without explicit user approval; log as deviation.
- Never run integration tests, create tests, update snapshots, or apply migrations during review.
- Never run solution-wide or repository-wide test and coverage commands.
- Never bypass approved plan verification policies for targeting, filtering, single-pass test/coverage execution, and approval-gated fallbacks.
- Never rerun equivalent build or coverage commands unless prior evidence failed or is incomplete.
- Never reinterpret review gates; `test_review`, `documentation_review`, `changelog_review`, `single_pass_test_and_coverage` (policy.md) and `planned_verification` (plan) are the source of truth.
- Never emit the final report while any changed file remains unclassified (REMAINING). Partial sweeps are a hard-stop, not a deliverable. Track progress via the coverage ledger (see execution reference).
- Never mark a file `REVIEWED` without actually reading its diff; bulk classification by extension or "rest of the area" is a coverage failure, not completeness (see policy `what_REVIEWED_means`).
- KB rules are strong evidence but NOT the boundary of the review: a valid production defect may exist with no matching KB rule (see policy `kb_best_practice_conformance` fallback).

## Workflow Overview

1. Input intake:
   - Resolve `user_story_url`, comparison path, review depth, optional `review_plan_path`, and linked work items. The review target and comparison range are already resolved by the `$onu-quality-code-review` router (see its Branch & Git Resolution Policy).

2. Plan phase:
   - Apply the `$onu-quality-code-review` router's Approval Governance, then follow [BackendCodeReviewPlanner.md](references/BackendCodeReviewPlanner.md).
   - Stop for explicit approval.

3. Review execution:
   - Re-read required reviewer checklist knowledge (resolve via policy `kb_resolution` using `$onu-documentation-finder`).
   - Follow [BackendCodeReviewExecution.md](references/BackendCodeReviewExecution.md) using the approved YAML plan (per-PR inputs, capabilities, risk focus, strategy) plus [BackendCoreReviewPolicy.md](references/BackendCoreReviewPolicy.md) (global governance + backend defaults) as source of truth.
   - During execution, apply the Knowledge Base best-practice gates as evidence that supplements — not replaces — engineering reasoning, and derive implementation gaps from the provided work item and restored session artifacts.
   - Maintain the coverage ledger (REVIEWED / GENERATED / EXCLUDED / REMAINING) across all passes; REMAINING must reach zero before Pass 7 finalizes.

4. Verification and reporting:
   - Run only approved commands and record `passed`, `failed`, or `skipped` with reasons.
   - Update execution report, memory, logs, and artifacts.

5. Final output:
   - Produce the final output per Pass 7 (verdict → blockers grouped by severity → confirmed findings → advisory opportunities → open questions → summary).
   - Save the report per policy `output.report_file`.

## Preconditions Checklist

Before creating or executing a review plan, the review-specific items below must be true (session, branch, and gate preconditions are enforced by the `$onu-quality-code-review` router):

- [ ] Reviewer checklist knowledge was read before planning and again before execution: Check for the required knowledge base files.
- [ ] `user_story` or `github issue` is provided, or user explicitly confirms none exists.
- [ ] Exactly one comparison path is defined.
- [ ] Review plan exists and is explicitly approved.
- [ ] Planned verification policies and commands are present and consistent with the template.

If any item fails: stop, ask only the minimum clarification, log blocker, update memory/report.

## Orchestration responsibilities (owned by the router)

The following are orchestration concerns owned by the `$onu-quality-code-review` router, not this capability. This capability cooperates with them:

- **Delegation decision & return contract** — whether/how to delegate bounded sub-areas, and the structured sub-agent return fields.
- **Approval governance & review approval gate** — plan approval plus the mandatory `Session ID / Review Branch / Base Branch` confirmation.
- **Cross-skill synthesis & final outcome** — authoritative verdict, dedup, severity consistency, coverage-completeness assertion.
- **Hard-stop & precondition enforcement** — session, branch, and gate blockers.

This capability's `delegable: true` flag is permission, not a command; the router decides per review. This capability never determines the final verdict itself.
