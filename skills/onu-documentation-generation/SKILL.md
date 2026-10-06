---
name: onu-documentation-generation
description: "Generate accurate, project-grounded documentation for the target project: code explainers, API references, module guides, ADRs, and onboarding notes. Use when creating or updating docs from repository evidence."
---

# Documentation Generator

Use this skill to produce documentation that reflects the real codebase, not generic templates. It pairs with `onu-knowledge-project-builder` for reusable knowledge and `onu-architecture-adr` for decisions.

## Use this skill when

- generating or updating docs for a module, endpoint, or feature
- writing an API reference or onboarding guide
- documenting a workflow or migration step for other developers

## Do not use this skill when

- the deliverable is durable knowledge for agents (use `onu-knowledge-project-builder`)
- the deliverable is a formal decision record (use `onu-architecture-adr`)

## Workflow

1. Confirm the audience (onboarding, implementation, review, or release notes).
2. Gather evidence from `README.md`, `Business-Requirements/`, `User-Stories/`, `application/`, and `test/`.
3. Describe symbols, responsibilities, and flows using the repository's own terms.
4. Include concrete, copy-pasteable commands and file references.
5. Separate observed facts from inference; flag anything incomplete.

## Target project content map

- Module responsibilities by layer: API (HTTP/validation), contracts, service (handlers/mapping), persistence (EF/repositories), and domain (entities).
- API surface: Minimal API groups under `/api/...` and their command/query endpoints.
- The persistence project: the shared DbContext, unit of work, repository base, seeding, migrations (resolve the exact project name from the repository).
- Verification commands: `dotnet build` the solution, `dotnet test` the test project, `npm run check` (resolve exact paths from the repository).

## Quality bar

- Every command is copy-pasteable and every path is real.
- Claims are backed by repository evidence.
- Structure is scannable (headings, tables, code blocks with language hints).
- Docs stay specific to the target project rather than generic .NET/React advice.

## Definition of Done

- The doc is grounded in the current codebase.
- Internal cross-references and file paths are valid.
- A new reader could follow it without additional context.

