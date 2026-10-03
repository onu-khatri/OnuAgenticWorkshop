---
name: onu-documentation-finder
description: 'Locate and retrieve knowledge-base artifacts deterministically (index-first, then frontmatter title/scope/audience, then filename) instead of globbing arbitrary folders. Use when any skill or agent needs to find a .knowledge.md topic, ADR, or project authority from the knowledge base.'
---

# Documentation finder

Single, index-first way to locate knowledge-base artifacts. Other skills and agents should call this (`$onu-documentation-finder`) instead of re-implementing "locate the knowledge-base directory by name, then read its index".

## Retrieval order (deterministic)

1. Resolve the knowledge-base root (see "KB root resolution").
2. Read the root `index.md` as the routing map first — never a full-tree read.
3. For a specific topic, resolve by frontmatter `title`/`scope`/`intent`/`audience`, then filename.
4. A not-found result is a limitation to surface, never a silent skip and never a prompt to glob other folders.

## Scripts

List all artifacts (including `index.md`):

```
pwsh -NoProfile -File scripts/Get-Knowledge.ps1 -Format json
```

Search by topic / keyword / decision area:

```
pwsh -NoProfile -File scripts/Find-Knowledge.ps1 -Query "<topic>" -Format json
```

Fetch one artifact (by `title` or filename):

```
pwsh -NoProfile -File scripts/Get-KnowledgeItem.ps1 -Name "<title-or-filename>" -Format content
```

Narrow discovery with `-Root <path>` to pin a knowledge-base directory, or `-ProjectRoot <path>` to resolve from a specific project root.

## KB root resolution

- Use `-Root <path>` to pin the knowledge-base directory deterministically.
- Otherwise resolve by directory name, in priority order: `knowledge-base`, `knowledge_base`, then `knowledgebase`, `knowledge`, `kb`, searching the project root and up to two levels deep.
- The root contains `index.md`, `*.knowledge.md` artifacts, and an optional `ADR/` directory.

## Contract for consumers

Consumers treat this finder as the single resolution path:

- index-first selective retrieval (no full knowledge-base read);
- match by frontmatter `title`/`scope`/`intent`/`audience`, not by guessing filenames;
- a not-found result is surfaced as a limitation, not papered over with random globbing.

## Reference files

- `scripts/KnowledgeDiscovery.ps1` — shared root resolution, frontmatter parsing, and catalog functions.
- `scripts/Get-Knowledge.ps1` — list artifacts.
- `scripts/Find-Knowledge.ps1` — score-based search.
- `scripts/Get-KnowledgeItem.ps1` — fetch one artifact.
