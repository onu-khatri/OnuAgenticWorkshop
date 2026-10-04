---
name: onu-frontend-design
description: Design polished, intentional interfaces for the target project that fit the product domain, existing implementation patterns, and accessibility expectations. Use when Codex needs to shape layout, hierarchy, copy, and interaction design before or during frontend implementation.
---

# Frontend Design

Use this skill to shape product-quality experiences with a clear point of view instead of interchangeable component grids. Keep the result distinctive, implementable, and aligned with the existing client.

For a multi-skill task, follow [frontend workflow routing](../onu-frontend-guidelines/references/frontend-workflow-routing.md). Return an implementation handoff to the primary owner; do not implement, delegate, or reselect frontend skills from this design pass.

## Use this skill when

- the task is primarily about layout, hierarchy, motion, copy, or interaction quality
- a page or flow needs a deliberate visual direction before implementation
- you need design guidance that still respects the current React client
- reviewing, critiquing, or polishing an existing UI before shipping (see Review mode below)

## Do not use this skill when

- the work is purely backend or data-layer oriented
- implementation mechanics matter more than design direction
- the task is a production-readiness code review; use `$onu-quality-code-review` (which routes to `$onu-quality-code-review-fe`)

## Knowledge routing

1. Read the knowledge-base index (via $onu-documentation-finder).
2. Read only the linked project knowledge that materially affects the surface you are designing.
3. Read `references/design-playbook.md` for the deeper design method and anti-generic guardrails.

## Design workflow

1. Clarify the user goal, primary audience, emotional tone, and business outcome.
2. Choose one explicit aesthetic direction and one differentiation anchor before styling details.
3. Work from information hierarchy and task flow before decoration.
4. Define non-default states, responsive behavior, and accessibility constraints intentionally.
5. Hand off decisions in a form that the frontend implementation skills can build without guesswork.

## Non-negotiables

- avoid generic "AI UI" patterns, default dashboard grids, and safe-but-forgettable styling
- choose a named visual direction instead of mixing unrelated aesthetics
- use typography, color, spacing, and motion to reinforce the design thesis
- preserve implementation realism, semantic structure, performance, and accessibility
- match the ambition of the visual direction with code complexity the current stack can support

## Design lenses

- hierarchy and readability
- strong visual identity
- purposeful motion
- empty, loading, and error states
- mobile behavior and accessibility
- implementation fit with existing shared UI and route structure

## Target project focus

- professional but distinctive product surfaces
- the product's core workflows and credibility cues
- alignment with existing shared UI and route structure

## Output requirements

- design direction summary with the named aesthetic and differentiation anchor
- content hierarchy and task-flow decisions
- state and interaction notes, including empty, loading, error, hover, focus, and mobile behavior where relevant
- design-system signals such as type, color, spacing, and motion guidance when they matter
- implementation constraints or handoff notes that keep the design buildable in the current frontend stack

## Review mode

For a critique or pre-ship check of an existing surface, deliver a senior-level craft critique instead of a generic checklist. For a rigorous, evidence-backed interface review use [better-interface.md](references/better-interface.md); otherwise apply this focused rubric.

Evaluate against: visual hierarchy and layout; typography (limited scale, measure, pairing); spacing and rhythm; color and contrast (WCAG AA: body 4.5:1, large text/UI 3:1, never color alone); motion (fast, purposeful, `prefers-reduced-motion`); component states (hover, focus-visible, active, disabled, loading/empty/error); accessibility (semantics, headings, landmarks, alt, labels, keyboard, focus order); responsiveness (breakpoints, overflow, mobile→desktop); content and copy; and consistency with the product's visual language.

Rank findings by severity: `Blocking` (inaccessible/broken/WCAG-failing), `Important` (harms hierarchy/readability/usability/consistency), `Polish` (craft refinement). For each finding give `What`, `Why`, and a concrete `Fix` with explicit values where possible. Then list two-to-four `Strengths` and one `Highest-leverage change`.

When asked to apply fixes, change only clear, safe items directly (contrast, spacing, focus-visible, reduced-motion, semantics, alt text); leave subjective restructure or brand changes as recommendations unless confirmed. Be direct, respectful, and specific.
