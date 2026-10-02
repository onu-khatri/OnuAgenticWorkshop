# Shared Agent Skills

A reusable Agent Skills repository plus a lightweight `npx` installer for **Codex**, **GitHub Copilot**, and **OpenCode**.

The important design rule is that the npm package is **not the skills payload**. When the CLI runs, it reads `installer.config.json`, fetches the configured Git repository/ref, discovers its `skills/` directory, and installs those skills into the selected client scope.

## How installation works

```text
npx installer
     │
     ├─ reads installer.config.json
     │     repository + ref + skillsPath
     │
     ├─ asks target clients (multi-select)
     │     Codex / GitHub Copilot / OpenCode
     │
     ├─ asks install scope
     │     Current project / User root
     │
     ├─ fetches the configured Git repository
     │
     └─ copies its skill folders into the selected discovery location
```

## Configure the source repository

Edit `installer.config.json` before publishing the npm installer:

```json
{
  "source": {
    "repository": "https://github.com/YOUR_ORG/shared-agent-skills.git",
    "ref": "main",
    "skillsPath": "skills"
  },
  "install": {
    "preferSharedPathForMultipleClients": true
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
    "skillsPath": "skills"
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
AGENT_SKILLS_PATH
```

## Interactive installer

Run:

```bash
npx <your-installer-package>
```

The installer first asks which clients should receive the skills:

```text
Select target client providers:
› ◯ Codex
  ◯ GitHub Copilot
  ◯ OpenCode

  ↑/↓ move • Space toggle • Enter confirm
```

Then it asks for scope:

```text
Where should the skills be installed?
› Current project (/path/to/project)
  User root / global (/home/you)
```

It fetches the configured source repository **after these choices**, resolves the Git commit, previews target locations, and asks before replacing existing skills.

## Install locations

For a single selected provider, the installer uses that provider's supported discovery location:

| Provider | Current project | User/global |
| --- | --- | --- |
| Codex | `.agents/skills/` | `~/.agents/skills/` |
| GitHub Copilot | `.github/skills/` | `${COPILOT_HOME:-~/.copilot}/skills/` |
| OpenCode | `.opencode/skills/` | `${XDG_CONFIG_HOME:-~/.config}/opencode/skills/` |

When **multiple providers** are selected, the installer defaults to the portable shared location:

```text
Project: .agents/skills/
User:    ~/.agents/skills/
```

Codex, GitHub Copilot, and OpenCode all recognize `.agents/skills`, so one copy is enough for a multi-client setup. Set `preferSharedPathForMultipleClients` to `false` in `installer.config.json` if you intentionally want duplicated provider-native installs.

> Note: Codex's current documented local skill location is `.agents/skills`. Therefore a Codex-local skill may also be discoverable by other clients that intentionally support the shared Agent Skills location.

## Source provenance

After a successful install, the CLI writes:

```text
.shared-agent-skills.lock.json
```

inside each target skill root. It records:

- source repository
- requested Git ref
- resolved commit SHA
- source `skillsPath`
- installed skill names
- install timestamp

This makes a moving ref such as `main` auditable and a pinned tag/SHA reproducible.

## Non-interactive use

Install all three clients at project scope:

```bash
npx <your-installer-package> \
  --clients codex,github,opencode \
  --scope project \
  --force
```

Install at user scope from a specific release:

```bash
npx <your-installer-package> \
  --repo https://github.com/acme/agent-skills.git \
  --ref v1.4.0 \
  --clients codex,github,opencode \
  --scope user \
  --force
```

Preview without writing:

```bash
npx <your-installer-package> \
  --clients codex,github,opencode \
  --scope project \
  --dry-run
```

Options:

```text
--repo <git-url>      Skills Git repository URL/path
--ref <git-ref>       Branch, tag, or commit
--skills-path <path>  Skills directory inside source repository
--clients <list>      codex,github,opencode
--scope <scope>       project | user
--force               Replace existing skills without prompting
--dry-run             Fetch and preview without writing skill files
-h, --help            Show help
```

## Canonical skills repository layout

Keep one portable copy of every skill under `skills/`:

```text
shared-agent-skills/
├── skills/
│   └── engineering-baseline/
│       ├── SKILL.md
│       └── references/
│           └── completion-checklist.md
├── bin/
│   └── install.js
├── installer.config.json
├── docs/
│   └── shared-skill-practices.md
└── package.json
```

A minimal portable skill:

```markdown
---
name: my-skill
description: Describe what the skill does and when it should be used.
---

# Instructions

Describe the workflow here.
```

See [`docs/shared-skill-practices.md`](docs/shared-skill-practices.md) for the cross-client conventions and security/versioning practices used by this repository.

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

Run an isolated local installer test. It creates a temporary project, installs all three clients from the working tree, verifies the skill and provenance lock, then deletes the temporary project:

```bash
npm run test:local
```

Build the npm installer tarball:

```bash
npm run bundle
```

The generated package is written to:

```text
dist/shared-agent-skills-<version>.tgz
```

Test that exact packed tarball through `npx`, still using the local working tree as the skill source:

```bash
npm run test:bundle
```

The underlying local-package form is:

```bash
npx --yes \
  --package ./dist/shared-agent-skills-0.5.0.tgz \
  shared-agent-skills \
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
| `npm run validate` | Validate skills plus Node.js syntax |
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
  --clients codex,github,opencode \
  --scope project \
  --dry-run
```

`git` is required for normal remote repository installs. `--local-source` does not require Git to copy skills, although the installer will record the current Git commit plus `-dirty` in provenance when the local source is itself a Git working tree.
