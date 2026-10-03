# PR Review Plan

Create a temporary YAML review plan before any deep review work.

Use `review_plan_path` if explicitly provided by the user; otherwise, generate a default path using the format `.tmp/review-plans/<yyyyMMdd-HHmmss>-AgentCodeReviewBE-plan.yaml`.

Use [AgentCodeReviewBE-plan.template.yaml](../templates/AgentCodeReviewBE-plan.template.yaml) as the source shape. The template is a **per-PR schema only**: fill `inputs`, `scope`, `review_capabilities`, `risk_focus`, `review_strategy`, `planned_verification.commands`, and any `overrides`. Do **not** restate policy or methodology text.

Static policy (severity scale, evidence classification, output completeness, snippet rules, test/coverage thresholds, KB checklists, migration/optimization gates) lives in [BackendCoreReviewPolicy.md](BackendCoreReviewPolicy.md) and is referenced by the execution prompt. Do not duplicate it in the plan.

## Capability discovery & selection (during planning)

Perform capability routing now, but **do not perform the deep review**:

1. Discover review capabilities via the `$onu-quality-code-review` router's "Skill Discovery & Selection" section, then record each selected capability in `review_capabilities`.
2. For the resolved change set, evaluate each capability's `applies_when` against changed file types, technologies, architectural areas, and the user story. Record, per selected capability: `why_applicable`, `mode` (primary/supplementary), and `execution` (inline vs delegate_candidate).
3. Avoid selecting two capabilities as primary owner of the same area (use primary + supplementary instead).
4. Mark a capability as `delegate_candidate` only if its contract declares `delegable: true` and a bounded, independently-analyzable sub-area exists. Do **not** actually dispatch sub-agents here — the delegation decision is finalized during execution, after intake, and only after the approval gate.

Record the result in `review_capabilities`.

## Risk-aware strategy (during planning)

Derive PR-specific, high-level risk signals only — no deep inspection, no findings:

- `risk_focus.primary_behavior_paths`: the likely end-to-end paths (e.g. `API -> validation -> service -> repository -> DB`).
- `risk_focus.likely_high_risk_areas`: inferred from file types/areas (e.g. migration, tenant isolation, retry/idempotency).
- `risk_focus.context_expansion_targets`: caller/callee/consumer edges likely worth inspecting beyond the literal diff.
- `review_strategy.depth_by_area`: optional proportional depth hints (deep vs proportional).

These are planning-time hypotheses to guide — not conclusions of — the review.

## Review-target resolution for plan generation

- Record the selected `session_id` and the already-resolved review target into `inputs` (`review_target_kind`, `feature_branch`, `base_branch`, `base_commit`, `head_commit`).
- Do not re-resolve the working tree or branch here: that is performed by the `$onu-quality-code-review` router (see its Branch & Git Resolution Policy) before plan generation.
- Leave `inputs.merge_base` empty; it is computed by the router or during execution, never before approval.

## Comparison range policy for plan generation

- Use commit-scoped comparison only when both `base_commit` and `head_commit` are explicitly provided; treat a user-requested snapshot as `head_commit`.
- If only one commit input is present, keep branch-vs-base comparison and add a plan note requesting both commit refs for commit-scoped review.
- Materialize `planned_verification.commands` diff refs using the resolved range (`<resolved_base>...<resolved_head>`), never latest-check-in assumptions.

## Approval gate

Before approval, do only minimal metadata discovery and capability/risk planning. Do not build, test, deeply inspect diffs, or generate findings. Do not dispatch sub-agents before approval unless governance explicitly allows it.

Share the plan path and pause until the user replies with one of the accepted approval responses defined in the agent's Approval Governance. If the user edits the plan, re-read it, summarize the effective plan, and wait again.

If the YAML is missing required sections or contains syntax errors, respond with: `YAML file is malformed due to <reason>, please correct it and resubmit`.
