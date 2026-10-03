---
name: onu-git-worktrees
description: Safely create, validate, operate, and clean up isolated Git worktrees for scalable parallel development. Use when parallel work, a clean checkout, or branch isolation is required.
---

# Git Worktrees

Use this skill to create reproducible isolated workspaces without stashing or switching the primary checkout. It is the worktree authority for `$onu-openspec-workflow`; use `$onu-git-workflows` for history surgery and `$onu-git-commit` for commits. It may create a worktree only from an explicit implementation handoff that proves implementation approval, canonical change/issue identity, base branch, and owning agent. For issue-driven work the handoff must also prove proposal validation and Definition-of-Ready completion; a plain-language development request does not require those OpenSpec gates.

## Use this skill when

- implementing multiple handed-off GitHub issues in parallel (see `onu-openspec-workflow`, `onu-delivery-issues-kickoff`, and `onu-story-orchestrator`)
- a feature needs a clean checkout separate from your current working tree
- you want to keep an in-progress change while starting unrelated work

## Do not use this skill when

- a single branch checkout is sufficient
- the work is a one-off edit that does not need isolation

## Preflight

Before creating or removing anything, capture:

```bash
git rev-parse --show-toplevel
git status --short
git branch --show-current
git worktree list --porcelain
git remote -v
```

Confirm the requested issue/story ID, target base branch, worktree path, branch name, and whether the target worktree or branch already exists. Never reuse a worktree for a different issue. Treat a prunable, broken, incomplete, untracked, or pre-approval worktree as invalid: report it and stop; do not repair, force, delete, or silently replace it. Stop if the primary checkout has an unfinished merge, rebase, cherry-pick, or bisect.

## Create workflow

0. Require the caller's implementation-handoff evidence before any filesystem or Git mutation. If implementation approval, change/issue identity, base branch, or owner is missing, stop and return the missing evidence. For issue- or OpenSpec-driven work, proposal validation and Definition of Ready are additionally required. Do not create a worktree for discovery, issue selection, interview, proposal drafting, proposal validation, or readiness review.

1. Confirm the repository and branch with the preflight checks above. Resolve the repository root before interpreting relative paths.

```bash
git rev-parse --show-toplevel
git branch --show-current
```

2. Propose a default branch name from the change/issue, then ask the user to
   confirm it or provide their own. Prefer the user's decision; never create a
   branch the user has not approved. Suggested defaults:
   - plain work: `feature/<short-kebab-slug>`
   - issue work: `gh-<issue-number>-<short-kebab-slug>`
   - OpenSpec work: `openspec/<change-name>`
   Use `$onu-workflow-user-interview` (or one focused question) to confirm or
   override the branch name.

3. Choose a deterministic project-local `.worktrees/<short-kebab-slug>` directory and verify that the directory itself is ignored:

```bash
git check-ignore -q .worktrees
```

If it is not ignored, stop and request or apply the repository-approved ignore change before creating a worktree. Do not silently append to `.gitignore` while the worktree operation is in progress.

4. Verify the base branch exists and is current enough for the plan, then create the worktree with the user-approved branch name:

```bash
git worktree add .worktrees/<short-kebab-slug> -b <user-approved-branch-name>
```

Use `--` for path boundaries where applicable. Do not use `-B` or force an existing branch unless the user explicitly requests recovery and the target has been verified.

5. Validate the new worktree before implementation:

```bash
   git -C .worktrees/<short-kebab-slug> status --short
   git -C .worktrees/<short-kebab-slug> branch --show-current
   git -C .worktrees/<short-kebab-slug> log -1 --oneline
```

Then run the smallest relevant baseline checks:
   - Backend: `dotnet build application\<TargetProject>App.slnx`
   - Frontend: `npm install` then `npm run check`

6. Write a per-worktree context record to the worktree's temp folder so each
   branch keeps its own session and context. Store it at
   `.worktrees/<short-kebab-slug>/.tmp/onu-worktree.json` with:
   - `branch` (the user-approved name)
   - `baseBranch`
   - `change` / `issue` identity when present
   - `owner` (owning agent)
   - `purpose` (objective)
   - `createdAt` timestamp

   Keep this context separate per branch/worktree; do not reuse it for a
   different change. Then work inside the worktree; the original checkout stays
   untouched.

## Parallel delivery rules

- Use one worktree per independently owned change (issue or slice).
- Do not parallelize changes to the same migration, shared contract, composition root, shared UI primitive, or generated file without an explicit coordinating owner.
- Use deterministic names containing the stable change/issue ID; do not use generic names such as `work`.
- Each worktree must have one owning agent and one stated base branch.
- Do not run cleanup while an agent, terminal, test process, or editor still has the worktree open.

## Cleanup and recovery

```bash
git status --short
git worktree list --porcelain
git worktree remove .worktrees/<feature>   # only after changes are committed or intentionally discarded
git worktree prune                          # reconcile stale administrative entries
```

If removal reports uncommitted changes, stop and show the path and status. Do not force-remove or delete the directory to bypass the warning. If a worktree directory was manually removed, run `git worktree prune` only after confirming no valid worktree still uses that path.

## Safety rules

- Always verify `.worktrees/` is gitignored before creating a worktree, or its contents will pollute `git status`.
- Do not proceed past a failing baseline build/test without investigating and recording the failure.
- Never use destructive filesystem deletion to clean a worktree.
- Do not force-update or delete branches as part of ordinary setup or cleanup.
- One worktree per issue keeps independently owned work isolated; shared-contract and migration work still requires one coordinating lane.

## Definition of Done

- Repository, branch, path, and existing worktree state were verified before mutation.
- Worktree was created under an ignored directory with a fresh deterministic feature branch.
- Baseline checks and the initial branch/worktree identity were recorded before implementation starts.
- Worktree is removed only after branch completion and clean status, or the remaining changes are explicitly handed off.
