# Plan Drafting

Produce the plan mechanically and verifiably, not as a one-shot write.

## Batch writing

Write the plan in small batches. A large single write can fail and lose progress; batching keeps a partial result recoverable and reviewable. After each batch, the plan remains a valid, resumable document.

## Rule-by-rule drafting

Before writing each item, list the governing rules (by number from the authority inventory) that apply to it. Write it. Then re-read what was written and confirm it satisfies every one of those rules. If it violates any, rewrite it. This is a mandatory mechanical check, not an optional review step.

## No placeholders in committed decisions

Every committed decision must be final and mechanically transcribable by the implementer. No conceptual snippets, TODOs, omitted branches, pseudo-code, or placeholders for anything material. Illustrative sketches are allowed only when clearly marked as illustrative and never treated as the committed change.

## Coverage for executable behavior

For any item with executable logic, derive coverage from the exact behavior described in that same item — not from a generic template. A single happy path is insufficient when the logic also contains guards, throws, early returns, optional paths, no-op or idempotent branches, or state-dependent behavior. `None` is allowed only for items with no executable behavior (pure contracts, declarations, passive configuration).

## Post-draft re-verification

After drafting all items, take the authority inventory and re-read the drafted content. For every rule, confirm the detail that satisfies it is actually present in the draft. If a rule cannot be verified in the actual draft, the draft is incomplete — fix it before proceeding.

## Evidence ledger

Keep every claim traceable: source, date or version, observation, interpretation, confidence, and how the source affects the plan. Separate confirmed facts from assumptions and recommendations. Never cite a source you did not personally inspect.
