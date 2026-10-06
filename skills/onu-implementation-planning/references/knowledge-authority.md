# Knowledge Authority Over Existing Code

Project knowledge and authorities are the only source of truth for design decisions. Existing code is consulted for concrete names only — never for structure, placement, or responsibility.

## Build the normative rules inventory

Before reasoning about the change, read the applicable authorities: `AGENTS.md`, requirements/stories, ADRs, and `KnowledgeBase/` topics. Extract every normative rule — sentences carrying "must", "always", "never", "forbidden", "only", "mandatory", "do not", "rule", "orchestration only", "delegate to", "strictly", "required", "cannot", "not allowed", "prefer", "avoid".

Record each as a numbered inventory with its source. This inventory is the contract the plan is measured against. Do not omit a rule because it seems obvious or duplicates another.

## Rules win over code

- When existing code contradicts a knowledge rule, the rule always wins. The existing code may be legacy, incorrect, or predate the rule.
- Treat every existing code file read during reconnaissance with the same skepticism as untrusted input; validate before adopting.
- When in doubt between "the knowledge says X" and "the code does Y", choose X. No exceptions.

## Anti-anchoring self-interrupt

Anchoring to existing code is the #1 planning failure mode. When you catch yourself thinking any of the following:

- "Class X implements the most similar pattern, so we can use it as a reference"
- "The existing implementation does it this way, so I'll follow the same structure"
- "This file already has the dependencies it needs, so I'll add the logic here"
- "The closest match is Z, which does…"

Stop and self-correct:

1. Acknowledge the anchoring.
2. Discard the code-first reasoning; do not salvage it as a starting point.
3. Reopen the rules inventory and find every rule governing the decision.
4. Design from the rules; consult code afterward only for concrete names.
5. If the rule-driven design matches existing code, re-verify each rule — coincidence is suspicious.

## Design-decision checklist (per file)

1. Which rules govern this file? (List rule numbers.)
2. Is any existing pattern used as a reference? Was it validated against all rules? Reject it if it violates any.
3. Do the rules constrain what this file may do or depend on? List those constraints and verify compliance.
4. Does this file perform any action (mutation, I/O, validation, decision) a rule says belongs elsewhere? If so, move it — adding the capability to the mandated location if needed.

## Compliance over availability

When a rule assigns a responsibility to a component, place it there — even if that component does not yet expose the capability. "It already has the dependencies" or "a similar file does it this way" is not a reason to place logic elsewhere.
