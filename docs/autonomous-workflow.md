# Autonomous development workflow

This repository ships a complete autonomous workflow: a set of skills (how), a set of agents (who), and a project instruction file (`AGENTS.md`) that routes between them. This document explains how a user-defined agent drives that workflow end-to-end for code and review.

## The three layers

| Layer | Examples | Purpose |
| --- | --- | --- |
| **Skills** (`$onu-*`) | `$onu-workflow-development-entry`, `$onu-backend-feature-development`, `$onu-frontend-development`, `$onu-quality-code-review` | Reusable procedures and methodology |
| **Agents** (`onu-*`) | `onu-autonomous-developer`, `onu-backend-implementer`, `onu-frontend-implementer`, `onu-code-reviewer`, `onu-security-auditor` | Focused delegated workers |
| **Instruction file** | `agents/AGENTS.md` (installed/connected to the vendor's `AGENTS.md`) | Routing brain: authority order + skill/agent table |

A skill tells an agent *how* to do something; an agent is the *who* that owns a bounded slice of work. The instruction file decides *which* to invoke for a given trigger.

## The autonomous loop

For one development request, the driver runs:

```
work → entry → plan → implement → review
     → (blocking findings → replan → implement → review)
     → work-done → user approval → deliver
```

```
1. Entry      → $onu-workflow-development-entry  (classify shape, PASS/BLOCKED + route)
2. Plan       → onu-implementation-planner  (approved implementation plan)
3. Implement  → onu-backend-implementer / onu-frontend-implementer
                (following $onu-backend-feature-development / $onu-frontend-development)
4. Review     → onu-code-reviewer + onu-security-auditor  ($onu-quality-code-review = methodology)
5. Replan     → on blocking/important findings, back to onu-implementation-planner,
                then re-implement and re-review until clean
6. Work-done  → stop and ask the user for approval
7. Deliver    → $onu-git-commit → $onu-delivery-pull-request
```

The driver continues automatically inside approved scope and only interrupts on a real gate: a `BLOCKED` from the entry gate, a material unresolved decision, a missing credential, a destructive/irreversible action, or the work-done approval gate. It does **not** require a user story, GitHub issue, or OpenSpec change for a plain-language request.

## Define your own driver agent

The shipped `onu-autonomous-developer` agent is a ready-made driver. To define your own, create a custom agent (in your vendor's native format — `.claude/agents/*.md`, `.codex/agents/*.toml`, `.github/agents/*.agent.md`, or `.opencode/agent/*.md`) with these instructions in its body:

1. Read `AGENTS.md` first.
2. Run `$onu-workflow-development-entry` for any development-related request; follow its PASS/BLOCKED route.
3. Plan by delegating `onu-implementation-planner`; do not implement against an unapproved or missing plan.
4. Implement using the routed skills, or delegate a bounded lane to `onu-backend-implementer` / `onu-frontend-implementer`.
5. Review by delegating `onu-code-reviewer` and `onu-security-auditor` (using `$onu-quality-code-review`), and route blocking findings back to the planner to revise and re-implement until clean.
6. On a clean review, stop and ask the user for approval before delivery.
7. Deliver with `$onu-git-commit` then `$onu-delivery-pull-request`.
8. When delegating, follow the protocol in `$onu-orchestration-agent-improvement` (`references/delegation-protocol.md`): assign a `parent_step_id`, reconcile events, and require observable evidence.

> **Prefer your own agents**: the installed `onu-*` agents are defaults. To use your own planner, implementation, or review agents instead, name them in your project `AGENTS.md` under "Skill and agent routing" — your explicit routing there takes priority over the installed agent catalog.

## Installing and connecting

1. Install skills and agents with the installer (`npx <your-installer-package>`; pass `--agents` to include agents).
2. Let `registerAgentsInInstructions` (default `true`) append the auto-generated agent catalog to your vendor's instruction file, or keep your own `AGENTS.md` in sync with `agents/AGENTS.md`.

The installer prints a reminder after registering agents: to prefer your own planner, implementation, or review agents, name them in your project `AGENTS.md`. Your `AGENTS.md` takes priority; the injected catalog is additive and never overrides your own content.

## Extending the workflow

- **Add a skill** under `skills/onu-*/SKILL.md`; route to it from `AGENTS.md`.
- **Add an agent** under `agents/onu-*/AGENT.md`; it is discovered and installed automatically.
- **Add a vendor** in `agent-formats.json` + `bin/installers/constants.js`; `npm run validate` cross-checks they stay in sync.

See `docs/agent-formats.md` for the agent schema and vendor mapping, and `docs/shared-skill-practices.md` for cross-client conventions.
