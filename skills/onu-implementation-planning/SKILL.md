---
name: onu-implementation-planning
description: Plan a technical or code change before implementation, using project knowledge and authoritative rules over existing code patterns, producing an implementation-ready plan with file-level detail, coverage scenarios, and validation. Composes $onu-workflow-planning for the generic planning discipline.
---

# Implementation Planning

Use this skill to plan a technical or code change — a feature, fix, refactor, migration, or architecture change — before any production edit. It composes `$onu-workflow-planning` for the generic planning discipline and adds the code-specific methodology: knowledge-first over existing code, code reconnaissance with `file:line` evidence, per-file design decisions, and coverage scenarios.

## Use this skill when

- the work changes production code, tests, configuration, schema, or migrations;
- existing code patterns must be evaluated against project rules before reuse; or
- the plan must be detailed enough for an implementer to execute without re-deriving design decisions.

## Do not use this skill when

- the work is non-technical (product, business, content, operations, research) — use `$onu-workflow-planning` directly; or
- the change is a single obvious edit with no meaningful design decisions.

## Compose the generic skill

Follow `$onu-workflow-planning` for the operating contract, gate execution model, requirement decomposition, plan structure, authority-first, drafting discipline, and approval handoff. The sections below add the code-specific constraints on top of that foundation.

## Knowledge-first over existing code

Project knowledge and authorities are the only source of truth; existing code may be legacy or predate a rule, so it is validated rather than assumed correct. Read [knowledge-authority.md](references/knowledge-authority.md).

- Extract every normative rule from the applicable authorities (`AGENTS.md`, requirements/stories, ADRs, `KnowledgeBase/` topics) into a numbered inventory.
- When existing code contradicts a rule, the rule wins.
- Design each file from the rules, not from the nearest similar existing file; anchoring to existing code is the #1 planning failure mode.

## Code reconnaissance

Every code fact must rest on a `file:line` you personally read and logged. Read [code-reconnaissance.md](references/code-reconnaissance.md).

- Log the path: seed symbol → question → search hits → opened `file:line`.
- Open only files that serve a review purpose; close anything that does not.
- Stop when you have the owning component, an insertion point or explicit blocker, and a rule-mapped implementation direction.

## Per-file design decisions

For each planned file, run the design-decision checklist in [knowledge-authority.md](references/knowledge-authority.md): which rules govern it, whether any reused pattern violates a rule, what the file may or may not do, and whether any action belongs elsewhere.

## Coverage scenarios

For every file with executable behavior, enumerate coverage scenarios derived from the exact logic. Read [coverage-scenarios.md](references/coverage-scenarios.md).

## Structured interview

Route material code decisions that the repository and rules cannot resolve to `$onu-workflow-user-interview`, one focused question at a time.

## Handoff

The completed plan is an implementation contract. Hand off the plan path and covered task identities to the implementation owner; never start implementation from this skill.
