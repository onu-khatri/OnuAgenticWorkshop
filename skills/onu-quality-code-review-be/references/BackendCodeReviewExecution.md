# Review Execution (reasoning-driven)

Use the approved YAML plan for per-PR inputs, scope, capability selection, risk focus, strategy, commands, and overrides; use `references/BackendCoreReviewPolicy.md` as the source of truth for all static governance. The goal is production readiness after approval, so prioritize correctness, security, data safety, release safety, and test confidence over style.

This is a **senior-engineer reasoning procedure**, not a lint checklist. A senior reviewer does not merely search changed lines for known patterns: it understands what behavior changed, what invariants it must preserve, and what assumptions could be false.

## Completeness and categories

Report every distinct issue with no cap on findings, blockers, or advisories; never truncate for size or time. Keep the `summary` concise while findings stay exhaustive, and deduplicate only when two items share the same root cause. The authoritative completeness flags and mandatory finding categories (`performance_issues`, `wrong_coding_practices`, `solid_principle_violations`, `requirement_gaps`, `possible_production_bugs`, `security_and_data_integrity`, `resource_and_configuration_risks`) live in policy `output` — surface every present category without silently dropping an "only advisory" or "only cosmetic" item.

## Reasoning-driven methodology (apply throughout)

For every meaningful changed behavior, work through these questions to *generate* hypotheses, then prove or reject them with repository evidence. Do **not** require a finding merely to satisfy the list:

1. What behavior changed?
2. What invariant is this code expected to preserve?
3. What assumptions does the new implementation make?
4. Which callers, consumers, persisted data, APIs, background jobs, events, caches, or configuration depend on those assumptions?
5. What happens if each assumption is false?
6. What happens on partial failure?
7. What happens under concurrency?
8. What happens with old/existing data?
9. What happens during rolling deployment where old and new versions coexist?
10. What happens when dependencies time out, fail, return malformed data, or return unexpected-but-valid data?
11. What happens at boundary values?
12. What happens if the operation executes twice?
13. What happens if execution stops halfway?
14. What happens under unusually large workloads?
15. What observable evidence would reveal failure in production?

### Hypothesis-driven discovery loop

For each changed behavioral area, run:

- **A — Establish expected behavior.** Use, in priority order: acceptance criteria; user story; contracts/interfaces; existing tests; adjacent implementation; callers; project KB/conventions; documentation; established repository patterns. Do not assume existing code is correct merely because it exists.
- **B — Establish changed behavior.** Determine what behavior the *complete* change set introduces (not a line-added/deleted summary).
- **C — Build invariants.** e.g. uniqueness preserved; authorization before tenant data access; transaction atomicity; nullable relation stays nullable through mapping/persistence; retries don't duplicate side effects; pagination doesn't change ordering; migration works on existing data; old consumers remain compatible; cancellation propagates.
- **D — Generate failure hypotheses.** How can this produce the wrong result / silently succeed incorrectly / corrupt or lose data / leak information / behave differently under concurrency / become slow at scale / break via deployment order or stale callers / leave inconsistent state on exception? What input would make an implicit assumption false? What is the most dangerous reasonable input or state?
- **E — Trace evidence.** Inspect whatever nearby context is necessary: caller, callee, interface, implementation, mapper, DTO, validator, DB model, configuration, migration, event handler, test, registration, consumer. Do **not** limit reasoning to the literal diff, but do **not** turn this into uncontrolled exploration — expansion must be driven by a concrete hypothesis, dependency edge, invariant, or requirement.
- **F — Confirm or reject.** Classify as `CONFIRMED_FINDING`, `ADVISORY`, `OPEN_QUESTION`, or `REJECTED_HYPOTHESIS` (see policy `evidence_classification`).

### Behavioral & dependency tracing

For significant changes, construct lightweight paths such as:

- `API -> validation -> service -> repository -> database`
- `message -> handler -> domain mutation -> persistence -> outbound event`
- `config -> registration -> consumer -> runtime behavior`

Use these paths to find cross-file defects. Pay special attention to: contract/implementation mismatches; validation applied at one entry point but missing from another; domain rules duplicated inconsistently; mappings dropping values; async boundaries; transaction boundaries; tenant/security boundaries; caching invalidation; stale read/write behavior; event publication order; idempotency; retry behavior; serialization compatibility; DI lifetime mismatches; resource ownership/disposal; query materialization behavior; schema/application deployment ordering.

### Adaptive depth

Spend more effort where risk is higher. Indicators: authorization/security changes, migrations, persistence, concurrency, public contracts, shared libraries, infrastructure/config, retries, caching, external integrations, complex state transitions, large query/data paths, many consumers, weak/missing tests. Low-risk mechanical files still need classification, but not the same reasoning budget.

---

## Pass 0: Confirm capability routing & delegation

- Re-read `review_capabilities` from the approved plan. After intake (Pass 1) surfaces risk indicators, re-evaluate: add/remove capabilities if justified, log any change.
- For each selected capability, load its skill via the `skill` tool and apply its methodology. A capability owns its methodology; do not reimplement it here.
- If a capability is `delegate_candidate`, apply the `$onu-quality-code-review` router's Delegation Decision: delegate a bounded sub-area to a sub-agent only if it is well-scoped, independently-analyzable, and independent context improves analysis. Keep inline anything needed for cross-skill synthesis or the final verdict.
- When delegating, require the sub-agent's structured return (see the router's Delegation Return Contract) and validate its `confirmed_findings` against repository evidence before promoting them to authoritative. If delegation tooling is unavailable, run the same methodology inline.

## Review Target And Resolution

The review target, comparison range, and branch resolution are established by the `$onu-quality-code-review` router before execution (see the router's `references/BranchGitResolution.md`). Do not re-resolve the working tree or branch here.

## Pass 1: Intake & behavioral model

Resolve PR metadata, comparison range, changed files, linked work items, and user story context. Begin the behavioral model.

- Fetch each linked work item via the work-item provider resolved in the plan (`inputs.work_item_provider`), using `expand: 'all'` to capture description, acceptance criteria, and related/child items.
- Read the work-item comments (per provider) for clarified or deferred decisions.
- Extract the acceptance-criteria list and feed it into Pass 2 as the comparison basis.
- Use the comparison range already resolved by the `$onu-quality-code-review` router as the review target (working tree, commit pair, or branch delta). Do not re-resolve or narrow scope here.
- Emit one explicit intake note with resolved refs (working tree vs base/head, and why that precedence path was selected) before running diff commands.
- If PR metadata is incomplete or invalid, request clarification or mark risk before making claims.
- Create a high-level change map — not an exhaustive file-by-file summary. For each affected area note only: area name, key changed files, intended behavior, and review risk. Areas: API, domain logic, persistence, migrations, messaging, configuration, tests, infrastructure, shared libraries.
- Build a lightweight dependency map for changed code paths (entrypoint -> service -> persistence/external dependency) and use it to drive focused risk checks (the `risk_focus.primary_behavior_paths` and `context_expansion_targets` from the plan).
- Use session memory and artifacts when relevant to interpret prior decisions, review comments, and known issues. Inspect interfaces, callers, implementations, tests, configuration, or documentation before raising a finding; do not report from an isolated diff when repository context resolves it.
- Derive implementation gaps from the provided work item and restored session artifacts. Treat any acceptance criterion with no corresponding code/test change as an implementation gap.
- Do not invent repository conventions or intended behavior; if intent cannot be reliably established, state the uncertainty.
- Begin establishing **expected vs changed behavior** for each affected area (hypothesis loop Steps A–B) and record initial invariants (Step C).

## Coverage Ledger (mandatory)

1. Produce the authoritative changed-file list from the resolved comparison range (e.g. `git diff --name-status <resolved_base>...<resolved_head>`) plus any working-tree overlay files in scope.
2. Classify EVERY file into exactly one bucket per policy `coverage_ledger` (`REVIEWED` per `what_REVIEWED_means`, `GENERATED`, `EXCLUDED`, `REMAINING`). `REVIEWED` is assigned only to a file whose diff was actually read and reasoned over — never by extension and never as a bulk "rest of this area" assignment.
3. Keep the ledger updated after every Pass. REMAINING must reach zero before Pass 7 finalization. The current list of REMAINING files must always be available on request.
4. The ledger records evidence of reading for each `REVIEWED` file — at minimum the diff plus one traced edge (caller/callee, test, or invariant). If you cannot cite what you read for a file, it is still `REMAINING`.

## Pass 2: Behavior, invariants & hypotheses

Compare implementation against the user story and acceptance criteria, and run the full hypothesis loop.

- Confirm each acceptance criterion is covered or call out gaps; for each uncovered criterion, state whether the gap is a functional defect, a missing test, or missing documentation.
- Check OK/happy-path and KO/negative/failure-path behavior.
- Check edge scenarios: boundary values, nulls, empty collections, duplicates, invalid IDs/formats, concurrency, dependency failures, migration ordering, backward compatibility.
- For each changed behavioral area, run the hypothesis loop (Steps C–F): build invariants, generate failure hypotheses, trace evidence across callers/callees/consumers, and classify each as CONFIRMED_FINDING / ADVISORY / OPEN_QUESTION / REJECTED_HYPOTHESIS.
- Do not limit reasoning to the literal diff; expand only when driven by a concrete hypothesis, dependency edge, invariant, or requirement.

## Pass 2B: Knowledge-Base and convention conformance

Apply the repository Knowledge Base checklists as strong evidence that **supplements** — never replaces — engineering reasoning. Report each triggered gate as passed, failed, or not-applicable with evidence; never restate a generic concern where a concrete KB rule applies. Resolve the checklist files via policy `kb_resolution` (using `$onu-documentation-finder`); a missing required checklist is a review limitation, never a silent skip.

Enforce the checklists resolved for this project (identifiers overridable via plan `overrides.kb`), which typically include:

- Senior Reviewer Checklist — enforce each stage whose trigger matches the changed code: layer/entry-point rules; domain contract/FK rules; setup-access/match-manager rules; migration-safety rules; quality & security rules.
- Integration Test PR Checklist — fixture/sequential/seeding/fresh-context/`Theory`+`MemberData`/success-guard-first gates for integration tests.
- Coding Standard — naming, async, DI, and EF Core patterns (`.AsNoTracking`, projection, eager loading, pagination, `.TagWith`).

Record the triggered gates and their evidence; surface any checklist rule that the changed code violates as an explicit blocker/finding with the KB rule reference. A valid defect with no matching KB rule is still reported per policy `kb_fallback`.

## Pass 3: Production risk

Review changed code plus nearby context for issues that could break production. For each area, apply the reasoning questions and hypothesis loop.

- API contract: DTO compatibility, validation, status codes, error responses, versioning, OpenAPI updates.
- Security: authorization boundaries, tenant/user isolation, secrets, PII, injection risks, unsafe logging.
- Persistence: query filters, transactions, concurrency, constraints, indexes, N+1 queries, deletes.
- Reliability: async/cancellation, retries, timeouts, idempotency, partial failure, message handling, concurrency and race conditions.
- Resource lifecycle: disposal and `using` patterns, unmanaged handles, connection/stream leaks, and leaked scopes.
- Dependencies and breaking changes: new or upgraded package risks, public API/contract signature changes, backward compatibility, and undocumented breaking changes.
- Performance and observability: bounded work, pagination/batching, metrics, traces, alerts, and wise logging. Check that `Information`, `Warning`, and `Error` logs are used at appropriate levels, include correlation/request/user-safe identifiers for audit and tracking, capture critical business/security/state-change events, and never expose secrets, tokens, credentials, PII, sensitive payloads, raw SQL with values, or stack traces to end users.
- Configuration and deployment: apply policy `configuration_review` (appsettings, environment variables, secret store, manifests, feature flags, safe defaults, rolling-deployment compatibility).
- Engineering practices: SOLID principles, clear separation of concerns, small focused methods, readable names, low duplication, no unnecessary abstraction, no magic strings/numbers where constants, enums, options, or typed models are appropriate.
- .NET implementation quality: correct async/await usage, no sync-over-async, propagated `CancellationToken`, efficient LINQ, no accidental multiple enumeration, no client-side query evaluation, no avoidable N+1 queries, and no extra database round trips when one set-based query or transaction can make the decision safely.
- Maintainability: validation and business rules are centralized where appropriate, error handling is intentional, public contracts are documented, and new code follows existing project patterns.

## Pass 3B: Optimization and code-health opportunities

Detect non-blocking opportunities (advisories) that can improve reliability, maintainability, and performance even when they are not release blockers.

- Possible bugs: suspicious edge behavior, hidden nullability risks, inconsistent invariants, or fragile assumptions that need confirmation.
- Bad practices and negative patterns: duplicated logic, long methods, temporal coupling, overuse of static/global state, magic values, leaky abstractions, or unclear ownership boundaries.
- Low-performance patterns: repeated DB round trips in loops, accidental multiple enumeration, avoidable allocations, synchronous blocking, unbounded operations, expensive logging on hot paths, and poor batching/pagination behavior.
- EF Core performance checks (from the resolved Coding Standard / performance checklists; identifiers overridable via plan `overrides.kb`):
  - missing `.AsNoTracking()` on read-only queries;
  - N+1 queries: navigation collections loaded per-item in a loop -> require `.Include(...)`/`.ThenInclude(...)` eager loading;
  - full-entity reads where `.Select(...)` projection suffices;
  - deep `.Skip()` without keyset pagination on large result sets -> prefer a keyset-pagination helper;
  - missing `.TagWith(...)` on hot query paths;
  - `Task.WhenAll` over multiple calls sharing a scoped `DbContext`/unit-of-work (not thread-safe).
- Refactoring opportunities: high-complexity methods, mixed responsibilities, repetitive branching, and unclear naming that increase maintenance and regression risk.
- Code smells and optimization opportunities: dead code, shotgun surgery risk, feature envy, deeply nested conditionals, expensive hot-path abstractions, and repeated work that can be simplified.
- Report each detected opportunity as an advisory per policy `output.advisory` (confidence label + one validation step + evidence/suggestion snippets) and policy `optimization_review` (report all, no target count or cap). Never inflate an advisory into a confirmed finding without direct evidence (policy `evidence_classification`).

## Pass 4: Migrations and schema

Treat database schema compatibility as a release contract. Apply policy `high_impact_schema_changes` (table/column-name changes, added/updated foreign keys are minimum `P1`; escalate to `P0` on data-loss, irreversible failure, outage, or rollback-failure risk) and `migration_data_safety` (existing-data risk, pre/post scripts, rollback plan, verification queries). Identify migration files, raw SQL, schema scripts, ORM mappings, and `Drop` plus `Create` patterns, and reason about release ordering and lock duration through the hypothesis loop.

## Pass 5: Test review (behavioral evidence)

Compare tests against changed behavior, not just changed files — tests are executable behavioral evidence, not coverage numbers.

- For each changed behavior, determine whether tests actually prove it: success, rejection, invalid inputs, boundary cases, failure dependency, concurrency (where relevant), authorization/security boundary, existing-data compatibility, idempotency/retry (where relevant), rollback/partial failure (where relevant). When a test exists, evaluate whether its assertions prove the behavior; invocation-only tests are not meaningful evidence.
- Apply policy `test_review` for what to inspect (missed unit/integration tests, KO/negative paths, branch-coverage gaps, missing `[ExcludeFromCodeCoverage]`/`[ExcludeTestCoverage]`, integration-test assertion presence) and thresholds (≥80% line coverage per changed service/handler class; reject endpoint-invocation-only tests; never recommend exclusion for business behavior).
- Apply policy `single_pass_test_and_coverage` and `execution_efficiency` for how to run: build targeted filters from changed files/classes/test names, resolve canonical commands from the project's command checklist (identifiers overridable via plan `overrides.kb`), run one focused `dotnet test --filter` with coverage collection, derive pass/fail + per-class coverage from the same output, and request approval before a second run or an unfiltered related-project fallback on filter mismatch.

## Pass 6: Documentation and release notes

Apply policy `documentation_review` (docs for new public APIs/breaking changes/architectural decisions, or a linked documentation task) and `changelog_review` (entries for user-facing and breaking changes with consumer-impact description). Verify the artifacts exist in the change set; emit explicit findings when a gate is unmet.

## Pass 7: Adversarial second sweep, synthesis & output

### Adversarial second sweep (mandatory)

After all files reach REVIEWED/GENERATED/EXCLUDED and before final output, perform the second-look sweep per policy `second_look` (production failure, data, consumer, concurrency, operations, scale, security, maintenance). Use it to discover cross-file and emergent issues missed in the first pass.

### Cross-skill synthesis

Reconcile everything discovered by you and any sub-agent/skill per policy `cross_skill_deduplication` and the `$onu-quality-code-review` router's Cross-Skill Synthesis & Final Outcome: merge same-root-cause findings (strongest evidence, preserve specialist consequences, all rule references), resolve severity/confidence conflicts, validate delegated findings against repository evidence, and assert scope correctness, acceptance-criteria reconciliation, and coverage completeness. The router owns the final verdict.

### Verification

Run approved verification commands where feasible and record `passed`, `failed`, or `skipped` with reasons. Do NOT begin the final report while the coverage ledger contains any REMAINING files. Emit the ledger in `summary.files_reviewed`, `files_excluded`, and `files_remaining` (must equal 0). A non-zero `files_remaining` is a hard-stop; continue reviewing rather than finalizing.

### Output

Output the sections requested by the approved plan. All formatting, completeness, blocker, snippet, report-file, and finding/advisory field requirements are governed by policy `output` (`required_sections`, `completeness`, `blockers`, `report_file`, `summary_fields`, `finding_fields`, `advisory`, `snippet_requirements`). Derive severity/verdict from policy `severity_scale`.

Execution-specific notes:

- Do not rubber-stamp: if there are no findings, state that and list residual risks or test gaps.
- Mark uncertain items as OPEN_QUESTION/ADVISORY rather than confirmed findings or silence.
- If the user story and PR disagree, call it out explicitly.
- Do not leave optimization analysis implicit: if none are found, state explicitly that no meaningful optimization or code-health opportunities were identified.
- For very large change sets, generated `*.auto.cs` files are excluded from detailed review and listed in the summary; ignore `*.auto.cs` by default unless it appears in the changed files or PR description (then treat it as a normal changed file).
