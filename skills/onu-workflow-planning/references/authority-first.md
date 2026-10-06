# Authority-First

Design from authority, not from what already exists.

## Authority order wins

The project's authority order (see its `AGENTS.md`) takes precedence over whatever existing work happens to do. Typical order: explicit user request and approved scope → repository-wide invariants → the selected skill and its references → approved plans, requirements, stories, and decisions → current code, tests, and hosted evidence.

When in doubt between "the authority says X" and "existing work does Y", choose X. No exceptions.

## Authority before pattern

For every design decision — where to place logic, which component to extend, which pattern to follow — the first question is always "what does the authority say?", never "what does existing work do?". Existing artifacts are consulted only after the authoritative direction is clear, and only to learn concrete names, signatures, and wiring details — never to decide structure, placement, or responsibility.

## Anchoring is the #1 failure mode

Your default instinct is to find the nearest similar existing work and anchor the plan to it. That instinct is wrong when existing work is legacy, non-compliant, or predates the authority. When you catch yourself thinking "X does this, so I'll follow it", stop and self-correct:

1. Discard the code-first reasoning; do not salvage it as a starting point.
2. Reopen the authority and find every rule governing the decision.
3. Design from the rules; consult existing work only for concrete names afterward.
4. If the rule-driven design ends up identical to existing work, re-verify each rule — coincidence is suspicious.

## Pattern-mimicry is forbidden

Finding a similar implementation does not justify replicating its structure. Independently verify that a found pattern complies with every applicable rule before using it as a reference. When two patterns exist (one compliant, one legacy), the compliant one wins. When only a non-compliant pattern exists, design the compliant alternative from the rules, not the code.

## Design-decision checklist

Run this for each planned item before producing the result:

1. Which rules govern this item? (List rule numbers.)
2. Is any existing pattern used as a reference? If so, was it validated against all applicable rules? Reject it if it violates any.
3. Do the rules constrain what this item may do or depend on? List those constraints and verify compliance.
4. Does this item perform any action (mutation, I/O, validation, decision) that a rule says belongs elsewhere? If so, move it — and add the capability to the mandated location if it is missing there.

## Compliance over availability

When a rule assigns a responsibility to a specific component, place it there — even if that component does not yet expose the needed capability. "It already has the dependencies" or "a similar file does it this way" is not a reason to place logic elsewhere.
