# Requirement Decomposition

Understand the requirement in its own domain before — and independently of — any architectural rules, codebase constraints, or solution design.

## No-invention constraint (non-negotiable)

Do not introduce, assume, or invent any concept, entity, behavior, rule, or detail that the requirement does not explicitly state. Every functional capability, acceptance criterion, and scenario must trace back to a concrete statement in the requirement. If a trace is impossible, the item is an assumption and must be removed; if the missing piece is necessary for coherence, record it as a gap to be resolved by interview, not by invention.

## Decompose into capabilities

For each atomic capability (what the system must do, not how), record:

- **Name** — short identifier.
- **Description** — what it does, in domain language, without technical references.
- **Trigger** — what activates it (input, event, condition).
- **Preconditions** — what must be true before execution.
- **Expected result** — what changes after execution.
- **Domain edge cases** — error, boundary, and exceptional situations derived from reasoning about the problem.

## Boundaries and scope

Explicitly declare:

- **In scope** — what the result must deliver.
- **Out of scope** — what is related but not requested; flag ambiguity; write "None identified" if none.
- **Dependencies** — what must already exist for the requirement to be realizable.

## Acceptance criteria

Write deducible acceptance criteria in the form:

> **AC-#**: Given [precondition], when [action], then [observable result].

If the requirement does not provide enough, flag the missing criteria as gaps.

## Scenarios and edge cases

Produce, as applicable:

- **Happy path** — the main flow, without errors.
- **Error** — invalid input, state, or conditions.
- **Empty** — no data, empty lists, non-existent entities.
- **Conflict** — concurrent actions or incompatible states.
- **Degradation** — external dependencies unavailable.

## Ambiguities and gaps

List everything unclear from the requirement alone. For each: describe the ambiguity or gap, explain why it is blocking, and formulate a preliminary question. Every gap survives into the structured interview for the user to resolve — never resolved by invention. If none, write "No ambiguities or gaps identified" with a brief justification.

If the requirement is too vague to yield even one capability, fail the gate and ask the user to reformulate.
