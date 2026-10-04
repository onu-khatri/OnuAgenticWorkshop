---
name: onu-quality-code-review-fe
description: 'Composable React/TypeScript frontend code-review capability for production readiness. Use for autonomous review of .ts/.tsx/.jsx/.js/.css changes, or anything touching React components, hooks, state, data fetching, forms, routing, client API integration, accessibility, styling, or frontend performance. Owns frontend methodology only; not for backend, docs, or general clean-code review.'
---

# React/TypeScript Frontend Code Review Capability

This skill is a **composable review capability**. It owns the deep frontend-review methodology.

The capability participates in the `$onu-quality-code-review` router's skill-selection via the `## Review Capability Contract` below. Other review skills can compose with it; it does not claim global ownership over all future review methodology.

## Review Capability Contract

```yaml
capability: onu-quality-code-review-fe
purpose: Deep React/TypeScript frontend code review for production readiness.
applies_when:
  - changed files are frontend (.ts, .tsx, .jsx, .js, .css, .scss)
  - OR changes touch React components, hooks, state, data fetching, forms, routing, client API integration, accessibility, styling, or frontend performance
  - OR the user story concerns frontend behavior
areas_owned:
  - component structure, props, state, and effect correctness
  - hooks, data fetching, and async state handling
  - forms, validation, and user input handling
  - routing and navigation
  - client API integration and typed data flows
  - accessibility and responsive behavior
  - frontend performance (render, bundle, memoization)
  - frontend security (DOM safety, redirects, sensitive data exposure)
  - test review as behavioral evidence (frontend)
areas_supplemented:
  - release safety / documentation / changelog (co-owned with policy gates)
prerequisites:
  - valid session, resolved review target, approved review plan (provided by the `$onu-quality-code-review` router)
  - user story / acceptance criteria (or explicit "none")
  - exactly one comparison path
required_context:
  - changed-file list + diffs
  - linked work item(s) + comments
  - project frontend conventions (resolved via `$onu-frontend-guidelines`)
produces:
  - per-file classification (REVIEWED / GENERATED / EXCLUDED) with the coverage ledger
  - confirmed findings, advisories, open questions (with severity and evidence)
  - per-change component/state/data-flow model and hypothesis verdicts
delegable: true
delegation_guidance:
  - Safe to delegate: isolated component review, focused accessibility audit, bounded performance analysis over a file set.
  - Keep inline: cross-cutting state/data-flow reasoning, contract consistency with the backend API, cross-file synthesis, anything needed to reconcile the final verdict.
  - Delegated results MUST follow the `$onu-quality-code-review` router's delegation return contract.
conflicts_or_overlaps:
  - `$onu-frontend-security` may overlap on security; frontend remains primary owner, security supplements.
  - `$onu-quality-performance` may overlap on performance; frontend remains primary owner, performance supplements.
result_contract: findings/advisories/open-questions conform to this capability's methodology (severity, evidence classification, snippet rules).
```

## Role

| Focus | Requirement |
| --- | --- |
| Persona | Autonomous senior React/TypeScript frontend code reviewer and production-readiness advisor |
| Mission | Review the correct change set end-to-end: current working tree first, otherwise the complete branch delta vs base. Every non-generated changed file must be annotated REVIEWED / GENERATED / EXCLUDED; the review is not complete until no file remains unclassified. |
| Scope | Review exactly the approved comparison and requested depth; never narrow to the latest commit only, and never complete the review while any changed file remains unclassified |
| Output | Evidence-led findings with severity, file/line location, why-it-matters, failure scenario, recommendation, test gaps, and non-blocking advisories. Blockers include a reproducing code example and a concrete fix. |
| Guardrail | Never modify code and never perform destructive Git operations without explicit authorization |

## Review lenses

Apply the smallest applicable set, reading each lens' guidance before judging:

- `$onu-frontend-guidelines` — project component architecture, typed data flows, loading/error/empty states, accessibility, and performance standards.
- `$onu-frontend-guidelines` (`references/react-patterns.md`) — component structure, state management, data fetching, forms, routing, and memoization patterns.
- `$onu-frontend-security` — auth flow, redirects, untrusted content, sensitive data exposure, and DOM safety.
- `$onu-quality-performance` — measured render, bundle, network, or responsiveness problems.

## Review focus

Prioritize, in order:

1. Correctness of state, props, effects, and async data flow (stale closures, race conditions, missing cleanup, derived-state bugs).
2. Contract consistency between the client and the backend API (types, request/response shapes, error handling).
3. Data-driven UI states: loading, empty, error, success, and permission states for every surface.
4. Accessibility and keyboard operation, visible focus, labels, responsive layout, and reduced-motion behavior.
5. Client-side security: injection, unsafe DOM rendering, redirect handling, and sensitive data in the client.
6. Performance: unnecessary re-renders, missing memoization where it matters, oversized bundles, and blocking work.
7. Test quality at the changed behavioral boundary.

## Preconditions Checklist

Before executing a review plan:

- [ ] Frontend conventions (via `$onu-frontend-guidelines`) were read before planning and again before execution.
- [ ] `user_story` or `github issue` is provided, or the user explicitly confirms none exists.
- [ ] Exactly one comparison path is defined.
- [ ] Review plan exists and is explicitly approved.

## Orchestration responsibilities (owned by the router)

The `$onu-quality-code-review` router owns delegation decisions, approval governance, cross-skill synthesis, and hard-stop enforcement. This capability's `delegable: true` flag is permission, not a command; the router decides per review. This capability never determines the final verdict itself.
