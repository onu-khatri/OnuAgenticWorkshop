# OnuAgenticWorkshop

A reusable Agent Skills repository plus a lightweight `npx` installer for **Claude Code**, **Codex**, **GitHub Copilot**, and **OpenCode**.

The important design rule is that the npm package is **not the skills payload**. When the CLI runs, it reads `installer.config.json`, fetches the configured Git repository/ref, discovers its `skills/` and `agents/` directories, and installs those skills (and, optionally, agents) into the selected client scope.

## How installation works

```text
npx installer
     │
     ├─ reads installer.config.json
     │     repository + ref + skillsPath + agentsPath
     │
      ├─ asks target clients (multi-select)
      │     Claude Code / Codex / GitHub Copilot / OpenCode
     │
     ├─ asks install scope
     │     Current project / User root
     │
     ├─ asks whether to also install agents (opt-in)
     │
     ├─ fetches the configured Git repository
     │
     └─ installs the selected skills and, optionally, agents into the
        chosen discovery locations
```

## Configure the source repository

Edit `installer.config.json` before publishing the npm installer:

```json
{
  "source": {
    "repository": "https://github.com/YOUR_ORG/onu-agentic-workshop.git",
    "ref": "main",
    "skillsPath": "skills",
    "agentsPath": "agents"
  },
  "install": {
    "preferSharedPathForMultipleClients": true,
    "registerAgentsInInstructions": true
  }
}
```

`repository` can be any Git URL/path that the user's local `git` can access, including authenticated HTTPS, SSH, or a local repository path.

For managed/CI installs, prefer a release tag or immutable commit SHA instead of `main`:

```json
{
  "source": {
    "repository": "https://github.com/acme/agent-skills.git",
    "ref": "v1.4.0",
    "skillsPath": "skills",
    "agentsPath": "agents"
  }
}
```

The repository/ref can also be overridden without rebuilding the npm package:

```bash
npx <your-installer-package> \
  --repo https://github.com/acme/agent-skills.git \
  --ref v1.4.0
```

Environment overrides are also supported:

```text
AGENT_SKILLS_REPOSITORY
AGENT_SKILLS_REF
AGENT_SKILLS_LOCAL_SOURCE
AGENT_SKILLS_PATH
AGENT_SKILLS_AGENTS_PATH
```

## Interactive installer

Run:

```bash
npx <your-installer-package>
```

The installer first asks which clients should receive the skills:

```text
Select target client providers:
› ☐ Claude Code
  ☐ Codex
  ☐ GitHub Copilot
  ☐ OpenCode

  ↑/↓ move • Space toggle • Enter confirm
```

Then it asks for scope:

```text
Where should the skills be installed?
› Current project (/path/to/project)
  User root / global (/home/you)
```

Then it asks whether to also install agents (skills are always installed; agents are opt-in):

```text
Also install agents? [y/N]
```

It fetches the configured source repository **after these choices**, resolves the Git commit, previews target locations, and asks before replacing existing skills.

## Install locations

For a single selected provider, the installer uses that provider's supported discovery location:

| Provider | Current project | User/global |
| --- | --- | --- |
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| Codex | `.agents/skills/` | `~/.agents/skills/` |
| GitHub Copilot | `.github/skills/` | `${COPILOT_HOME:-~/.copilot}/skills/` |
| OpenCode | `.opencode/skills/` | `${XDG_CONFIG_HOME:-~/.config}/opencode/skills/` |

When **multiple providers** are selected, the installer defaults to the portable shared location:

```text
Project: .agents/skills/
User:    ~/.agents/skills/
```

Codex, GitHub Copilot, and OpenCode all recognize `.agents/skills`, so one copy is enough for a multi-client setup. Claude Code uses `.claude/skills/` natively and does not fall back to `.agents/skills`. Set `preferSharedPathForMultipleClients` to `false` in `installer.config.json` if you intentionally want duplicated provider-native installs.

> Note: Codex's current documented local skill location is `.agents/skills`. Therefore a Codex-local skill may also be discoverable by other clients that intentionally support the shared Agent Skills location.

## Agent install locations

The installer also discovers agents from the source repository's `agentsPath` (default `agents/`) and generates each agent in the selected vendor's native format. The canonical source for each agent is a `AGENT.md` file, which the installer transforms per vendor using `agent-formats.json`.

| Provider | Current project | User/global | Native file |
| --- | --- | --- | --- |
| Claude Code | `.claude/agents/` | `~/.claude/agents/` | `<name>.md` |
| Codex | `.codex/agents/` | `~/.codex/agents/` | `<name>.toml` |
| GitHub Copilot | `.github/agents/` | `~/.github/agents/` | `<name>.agent.md` |
| OpenCode | `.opencode/agent/` | `~/.config/opencode/agent/` | `<name>.md` |

Because each vendor's native agent format differs (TOML for Codex, YAML frontmatter + Markdown for Claude Code, Copilot, and OpenCode), agents are always installed to each selected vendor's native location — there is no shared multi-vendor fallback for agents. Field mapping between the canonical frontmatter and each vendor's required parameters is declared in `agent-formats.json`.

## Agent registration in instruction files

When agents are installed, the installer can also append a short, auto-generated catalog of the installed agents to the vendor's project instruction file, so the main agent knows when to delegate to them. The catalog is generated from the individual `agents/onu-*/AGENT.md` files (mirrored in the repository's `agents/AGENTS.md`) and is injected as a marked, idempotent section:

| Vendor | Instruction file |
| --- | --- |
| Claude Code | `CLAUDE.md` |
| Codex | `AGENTS.md` |
| GitHub Copilot | `AGENTS.md` |
| OpenCode | `AGENTS.md` |

Behavior is controlled by `registerAgentsInInstructions` (default `true`) and the `--register-agents` / `--no-register-agents` flags:

- Agents are not installed → the instruction file is not touched.
- `registerAgentsInInstructions` is `true` (default) → the catalog is written automatically.
- `registerAgentsInInstructions` is `false` → the installer asks whether to add the registration at install time (interactive only; skipped in non-interactive runs).

The injected section is wrapped in `<!-- BEGIN onu-agentic-workshop:agents -->` / `<!-- END onu-agentic-workshop:agents -->` markers and is clearly labelled as auto-generated. On reinstall, the installer replaces only that marked section, preserving any other content the user has written in the file. When Codex, Copilot, and OpenCode all target the same `AGENTS.md`, it is written once. The repository's `agents/AGENTS.md` is a separate, user-owned instruction file and is never auto-appended or overridden.

## Overriding agents in the autonomous flow

The installed `onu-*` agents are defaults, not fixed bindings. In your project's `AGENTS.md` you can name your own agent for any role in the autonomous development loop; your explicit routing takes priority over the installed agent catalog.

The overridable roles and their defaults:

| Role | Default agent |
| --- | --- |
| Driver | `onu-autonomous-developer` |
| Planner | `onu-implementation-planner` |
| Implementor (backend) | `onu-backend-implementer` |
| Implementor (frontend) | `onu-frontend-implementer` |
| Code review | `onu-code-reviewer` |
| Security review | `onu-security-auditor` |

For example, to use your own planner and code reviewer while keeping the default implementors, add this to your project `AGENTS.md` under its "Skill and agent routing" section:

```markdown
## Skill and agent routing

When a development request needs an implementation plan, delegate to
`acme-planner` instead of the default `onu-implementation-planner`.

When reviewing a change, delegate to `acme-reviewer` instead of the default
`onu-code-reviewer`.
```

Your project `AGENTS.md` takes priority over the injected agent catalog, which is additive and never overrides your own content. Override only the roles you care about; any role you do not name falls back to the installed `onu-*` default.

## Autonomous development workflow

Beyond installation, this repository ships a ready-made autonomous development workflow: skills (the *how*), agents (the *who*), and a project instruction file (`agents/AGENTS.md`) that routes between them. A driver agent runs one development request end-to-end:

```text
entry → plan → implement → review (replan loop) → work-done → user approval → deliver
```

The default agents are `onu-autonomous-developer` (driver), `onu-implementation-planner` (plan), `onu-backend-implementer` / `onu-frontend-implementer` (implement), and `onu-code-reviewer` + `onu-security-auditor` (review). Every role is overridable from your project `AGENTS.md` (see the previous section).

See [`docs/autonomous-workflow.md`](docs/autonomous-workflow.md) for the full loop, how to define your own driver agent, and the delegation protocol.

## Source provenance

After a successful install, the CLI writes:

```text
.onu-agentic-workshop.lock.json
```

inside each target root (each skill root and each agent root). It records:

- source repository
- requested Git ref
- resolved commit SHA
- source `skillsPath` and `agentsPath`
- installed skill names
- installed agent names
- install timestamp
- a per-root `files` map of the skill folders and agent filenames written to that root

This makes a moving ref such as `main` auditable and a pinned tag/SHA reproducible.

On reinstall, the CLI uses this lock file to remove stale entries: a skill or agent present in the previous install but no longer in the source repository is deleted from its target root. This keeps the installed set in sync with the source when skills or agents are removed upstream.

## Non-interactive use

Install all four clients at project scope:

```bash
npx <your-installer-package> \
  --clients claude,codex,github,opencode \
  --scope project \
  --force
```

Add `--agents` to also install agents in non-interactive mode (they are skipped by default unless `--agents` is passed):

```bash
npx <your-installer-package> \
  --clients claude,codex,github,opencode \
  --scope project \
  --agents \
  --force
```

Install at user scope from a specific release:

```bash
npx <your-installer-package> \
  --repo https://github.com/acme/agent-skills.git \
  --ref v1.4.0 \
  --clients claude,codex,github,opencode \
  --scope user \
  --force
```

Preview without writing:

```bash
npx <your-installer-package> \
  --clients claude,codex,github,opencode \
  --scope project \
  --dry-run
```

Options:

```text
--repo <git-url>      Skills Git repository URL/path
--ref <git-ref>       Branch, tag, or commit
--skills-path <path>  Skills directory inside source repository
--agents-path <path>  Agents directory inside source repository
--clients <list>      claude,codex,github,opencode
--scope <scope>       project | user
--agents              Also install agents (default: ask interactively)
--no-agents           Skip agent installation
--register-agents     Register installed agents in the vendor instruction file
--no-register-agents  Do not register agents in the instruction file
--model <id>          Model to set on generated agents (leave blank to omit)
--force               Replace existing skills without prompting
--dry-run             Fetch and preview without writing skill files
-h, --help            Show help
```

## Canonical skills repository layout

Keep one portable copy of every skill under `skills/`:

```text
onu-agentic-workshop/
├── skills/
│   └── onu-skill-discovery/
│       ├── SKILL.md
│       └── scripts/
│           └── Find-AgentSkill.ps1
├── agents/
│   ├── AGENTS.md            # project instruction file (user-owned)
│   └── onu-code-reviewer/
│       └── AGENT.md
├── bin/
│   ├── install.js
│   └── installers/          # installer modules (args, skills, agents, ...)
├── installer.config.json
├── agent-formats.json
├── docs/
│   └── shared-skill-practices.md
└── package.json
```

A minimal portable skill:

```markdown
---
name: onu-my-skill
description: Describe what the skill does and when it should be used.
---

# Instructions

Describe the workflow here.
```

A minimal portable agent:

```markdown
---
name: onu-my-agent
description: Describe what the agent does and when to delegate to it.
mode: subagent
---

Instructions that define the agent's behavior.
```

Every skill and agent must use the `onu-` prefix on its `name` (matching the directory name) so it is discoverable and unambiguous within the shared namespace.

The `model` field is intentionally not set in the repository's agents. Models are supplied by the user (via the `--model` flag, the interactive prompt, or by adding a `model` field to their own `AGENT.md`). When no model is provided, the generated agent files omit it so each vendor falls back to its own default or inherited model.

See [`agent-formats.json`](agent-formats.json) for the canonical frontmatter schema and the per-vendor field mapping, and [`docs/agent-formats.md`](docs/agent-formats.md) for a full explanation of the agent format, vendor serialization, and how to add a vendor or field.

See [`docs/shared-skill-practices.md`](docs/shared-skill-practices.md) for the cross-client conventions and security/versioning practices used by this repository.

See [`docs/autonomous-workflow.md`](docs/autonomous-workflow.md) for the autonomous development loop and how to define your own driver agent.

## npm packaging

The npm tarball deliberately excludes `skills/`. It ships only the installer, settings, and documentation. This guarantees that `npx` installs whatever exists in the configured source repository/ref rather than silently using a stale skill copy embedded in the package.

Create the installer tarball locally with:

```bash
npm run bundle
```

This writes a clean npm package to `dist/*.tgz`. After setting an available npm package name, publish with:

```bash
npm publish
```

Then users run:

```bash
npx <your-installer-package>
```

You can also run the package directly from GitHub with `npx github:<owner>/<installer-repo>`, but the **skills content still comes from `installer.config.json`**, not from the npm/npx cache.

## Local development

The repository includes development scripts so the installer can be exercised without pushing skills to GitHub or publishing to npm.

Run the installer interactively against the **current working tree** (including uncommitted skill edits):

```bash
npm run dev:install
```

This is equivalent to `node bin/install.js --local-source .`. The `--local-source` mode bypasses the remote Git fetch and reads `skills/` directly from the supplied directory. Production `npx` runs continue to fetch from `installer.config.json` unless this development-only option is explicitly supplied.

Validate source files and syntax:

```bash
npm run validate
```

Run an isolated local installer test. It creates a temporary project, installs all four clients from the working tree, verifies the skill and provenance lock, then deletes the temporary project:

```bash
npm run test:local
```

Build the npm installer tarball:

```bash
npm run bundle
```

The generated package is written to:

```text
dist/onu-agentic-workshop-<version>.tgz
```

Test that exact packed tarball through `npx`, still using the local working tree as the skill source:

```bash
npm run test:bundle
```

The underlying local-package form is:

```bash
npx --yes \
  --package ./dist/onu-agentic-workshop-0.5.0.tgz \
  onu-agentic-workshop \
  --local-source .
```

Run the full development verification sequence:

```bash
npm test
```

The available scripts are:

| Script | Purpose |
| --- | --- |
| `npm run dev:install` | Interactive development install from the current working tree |
| `npm run validate` | Validate skills, agents, JSON configs, and Node.js syntax |
| `npm run test:local` | Isolated installer test against local skills |
| `npm run bundle` | Create the distributable npm `.tgz` in `dist/` |
| `npm run test:bundle` | Execute the packed `.tgz` through `npx` against local skills |
| `npm test` | Run validation, local installer test, and packed installer test |
| `npm run ci:validate` | Run the same full validation sequence used by GitHub Actions |
| `npm run ci:bundle` | Validate/test, then create a fresh `dist/*.tgz` for CI publishing |

## GitHub Actions

Two workflows are included under `.github/workflows/`:

- **`validate-skills.yml`** runs for every pull request and push. It executes `npm run ci:validate` and `npm pack --dry-run`, so malformed skills, installer regressions, or accidental npm package-content changes fail CI before merge.
- **`publish-tgz-on-merge.yml`** runs when a pull request is closed against `main` or `master`, but its publish job executes only when that pull request was actually merged. It checks out the merged commit, runs `npm run ci:bundle`, verifies that exactly one tarball was created, records its SHA-256 in the workflow summary, and uploads `dist/*.tgz` as a GitHub Actions artifact for 90 days.

The merge workflow deliberately publishes a **workflow artifact**, not an npm-registry release. This keeps every successfully merged installer build downloadable without requiring npm credentials or creating a registry release for every merge. A registry/tag release workflow can be added separately when release semantics are needed.

You can also invoke development mode directly:

```bash
node bin/install.js \
  --local-source . \
  --clients claude,codex,github,opencode \
  --scope project \
  --dry-run
```

`git` is required for normal remote repository installs. `--local-source` does not require Git to copy skills, although the installer will record the current Git commit plus `-dirty` in provenance when the local source is itself a Git working tree.
