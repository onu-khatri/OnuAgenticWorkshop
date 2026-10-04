# Agent Instructions

These instructions apply to the repository unless a more specific nested `AGENTS.md` overrides them.

## Purpose and authority

Use authorities in this order:

1. explicit user request and approved scope;
2. this file for repository-wide invariants and gates;
3. the selected skill and its routed references;
4. approved plans, requirements, stories, and decisions for the cases they govern;
5. current repository code, tests, Git/worktree, and hosted evidence.

Prefer current repository evidence over inference. Do not turn an inferred
convention into a repository rule without recording the decision in its proper
authority.

The goal is minimum sufficient context: load only the authority needed for the
current decision, preserve explicit ownership, and verify every claimed state.

## Autonomous execution and user threshold

The parent agent owns the execution loop:

```text
request → minimum authority/evidence → classify → next safe action
       → execute or delegate → observe → verify → reconcile → continue
```

Continue automatically when the next action is inside approved scope,
reversible or low-risk, supported by evidence, and not blocked by required
approval, credentials, external authorization, or a material product decision.
Continue independent safe work when another lane is blocked.

Interrupt the user only when:

- a workflow gate explicitly requires approval;
- a material product, scope, security, data, UX, compatibility, or architecture
  decision has multiple evidence-supported outcomes;
- required information cannot be derived from repository or connected tools;
- credentials, secrets, external authorization, or an unavailable dependency
  must be supplied;
- the next action is destructive, irreversible, externally consequential, or
  outside approved scope; or
- authorities materially conflict without a safe precedence rule.

Before asking, state the exact decision, evidence checked, why it is material,
and the smallest required question. Do not interview for curiosity or routine
implementation preferences.

After every completed, failed, or blocked step choose the next safe action in
this order: continue the approved plan; verify the step; repair a local failure
within scope; retrieve narrow evidence; delegate an independent owned lane;
continue another unblocked lane; request a required decision; stop only when no
safe action remains.

## Skill and agent routing

Discover repository skills under `.agents/skills/<skill>/SKILL.md` and custom
agents under the vendor's native agent location. Read the selected skill before
acting and only its applicable references. Use this file for durable
constraints, skills for reusable procedures, agents for focused delegated work,
the knowledge index for durable project authority, and approved plans for
change execution.

Select the smallest applicable set:

| Decision or work | Route |
|---|---|
| Backend feature/pattern/security/persistence | `$onu-backend-feature-development`, `$onu-backend-dotnet-patterns`, `$onu-backend-security`, `$onu-backend-ef-core` as triggered |
| Architecture/domain/ADR | `$onu-architecture-review`, `$onu-backend-dotnet-architecture`, `$onu-architecture-domain-modeling`, `$onu-architecture-adr` as triggered |
| Frontend feature or UI | `$onu-frontend-development` plus `$onu-frontend-guidelines`; use React, design, security, performance, or review skills only when triggered |
| Full-stack/story delivery | `$onu-delivery-full-stack-feature` and the applicable delivery workflow |
| Development code, tests, configuration, or migrations | `$onu-workflow-development-entry` first; it routes specialists but does not invoke implementers |
| Single development request end-to-end | `onu-autonomous-developer` (driver) runs entry → implement → review → deliver |
| Plan created by `$onu-workflow-planning` | `$onu-plan-review-approval` |
| Production review/security/quality | `$onu-quality-code-review` (methodology) with `onu-code-reviewer` and `onu-security-auditor` as delegated review lanes; `$onu-security-management` for security design |
| Research or durable knowledge | `$onu-research-deep`, `$onu-knowledge-project-builder`, or documentation/product skill as triggered |
| Branch/worktree/commit/push/PR | `$onu-git-worktrees`, `$onu-git-workflows`, `$onu-git-commit`, `$onu-delivery-pull-request` as triggered |

Specialist skills return constraints, findings, evidence, or handoff; they do
not recursively invoke unrelated specialists or duplicate implementation
ownership. `$onu-frontend-guidelines` is a non-delegating standards authority.

The installed `onu-*` agents are defaults. To prefer your own implementation or
planning agents, name them in this file under the relevant route; your explicit
routing here takes priority over the installed agent catalog.

## Autonomous code and review loop

For one development request, the driver (a user-defined primary agent or
`onu-autonomous-developer`) runs this loop:

1. **Entry** — `$onu-workflow-development-entry` reconstructs state, classifies
   the delivery shape, and returns PASS/BLOCKED plus the implementation route.
   A plain-language request needs no user story, GitHub issue, or OpenSpec change.
2. **Implement** — follow the routed implementation skills
   (`$onu-backend-feature-development` or `$onu-frontend-development`), or
   delegate a bounded lane to `onu-backend-implementer` / `onu-frontend-implementer`.
3. **Review** — delegate `onu-code-reviewer` and `onu-security-auditor` as
   read-only lanes, using `$onu-quality-code-review` as the methodology; apply
   blocking findings before delivery.
4. **Deliver** — `$onu-git-commit`, then `$onu-delivery-pull-request`.

Interrupt the user only on a real gate (BLOCKED, a material unresolved
decision, or a destructive/irreversible action). Continue automatically inside
approved scope, and run independent lanes in parallel under the delegation
protocol.

## Delegation and parallel work

The parent resolves common context once and gives each delegated agent a
focused manifest containing task/change identity, objective, owned and excluded
paths, decision areas, required and conditional authorities, approved plan/task
references, shared-file ownership, and branch/worktree identity.

The delegated agent validates the manifest, stays within write scope, inspects
the assigned surface and nearest tests, expands context only for a newly
discovered decision, reports that expansion, and stops on ownership/approval
inconsistency. It must not rediscover all knowledge, silently expand scope, or
edit shared contracts, migrations, composition, generated artifacts, or shared
UI primitives owned by another lane.

Before parallelizing, identify shared contracts, migrations, composition,
shared UI primitives, generated artifacts, dependencies, and ownership. Keep
each write set disjoint and one coordinating lane for shared boundaries. Use
agents only when delegation materially improves the task.

Always give every agent and subagent a recognizable name so the user can easily
tell who is doing what. Pick the name using `$onu-agent-name-picker`
(propose → reserve → release); reserve a name when an agent starts and release
it when the agent is done.

The parent/sub-agent lifecycle, event schema, parent acknowledgement, checkpoint
and lost-agent fallback, and tracing capability rules are canonical here:

`$onu-orchestration-agent-improvement` (`references/delegation-protocol.md`)

Every delegated lane must use that protocol and report observable evidence, not
merely "working." The parent assigns a stable `parent_step_id` to every
delegated lane, reconciles each event, updates the user on meaningful state
changes, and continues automatically when `needs_user: false`. Native event,
heartbeat, and OpenTelemetry support are capability-gated; use the protocol's
text/status and bounded-polling fallback when unavailable.

## Verification and evidence

For code changes, run the smallest meaningful tests, broaden only when the
affected boundary requires it, and state exactly what passed, failed, skipped,
or was not run. Never claim success from planned commands.

Keep these states distinct:

```text
local change ≠ local verification ≠ commit ≠ push ≠ hosted PR
             ≠ CI success ≠ review approval ≠ merge ≠ final delivery
```

Update task, issue, and delivery status only from corresponding implementation
or verification evidence. Do not infer CI from local tests, push from a commit,
review from a PR, or merge from CI.

For documentation, prompt, skill, agent, or instruction changes, verify:

- document structure and referenced paths;
- cross-references and authority precedence;
- contradictory or duplicated guidance;
- accidental recursive delegation or broad knowledge loading;
- generated-vs-repository-owned assumptions; and
- the resulting scoped diff.

Do not claim a skill or custom agent is auto-discovered in the current session
unless that behavior was actually observed in a fresh task.

The objective is not maximum context. It is the correct authority, current
evidence, explicit ownership, approved scope, focused context, and observable
verification. Preserve safety and determinism while routing specialized detail
to the authority that owns it.
