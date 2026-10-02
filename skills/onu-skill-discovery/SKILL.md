---
name: onu-skill-discovery
description: Discover and inspect installed skills. Use when you need to determine which skills are available or find one relevant to a task.
---

# Skill discovery

Use the scripts in this skill's `scripts/` directory.

To list installed skills:

pwsh -NoProfile -File scripts/Get-AgentSkills.ps1 -Format json

To search:

pwsh -NoProfile -File scripts/Find-AgentSkill.ps1 \
  -Query "<task>" \
  -Format json

To inspect a selected skill:

pwsh -NoProfile -File scripts/Get-AgentSkill.ps1 \
  -Name "<skill-name>" \
  -Format content \
  -First

Do not load every SKILL.md during discovery. First inspect name, description, and
location. Load the full SKILL.md only after selecting a relevant skill.

By default the scripts inspect repository, project, and user skill roots. Narrow
discovery with `-Client codex|github|opencode|any`, `-Scope repository|project|user|all`,
or `-Root <path>`.
