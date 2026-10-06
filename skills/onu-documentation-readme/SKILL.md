---
name: onu-documentation-readme
description: Create or update README files for the target project or its modules with deep codebase exploration, accurate commands, and thorough structure. Use when writing a project, module, or feature README.
---

# README Generator

Use this skill to produce high-quality README files grounded in the actual codebase, not boilerplate.

## Use this skill when

- creating or updating a README for the project or a module
- documenting how to set up, build, test, or deploy
- onboarding a new developer or agent

## Workflow

1. Explore the target area first: directory structure, configuration, entry points, dependencies, scripts.
2. Capture the real commands and paths; never guess.
3. Follow the structure below, omitting sections that do not apply.

## README structure

- **Title and overview** — what it does, who it is for.
- **Tech stack** — language, framework, key dependencies.
- **Prerequisites** — tools and versions required.
- **Getting started** — clone, install, configure, and run commands.
- **Architecture** — project layout, request flow, key components.
- **Environment** — required and optional environment variables.
- **Available scripts** — build, test, lint commands.
- **Testing** — how to run tests and what test projects exist.
- **Deployment** — if applicable.
- **Troubleshooting** — common issues and fixes.

## Target project specifics

- Backend: .NET — `dotnet build` the solution, `dotnet test` the unit-test project, and `dotnet run` the host project (resolve exact project paths from the repository).
- Frontend: `npm run check`, `npm run build`, `npm run dev`.
- Migrations: run the migration project's `--help` command (resolve the exact project path from the repository).
- Describe module layering by role (API, contracts, service, persistence, domain) using the repository's own module names.

## Quality bar

- Every command is copy-pasteable and every path is verified.
- Add a table of contents for READMEs over ~200 lines.
- Prefer tables for reference data (scripts, environment variables, endpoints).
- Keep the tone informative and specific.


