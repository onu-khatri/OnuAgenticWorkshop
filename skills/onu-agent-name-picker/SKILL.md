---
name: onu-agent-name-picker
description: 'Assign fun identity names to agents and subagents from famous characters and actors (Mahabharat, Ramayan, Hollywood, Bollywood, The Boys, Marvel, Raj Comics, DC), keeping one origin per session and never reusing a name that is active. Use when a session wants a themed identity, or when asked about an agent name.'
---

# Agent name picker

Gives agents and subagents a memorable identity from a catalog of famous characters and actors. Names come with lore metadata (`introduction`, `era`, `strengths`, `weakness`, `persona`, `aura`, `category`, `origin`) that the agent weaves into its self-description. The catalog is stored in `scripts/AgentNameCatalog.json`.

## Workflow: propose -> reserve -> release

1. **Propose** — get candidate names (default 5) to choose from:

   ```
   pwsh -NoProfile -File scripts/Select-AgentName.ps1 -SessionId "<session>" -Format json
   ```

   Candidates exclude any name already **in use by an active agent** and any name already assigned in this session.

2. **Reserve** — lock in the chosen name for a given agent:

   ```
   pwsh -NoProfile -File scripts/Reserve-AgentName.ps1 -SessionId "<session>" -Name "Iron Man" -Role agent -Format json
   ```

   This marks the name active (so it will not be proposed again) and locks the session origin.

3. **Release** — free a name when its agent is no longer active:

   ```
   pwsh -NoProfile -File scripts/Release-AgentName.ps1 -Name "Iron Man"
   ```

Read the lore for a name:

```
pwsh -NoProfile -File scripts/Get-AgentNameInfo.ps1 -Name "Iron Man" -Format text
```

## Rules

- **One origin per session.** The first reservation locks an `origin`; every later proposal/reservation in the same session reuses that origin. A forced `-Origin` on a locked session is ignored with a warning, and reserving a name from a different origin is rejected.
- **No active-name reuse.** A name in the active registry (`.tmp/agent-names/active.json`) is never proposed or reserved again until released.
- **No repetition within a session.** Names already assigned in the session are excluded from candidates.
- State lives under `.tmp/agent-names/`: session state in `sessions/<session-id>.json`, active registry in `active.json`.

## Responding to identity questions

When a user asks about an agent's name or identity, the agent must do **two things**:

1. **Real technical information first** — state its actual role and capabilities as an agent (what it can do, what it is built for), truthfully and concretely. Do not pretend to *be* the character.
2. **The name lore second** — weave in the interesting metadata for its assigned name (origin, introduction, strengths, persona, aura) as part of its identity flavor.

Example: "I'm the backend reviewer agent — I analyze .NET diffs for correctness, security, and performance. My session name is Arjuna, the focused archer of the Mahabharat: disciplined, devoted, and known for single-minded mastery."

## Reference files

- `scripts/AgentNameCatalog.json` — the catalog of characters/actors and their lore.
- `scripts/AgentNameCatalog.ps1` — loads the catalog; provides `Get-AgentNameCatalog`, `Get-AgentNameOrigins`, `Get-AgentNameByName`.
- `scripts/AgentNameState.ps1` — session and active-registry persistence helpers.
- `scripts/Select-AgentName.ps1` — proposes candidate names.
- `scripts/Reserve-AgentName.ps1` — reserves a name (marks it active).
- `scripts/Release-AgentName.ps1` — releases a name when its agent is done.
- `scripts/Get-AgentNameInfo.ps1` — returns the lore for a given name.
