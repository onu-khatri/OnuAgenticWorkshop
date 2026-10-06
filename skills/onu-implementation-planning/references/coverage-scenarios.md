# Coverage Scenarios

For every planned file that contains executable business logic, enumerate coverage scenarios derived from the exact logic in that same file detail — not from a generic template.

## What to enumerate

Cover every materially distinct branch the logic introduces, including when applicable:

- happy path;
- null / guard clauses;
- authorization or validation failures;
- not-found or state-conflict branches;
- optional enabled/disabled flows;
- no-op or idempotent branches;
- result-mapping or persistence outcomes.

A single happy path is insufficient whenever the logic also contains guards, throws, early returns, optional paths, no-op or idempotent behavior, or state-dependent branches.

## When "None" is allowed

`Coverage Scenarios: None` is allowed only for files with no executable business logic — pure contracts, DTOs, assembly markers, project files, or passive configuration with no functional branches.

## Where coverage lives

Represent unit-test planning only through the coverage scenarios in each file detail. Do not add unit-test files or operations to the plan unless the user explicitly asks for a broader test-delivery plan.

## Unit-test-only planning

When the request is specifically to plan unit tests for existing production code and the plan introduces no production-code edit for that file, mark the production file as unmodified, show the existing code under test as read-only context, and include no executable step for that file.
