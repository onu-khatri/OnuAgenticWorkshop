# Code Reconnaissance

Every codebase fact must rest on a `file:line` you personally saw and logged. Guessing or relying on memory is forbidden.

## Seed → question → hits → open

Start from the filenames and symbols identified during decomposition. For each seed symbol, ask a precise question ("Where is X defined?") and use search to answer only that question. Log the trail:

```text
SEED → QUESTION → HITS → OPENED file:line
```

Open only the files returned by that search, and only the lines around the match. Every opened file must serve one of five purposes:

- owning code path;
- owning component;
- primary insertion point;
- nearest reusable implementation (to be validated, not copied);
- explicit blocker.

If an opened file serves none of these, close it immediately.

## Stop conditions

Stop exploration the instant you have:

1. the owning component with verifiable `file:line` evidence;
2. at least one insertion point (`file:line` + rationale) or one explicit blocker (`file:line` + description);
3. an implementation direction you can map to every applicable rule.

## Verify compliance before acting

For each implementation decision, produce a verification row:

```text
RULE | file:line | snippet (first ~80 chars) | VERDICT
```

If non-compliant, state the alternative. Missing evidence → mark BLOCKED. Any existing pattern that violates a rule is rejected, no matter how similar.

## Placement check

For every planned component, list its actions (mutation, I/O, validation, decision) and map each action to the rule that dictates its home. If any action sits where a rule forbids it, move it to the mandated component, creating that component if needed.

Absolute rules: no `file:line` without a logged search; no user interview until reconnaissance is closed; the log is the only proof — if it is not logged, it did not happen.
