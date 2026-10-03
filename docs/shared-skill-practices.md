# Shared and reusable Agent Skills practices

This repository follows the cross-tool Agent Skills convention rather than maintaining provider-specific copies of the same skill.

## Canonical skill format

Keep each skill in one directory with a required `SKILL.md` entry point:

```text
skills/
└── skill-name/
    ├── SKILL.md
    ├── scripts/      # optional deterministic helpers
    ├── references/   # optional supporting documentation
    └── assets/       # optional templates/resources
```

`SKILL.md` should contain YAML frontmatter with at least:

```yaml
---
name: skill-name
description: What the skill does and when an agent should use it.
---
```

For portable skills, keep `name` lowercase kebab-case, match it to the directory name, and keep it within 64 characters. Keep `description` precise and within 1024 characters.

## Progressive disclosure

Treat the skill description as discovery metadata. Put only the essential workflow in `SKILL.md`, then move large references, examples, or deterministic operations to supporting files. This keeps startup context small and lets the agent load details only when needed.

## One canonical source repository

Store skills once in a version-controlled repository and let installers or compatible clients consume that repository. Avoid copying and editing separate Claude Code, Codex, Copilot, and OpenCode variants unless a client truly needs client-specific behavior.

The npm package in this repository is therefore an **installer**, not the skills payload. At runtime it fetches the Git repository configured in `installer.config.json` and copies the selected skills into a supported discovery location.

## Prefer the shared `.agents/skills` location for multi-client setups

Codex, GitHub Copilot, and OpenCode recognize the shared Agent Skills location; Claude Code uses `.claude/skills` natively and does not fall back to `.agents/skills`:

- Codex: project and user skills use `.agents/skills` and `~/.agents/skills`.
- GitHub Copilot: recognizes `.agents/skills` for project and user skills, in addition to Copilot-native paths.
- OpenCode: recognizes `.agents/skills` for project and user skills, in addition to OpenCode-native paths.
- Claude Code: project and user skills use `.claude/skills` and `~/.claude/skills`.

For that reason, when more than one client is selected, this installer defaults to one `.agents/skills` copy instead of duplicating the same files into multiple client-specific directories.

## Separate source version from installer version

Version the lightweight npm installer independently from the skills source. The source repository setting has its own Git ref. For reproducible team or CI installs, use a release tag or immutable commit SHA instead of a moving branch.

The installer records the resolved source commit in `.onu-agentic-workshop.lock.json` alongside installed skills.

## Inspect and trust remote skills

Skills can include executable scripts and instructions that affect agent behavior. Treat a remote skills repository like executable developer tooling:

- Use repositories you trust.
- Review changes before advancing a pinned ref.
- Prefer protected tags or commit SHAs for managed environments.
- Validate `SKILL.md` metadata in CI.
- Run security/scanning checks on scripts shipped with skills.

GitHub's `gh skill` workflow follows similar practices: preview before installing, support tags/SHAs and pinning, and keep provenance for updates.

## Provider-specific metadata

Keep the core skill portable. Add provider-specific optional metadata only when it improves that provider without breaking others. For example, Codex can use `agents/openai.yaml` for UI/dependency metadata. Other clients may ignore unsupported auxiliary metadata while still consuming the common `SKILL.md`.

## Portable agents

Agents live alongside skills under `agents/`, one directory per agent with a required `AGENT.md` entry point:

```text
agents/
└── agent-name/
    ├── AGENT.md      # required entry point
    └── references/   # optional supporting docs
```

`AGENT.md` uses the same YAML frontmatter convention as `SKILL.md`. The full canonical field set and each vendor's serialization mapping are declared in `agent-formats.json`. The frontmatter requires `name` (kebab-case, matching the directory) and `description`; the Markdown body is the agent's instructions.

Unlike skills, agent files are **not** copied verbatim. Each vendor uses a different native agent format:

- **Claude Code** expects YAML frontmatter + Markdown (`name` and `description` required, plus `tools`, `model`, `color`).
- **Codex** expects TOML (`name`, `description`, `developer_instructions`, `model`, `model_reasoning_effort`, `sandbox_mode`, `mcp_servers`).
- **GitHub Copilot** expects YAML frontmatter + Markdown (`description` required, plus `tools`, `model`, `target`, `user-invocable`, `disable-model-invocation`, `mcp-servers`, `metadata`).
- **OpenCode** expects YAML frontmatter + Markdown (`description` required, plus `mode`, `model`, `temperature`, `top_p`, `permission`, `steps`, `hidden`, `color`).

The installer reads `agent-formats.json`, maps canonical frontmatter fields to each vendor's keys, drops unsupported fields, and serializes the result in the vendor's native format. Canonical-only parameters that a vendor cannot represent are omitted rather than emitted incorrectly.

## References

- Agent Skills specification: https://agentskills.io/specification
- Codex skills: https://developers.openai.com/codex/skills
- GitHub Copilot Agent Skills: https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills
- OpenCode skills: https://opencode.ai/docs/skills
- npm exec / npx: https://docs.npmjs.com/cli/npm-exec/
