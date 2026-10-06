# Gate Execution Model

A plan is produced by a linear sequence of gates, not by free-form iteration. Gates give the plan a deterministic, resumable, reviewable shape.

## Core rules

- **Gates are the only valid path.** You have zero discretion to skip, reorder, merge, or partially execute a gate.
- **Strict linear order.** If there are N gates, run 1 → N in order. Gate failures are logged and the user is told the failure and next steps.
- **Explicit stop points only.** You may wait for the user only at a declared stop point (for example: an ambiguous scope, a required decision, or the final approval gate). Every other gate auto-advances.
- **A gate end is not a stop.** At the end of a non-stop gate, in the same turn, state the next gate's entrance (number + title) and begin its first action. A turn that ends with only text and no next action is a fault — unless you are at a declared stop point.

## What each gate must leave behind

Every gate produces an observable artifact or state that the next gate consumes:

- **Scope** — the exact work identity, outcome, owner, and boundary (or an explicit blocker).
- **Current state** — the evidence, constraints, and gaps collected so far.
- **Decomposition** — capabilities, boundaries, acceptance criteria, and scenarios.
- **Authority** — the normative rules and decisions that govern the work, extracted into an inventory.
- **Decisions** — each unresolved item classified (confirmed / inferred / assumption / gap / user decision / blocker).
- **Draft** — the plan, written in batches and verified rule-by-rule.
- **Self-review** — an independent pass with recorded findings and corrections.
- **Approval** — explicit user approval (or the exact blocking decision).

## Stop-point discipline

- A stop point is the only place you wait for the user.
- Before stopping, state the exact decision, the evidence checked, why it is material, and the smallest required question.
- Never treat a progress marker (a "COMPLETE" header, a filled checklist) as a stop condition. It is a signal to advance, not to halt.
- Any stop outside a declared stop point is a fault and must be recovered by resuming the next gate.
