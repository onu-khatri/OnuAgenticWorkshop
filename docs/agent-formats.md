# Agent format and vendor mapping

This document explains the canonical agent format and the `agent-formats.json` schema that drives agent installation. Agents live in `agents/` alongside `skills/` and are authored once, then transformed by the installer into each vendor's native format.

## Canonical agent format

Each agent is one directory with a required `AGENT.md` entry point:

```text
agents/
├── AGENTS.md         # project instruction file (user-owned, not an agent)
└── onu-<agent-name>/
    ├── AGENT.md       # required entry point
    └── references/    # optional supporting docs
```

> **Naming**: an individual agent's entry point is `AGENT.md` (singular, like `SKILL.md`). The repository-level instruction file is `AGENTS.md` (plural) — it is user-owned project guidance, not an agent definition, and is never auto-generated or overridden by the installer.

`AGENT.md` uses YAML frontmatter plus a Markdown body:

```markdown
---
name: onu-code-reviewer
description: Reviews diffs and pull requests for correctness and security risks.
reasoningEffort: medium
sandboxMode: read-only
---

Instructions that define the agent's behavior (the "prompt").
```

- `name` is required, must use the `onu-` prefix, and must match the directory name.
- `description` is required.
- The Markdown body is the agent's instructions and becomes each vendor's prompt (e.g. Codex `developer_instructions`, or the body of the Markdown file for Claude Code, Copilot, and OpenCode).

## Canonical fields

The complete field set is declared in `agent-formats.json` under `canonical.fields`. Each field has a `type` and optional constraints (`enum`, `min`/`max`, `maxLength`, `pattern`).

| Field | Type | Required | Notes |
| --- | --- | --- | --- |
| `name` | string | yes | `onu-` prefix, kebab-case, ≤64 chars |
| `description` | string | yes | ≤1024 chars |
| `prompt` | string | no | optional explicit instructions; otherwise the body is used |
| `model` | string | no | user-provided; do not hardcode in the repo |
| `temperature` | number | no | 0–2 |
| `topP` | number | no | 0–1 |
| `reasoningEffort` | string | no | `ultra` / `max` / `xhigh` / `high` / `medium` / `low` |
| `mode` | string | no | `primary` / `subagent` / `all` |
| `tools` | array | no | tool names or aliases |
| `permissions` | object | no | `allow` / `ask` / `deny` (or nested glob patterns) |
| `sandboxMode` | string | no | `read-only` / `workspace-write` / `danger-full-access` |
| `disabled` | boolean | no | disable without removing |
| `hidden` | boolean | no | hide from manual selection |
| `userInvocable` | boolean | no | whether a user can manually select it |
| `disableModelInvocation` | boolean | no | prevent automatic model-based invocation |
| `maxSteps` | number | no | maximum agentic iterations |
| `color` | string | no | UI accent color |
| `mcpServers` | object | no | MCP server definitions |
| `target` | string | no | `vscode` / `github-copilot` |
| `metadata` | object | no | free-form key/value annotations |
| `tags` | array | no | discovery keywords |
| `author` | string | no | author or owning team |
| `version` | string | no | agent source version |

Only `name` and `description` are required. Every other field is optional and is omitted from a vendor's output when absent or unsupported.

## Vendor serialization

Each vendor in `agent-formats.json` declares how to serialize a canonical agent:

| Key | Meaning |
| --- | --- |
| `label` | human-readable vendor name |
| `format` | `toml` or `markdown+yaml` |
| `extension` | output file extension |
| `filename` | filename template; `{name}` is replaced with the agent name |
| `locations` | `project` and `user` install directories |
| `instructions` | `project` and `user` instruction file paths (for agent registration) |
| `required` | vendor-native fields that must be present |
| `fieldMap` | canonical field → vendor-native key mapping |
| `unsupported` | canonical fields the vendor cannot represent (dropped) |

Supported vendors:

| Vendor | Format | File | Project | User | Instruction file |
| --- | --- | --- | --- | --- | --- |
| Claude Code | YAML + Markdown | `<name>.md` | `.claude/agents/` | `~/.claude/agents/` | `CLAUDE.md` |
| Codex | TOML | `<name>.toml` | `.codex/agents/` | `~/.codex/agents/` | `AGENTS.md` |
| GitHub Copilot | YAML + Markdown | `<name>.agent.md` | `.github/agents/` | `~/.github/agents/` | `AGENTS.md` |
| OpenCode | YAML + Markdown | `<name>.md` | `.opencode/agent/` | `~/.config/opencode/agent/` | `AGENTS.md` |

## Field mapping and sentinels

The `fieldMap` maps a canonical field name to the vendor's native key. Two sentinel values are special:

- `@body` — the canonical `prompt` (or the Markdown body) is written into the file body, not frontmatter.
- `@filename` — the value is derived from the output filename rather than written as a field (used by OpenCode, where the filename is the agent name).

For example, the canonical `prompt` maps to:

- Codex → `developer_instructions` (a TOML key)
- Claude Code / Copilot / OpenCode → `@body` (the Markdown body)

When a canonical field is absent from `AGENT.md`, or is listed in a vendor's `unsupported` array, it is dropped from that vendor's output rather than emitted with a wrong or empty value.

## Adding a vendor

1. Add the vendor to `bin/installers/constants.js` (`CLIENTS` map) with its skill `project`/`user` locations and `label`.
2. Add a matching entry to `agent-formats.json` under `vendors` with `label`, `format`, `extension`, `filename`, `locations`, `instructions`, `required`, `fieldMap`, and `unsupported`.
3. Add the vendor to the `CLIENT_OPTIONS` list in `bin/install.js` so it appears in the interactive selection.
4. Update the vendor tables in `README.md` and this document.

`npm run validate` cross-checks that the `CLIENTS` keys in `constants.js` exactly match the `vendors` keys in `agent-formats.json`, so the two sources cannot drift.

## Adding a canonical field

1. Add the field to `agent-formats.json` under `canonical.fields` with its `type` and constraints.
2. Map it to the appropriate native key in each vendor's `fieldMap` (or add it to each vendor's `unsupported` list).
3. `scripts/validate.py` will then validate the field's presence, type, and constraints in every `AGENT.md`.

The installer (`bin/installers/agents.js`) reads the `fieldMap` generically, so no installer code changes are required to pick up a new field or vendor.

## Agent registration in instruction files

The installer can append the installed-agent catalog to each vendor's instruction file (declared in `instructions`). This is controlled by `registerAgentsInInstructions` (default `true`) and the `--register-agents` / `--no-register-agents` flags:

- Agents are not installed → the instruction file is untouched.
- `registerAgentsInInstructions` is `true` (default) → the catalog is written automatically.
- `registerAgentsInInstructions` is `false` → the installer asks interactively; in non-interactive runs it is skipped.

The catalog is injected as a marked, idempotent section:

```text
<!-- BEGIN onu-agentic-workshop:agents -->
## Agents
- **onu-code-reviewer** — Defect-first reviewer...
<!-- END onu-agentic-workshop:agents -->
```

On reinstall, only the marked section is replaced, preserving any other content. Vendors that share an instruction file (Codex, Copilot, and OpenCode all use `AGENTS.md`) are written once.
