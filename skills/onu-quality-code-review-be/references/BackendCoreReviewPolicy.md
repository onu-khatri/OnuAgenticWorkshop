# Shared Review Policy (static)

Single source of truth for review gates that **do not vary per-PR**.

- **Global governance** (Section "global_governance") applies to every review capability.
- **Backend defaults** (Section "backend_defaults") are backend-review-specific rules.

The review plan (`templates/AgentCodeReviewBE-plan.template.yaml`) carries only per-PR inputs, scope, capability selection, risk focus, strategy, verification commands, and explicit overrides. The execution prompt applies this policy across the review phases.

---

## global_governance

### evidence_classification

Every observed issue must be classified into exactly one of the following. Only `confirmed_finding` affects the formal verdict.

| class | bar to reach | required fields |
|---|---|---|
| `CONFIRMED_FINDING` | Enough repository/command evidence to establish a concrete defect/risk in the reviewed change. | severity, exact location (file:line), evidence, affected behavior/invariant, failure scenario, production impact, recommended change, relevant test, KB rule when applicable. |
| `ADVISORY` | Non-blocking, evidence-supported improvement with a reasonable validation path. | confidence (high/medium/low), evidence, reason, one validation step, suggestion. |
| `OPEN_QUESTION` | Credible risk but repository evidence insufficient to confirm. | hypothesis, evidence already observed, missing evidence, exact validation step. |
| `REJECTED_HYPOTHESIS` | Internal only; need not clutter the final report. Retain internally when useful to prevent duplicated investigation. | — |

Rules:
- Do **not** inflate speculation into `confirmed_finding`.
- Do **not** suppress a possible issue merely because it is not yet provable from the diff — record it as `OPEN_QUESTION` or `ADVISORY`.
- `ADVISORY` and `OPEN_QUESTION` never block the verdict; they are reported, not ignored.

### hypothesis_handling

- Every meaningful changed behavior is examined through a hypothesis loop (see execution prompt). A hypothesis is either confirmed (`CONFIRMED_FINDING`), recorded as `ADVISORY`, left as `OPEN_QUESTION`, or `REJECTED_HYPOTHESIS`.
- Rejected hypotheses are not dropped into the final report but may be kept internally to avoid re-investigation.
- A novel defect is valid even when **no KB rule** addresses it.

### what_REVIEWED_means

A file is `REVIEWED` **only when** the reviewer has considered, for that file (proportionally to its risk and complexity):

1. its diff;
2. enough surrounding code to understand the changed behavior;
3. relevant inputs/outputs;
4. relevant caller/callee relationships;
5. failure paths;
6. requirement relevance;
7. applicable specialist-skill rules;
8. relevant tests or absence of tests;
9. cross-file consequences.

Trivial files (e.g. whitespace, a one-line null-guard with no behavioral surface) receive **proportional** review, not ceremonial depth. The coverage ledger is a completeness mechanism, not a substitute for reasoning.

**Hard rule — classification is not review.** Marking a file `REVIEWED` (or `GENERATED`/`EXCLUDED`) is a decision made *after* examining that file's diff — never a bulk assignment by extension or by "the rest of this area looked fine". A file whose diff was never opened stays `REMAINING`. Bucketing hundreds of files by type and calling them reviewed is a coverage failure, not completeness. "Proportional" review still requires opening and reasoning over every non-trivial changed file; it adjusts depth, not whether the file is read.

### coverage_ledger

Every changed file ends in exactly one state before finalization; no in-scope file may remain unclassified:

- `REVIEWED` — satisfies `what_REVIEWED_means`.
- `GENERATED` — `*.auto.cs` / `*.auto.md`; exempted, listed.
- `EXCLUDED` — tooling / KB churn / temp artifacts; requires a one-line reason.
- `REMAINING` — in scope but not yet reviewed (transient; must reach zero before finalization).

### second_look (mandatory adversarial sweep)

After all files reach REVIEWED/GENERATED/EXCLUDED and before final output, perform a second review sweep over the change set from these perspectives (not a mechanical reread):

1. **Production failure** — what breaks after deploy even if build/tests pass?
2. **Data** — what existing data/state makes this unsafe?
3. **Consumer** — what caller/client/integration could behave differently?
4. **Concurrency** — what if two requests/jobs run simultaneously?
5. **Operations** — how would an operator detect/diagnose a failure?
6. **Scale** — what is fine at 10 records but dangerous at 100k/10m?
7. **Security** — can trust boundaries, authZ, tenant isolation, logging, serialization, or input handling be bypassed?
8. **Maintenance** — will the next developer likely violate an implicit or duplicated invariant?

Use the sweep to discover cross-file and emergent issues missed in the first pass.

### cross_skill_deduplication

When multiple skills inspect the same issue:

- retain the strongest evidence;
- merge findings **only** when they share the same root cause;
- preserve additional consequences from specialist analysis;
- choose severity using the global severity policy;
- record all applicable rule references;
- do not emit duplicate findings just because multiple skills discovered them.

Different root causes remain separate findings.

### kb_fallback

- KB checklists are strong repository-specific evidence but are **not** the boundary of the review.
- A valid production defect may exist even when no KB rule addresses it.
- Preferred behavior: include a KB rule when one applies; otherwise explicitly state `No specific KB rule; derived from code/contract/runtime behavior`.
- Never suppress a real defect because no KB checklist item covers it. KB conformance supplements engineering reasoning; it does not replace it.

### severity_scale

| level | definition | mapping |
|---|---|---|
| p0 | Probable outage, data loss, security breach, or irreversible rollback failure. | Blocker |
| p1 | High-impact production risk with significant user or operational impact. | High |
| p2 | Moderate correctness or reliability risk with bounded impact. | Medium |
| p3 | Low-impact issue or maintainability concern. | Advisory |

Verdict mapping: `any_blocker: Blocked` · `unresolved_high_or_medium: Request changes` · `all_clear_or_high_accepted: Approve`.

When assigning `p0`/`p1`, include one sentence explaining why lower severities are insufficient.

### output

- `required_sections`: verdict, blockers, confirmed_findings, advisory_opportunities, open_questions, summary.
- **completeness** (mandatory, no cap, no truncation):
  - `report_every_distinct_issue: true`, `no_cap_on_findings: true`, `no_cap_on_blockers: true`, `no_cap_on_advisories: true`
  - `report_every_changed_file_once: true`, `forbid_final_report_with_remaining_files: true`, `do_not_truncate_for_size_or_time: true`
  - Coverage ledger buckets: `REVIEWED`, `GENERATED`, `EXCLUDED`, `REMAINING` (REMAINING must reach 0 before finalization).
  - Mandatory finding categories (all surfaced when present): performance_issues, wrong_coding_practices, solid_principle_violations, requirement_gaps, possible_production_bugs, security_and_data_integrity, resource_and_configuration_risks.
- **blockers**: group by severity first; every blocker/high finding requires a reproducing code example AND a concrete possible fix.
- **report_file**: directory `.tmp/review`, filename `<session_id>_<yyyyMMdd-HHmmss>_<task-short-title>.md`.
- **summary_fields**: session_used, review_target_kind, base_ref, review_ref, comparison_range, files_reviewed, files_excluded, files_remaining, files_generated_excluded, blocker_count, findings_by_severity, verdict.
- **finding_fields**: severity, level, file_path, line, location, evidence, why_it_matters, failure_scenario, production_impact, recommendation, kb_rule_reference, test_to_add, code_snippet, suggested_fix_snippet.
- **advisory**: categories = possible_bugs, optimization_opportunities, bad_practices, negative_patterns, code_smells, low_performance_patterns, refactoring_opportunities, missed_unit_tests, missed_integration_tests. Confidence levels = high/medium/low (label required). Every advisory item requires evidence + suggestion snippets + one validation step.
- **snippet_requirements**: use the correct language/type for the evidence (e.g. `csharp` for code, `yaml`/`json` for configuration, `text` for command output, plain prose/markdown for missing-artifact findings). Fenced code blocks, max 25 lines/snippet. **Require snippets only where they materially improve reproducibility/actionability** — do NOT force meaningless `csharp` snippets into summary/verdict, into a documentation finding whose evidence is a *missing* artifact, or into a test-command failure whose evidence is command output. Every confirmed code finding needs issue + fix snippets; every code advisory needs evidence + suggestion snippets. `allow_not_applicable_with_reason: true`. `redact_sensitive_values: true`.
- **include_checks**: migration_and_data_safety, high_impact_schema_changes, configuration_changes, user_story_coverage, verification_status, finding_snippet_quality, advisory_snippet_quality, integration_test_assertion_presence, per_class_coverage_results, wiki_documentation_updates, changelog_updates.

---

## backend_defaults

Backend-review-specific rules.

### scope

Default review scope areas (applied when the plan's `scope.include` is empty; `scope.exclude` may add per-PR exclusions):

- user_story_alignment
- changed_code_correctness
- edge_cases
- error_handling
- security_and_authorization
- concurrency_and_race_conditions
- resource_lifecycle
- persistence_and_ef_core
- migration_data_safety
- high_impact_schema_changes
- configuration_changes
- dependency_and_breaking_change_risks
- backward_compatibility
- performance_and_scalability
- tests_and_coverage
- optimization_and_code_health
- kb_resolution

Generated (`*.auto.cs` / `*.auto.md`) and KB/package artifacts are always bucketed separately, independent of scope.

### test_review

- inspect: missed_unit_tests, missed_integration_tests, ok_happy_path_cases, ko_negative_failure_path_cases, edge_cases, branch_coverage_gaps, missing_coverage_exclusion_attributes, integration_test_assertion_presence.
- Tests are **executable behavioral evidence**, not just coverage numbers. For each changed behavior determine whether tests prove: success, rejection, invalid inputs, boundary cases, failure dependency, concurrency (where relevant), authorization/security boundary, existing-data compatibility, idempotency/retry (where relevant), rollback/partial failure (where relevant).
- When a test exists, evaluate whether its assertions actually prove the behavior. Invocation-only tests are **not** meaningful evidence. Coverage percentage is a signal, never a substitute for behavioral assertions.
- rules:
  - reject endpoint-invocation-only tests (no assertions).
  - require assertions for mocked entities.
  - **forbid solution-wide / repository-wide test and coverage runs.**
  - require filter-based test execution and coverage for the changed scope.
  - filter source: changed_files, changed_classes, related_test_names.
  - filter-mismatch (no tests matched / invalid filter / zero discovered tests) requires user approval for related-project fallback.
  - require ≥80% line coverage (per class) for changed service/handler classes; coverage-exclusion attributes `[ExcludeFromCodeCoverage]`/`[ExcludeTestCoverage]`.
  - branch coverage paths: if/else, switch, guard clauses, exception paths, validation/authorization paths, feature-flag/retry/fallback paths.
- Do not recommend coverage exclusion for code containing business behavior.


### kb_resolution

Knowledgebase discovery uses `$onu-documentation-finder` (index-first, deterministic). Do not glob arbitrary folders.

1. Use `$onu-documentation-finder` to resolve the knowledge-base root and read its `index.md` as the routing map.
2. Match the required checklist by frontmatter `title`/`scope` (keywords like 'code review', 'check list', 'Backend', 'quality') or filename; record the substitution.
3. Read every required checklist before Pass 2B and again before Pass 5.
4. If a required checklist cannot be located, record a coverage-ledger note and surface it as an explicit review limitation.

Include a KB rule reference when one applies; prefer a KB rule over a generic concern. When none applies, state `No specific KB rule; derived from code/contract/runtime behavior`.

### migration_data_safety

- inspect_new_migrations: true; require existing-data risk assessment.
- checks: pre_migration_script, post_migration_script, rollback_script, verification_queries.

### high_impact_schema_changes

- inspect: table_name_changes, column_name_changes, foreign_key_additions, foreign_key_updates.
- minimum_severity P1; require a high-impact finding + backward-compatibility review when triggered.

### configuration_review

- inspect: appsettings, environment_variables, secret_store_references, deployment_manifests, feature_flags.
- require safe defaults + rolling-deployment compatibility.

### optimization_review

- enabled: true; minimum_confidence_to_report low; report_all_opportunities; no target count or cap.

### execution_efficiency

- avoid_duplicate_commands; reuse prior outputs; forbid solution-wide test/coverage; prefer single test invocation for status+coverage.
- limits: max 1 build / 1 test / 1 coverage run per scope. Re-run allowed only when prior evidence failed or is incomplete.

### documentation_review

- require docs for new public APIs, breaking changes, architectural decisions; allow a linked documentation task as alternative.

### changelog_review

- require entries for user-facing changes and breaking changes; require consumer-impact description.

### single_pass_test_and_coverage

- enabled; derive pass/fail from the same command; second invocation requires approval and is allowed only for coverage-collector failure, missing/unreadable coverage artifact, or interrupted test execution.
- do not hard-code flags that diverge from project conventions (resolve the project's coverage convention from the repo, e.g. a `coverlet.runsettings` file when present).
- require class-level coverage report + coverage check for affected service/handler classes; allow command adjustment.
