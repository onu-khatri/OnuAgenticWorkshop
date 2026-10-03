# Branch & Git Resolution Policy

Do not begin code review until the review target and comparison range are resolved and safe.

## Inspect the working tree first

- Run `git status --short` (and `git status` for branch/upstream context) before choosing a target.
- Account for staged changes, unstaged changes, and newly added/untracked files that belong to the work under review.
- If staged or unstaged changes exist:
	- Treat the current working-tree changes as the primary review target.
	- Review staged and unstaged changes together unless the user explicitly asks otherwise.
	- Do NOT ignore unstaged changes just because staged changes are present.
	- Clearly state in the intake note that the review is working-tree-based.
- If only untracked files exist and they are part of the work, include them in the review target.

## No local changes -> resolve the branch

If there are no staged, unstaged, or relevant untracked changes:

- Determine the currently checked-out branch.
- If the current branch is NOT `main`, `dev`, or `test`:
	- Identify the current branch.
	- Inform the user that no local changes were found and that you intend to review the complete changes introduced by the current branch.
	- Ask for confirmation before proceeding if the review target has not already been explicitly provided.
	- Determine the base branch; if it is unclear or cannot be determined reliably, ask the user. Never silently assume a base branch.
- If the current branch IS `main`, `dev`, or `test`:
	- Do NOT assume that branch itself should be reviewed.
	- Ask the user for the branch to review and the base branch against which it should be reviewed.
	- If only the review branch is provided but the base branch is unclear, explicitly ask for the base branch.

## Prepare the repository safely before a branch review

- Verify the requested review branch exists.
- Ensure the repository is on the required review branch.
- Ensure changing branches will not overwrite or lose local work.
- Fetch the latest remote references (`git fetch`).
- Ensure the review branch is up to date with its remote where appropriate, and the base branch reference is current.
- Confirm the final review branch, base branch, and comparison range.
- Do NOT perform destructive Git operations. Do not discard, reset, overwrite, stash, or modify local changes without explicit authorization.
- If switching branches is unsafe because of local changes, stop and explain the conflict instead of forcing the checkout.

## Compute the complete branch delta

- Determine the merge base between the base branch and the review branch, and review the complete branch delta.
- The review target represents: `merge-base(base-branch, review-branch) -> review-branch`.
- The review MUST NOT be limited to the latest commit, last check-in, `HEAD~1..HEAD`, only the most recent diff, or only files changed in the latest commit.
- Include changes from all commits that belong to that branch delta.

## Branch guardrails

- Never perform destructive Git operations.
- Never force a branch checkout if it would overwrite or lose local work; stop and explain the conflict instead.
- Never silently assume a base branch when there is meaningful ambiguity; ask the user.
- Never bypass the session, review-branch, or base-branch approval gates.
