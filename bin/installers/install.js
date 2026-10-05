import fs from 'node:fs';
import path from 'node:path';

export function printPlan(plan, agentPlan, scope, source, commit) {
  console.log('\nInstall plan');
  console.log(`Source: ${source.repository}`);
  console.log(`Resolved commit: ${commit}`);
  console.log(`Skills path: ${source.skillsPath}`);
  if (agentPlan.length) console.log(`Agents path: ${source.agentsPath}`);
  console.log(`Scope: ${scope === 'project' ? 'Current project' : 'User root / global'}\n`);

  const roots = new Map();
  for (const item of plan) roots.set(item.root, item.label);
  for (const item of agentPlan) roots.set(item.root, item.label);
  for (const [root, label] of roots) console.log(`  ${label}: ${root}`);
  console.log('');
}

const LOCK_FILENAME = '.onu-agentic-workshop.lock.json';

function buildProvenance(plan, agentPlan, source, commit) {
  const files = {};
  for (const item of plan) {
    files[item.root] ??= { skills: [], agents: [] };
    files[item.root].skills.push(item.skill);
  }
  for (const item of agentPlan) {
    files[item.root] ??= { skills: [], agents: [] };
    files[item.root].agents.push(item.filename);
  }
  for (const entry of Object.values(files)) {
    entry.skills = [...new Set(entry.skills)].sort();
    entry.agents = [...new Set(entry.agents)].sort();
  }

  return {
    schemaVersion: 2,
    source: {
      repository: source.repository,
      requestedRef: source.ref,
      commit,
      skillsPath: source.skillsPath,
      agentsPath: source.agentsPath,
    },
    installedSkills: [...new Set(plan.map((item) => item.skill))].sort(),
    installedAgents: [...new Set(agentPlan.map((item) => item.agent))].sort(),
    installedAt: new Date().toISOString(),
    files,
  };
}

function writeProvenance(plan, agentPlan, source, commit) {
  const roots = [...new Set([...plan, ...agentPlan].map((item) => item.root))];
  const payload = buildProvenance(plan, agentPlan, source, commit);

  for (const root of roots) {
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, LOCK_FILENAME), `${JSON.stringify(payload, null, 2)}\n`);
  }
}

function readLock(root) {
  const lockPath = path.join(root, LOCK_FILENAME);
  if (!fs.existsSync(lockPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  } catch {
    return null;
  }
}

function removeStale(plan, agentPlan, dryRun) {
  const current = new Map();
  for (const item of plan) {
    if (!current.has(item.root)) current.set(item.root, { skills: new Set(), agents: new Set() });
    current.get(item.root).skills.add(item.skill);
  }
  for (const item of agentPlan) {
    if (!current.has(item.root)) current.set(item.root, { skills: new Set(), agents: new Set() });
    current.get(item.root).agents.add(item.filename);
  }

  for (const [root, sets] of current) {
    const lock = readLock(root);
    if (!lock) continue;
    const prevSkills = lock.files?.[root]?.skills ?? lock.installedSkills ?? [];
    const prevAgentFiles = lock.files?.[root]?.agents ?? [];

    for (const skill of prevSkills) {
      if (sets.skills.has(skill)) continue;
      const destination = path.join(root, skill);
      if (!fs.existsSync(destination)) continue;
      if (dryRun) {
        console.log(`[dry-run] remove stale skill ${skill} -> ${destination}`);
        continue;
      }
      fs.rmSync(destination, { recursive: true, force: true });
      console.log(`Removed stale skill ${skill} -> ${destination}`);
    }

    for (const file of prevAgentFiles) {
      if (sets.agents.has(file)) continue;
      const destination = path.join(root, file);
      if (!fs.existsSync(destination)) continue;
      if (dryRun) {
        console.log(`[dry-run] remove stale agent ${file} -> ${destination}`);
        continue;
      }
      fs.rmSync(destination, { force: true });
      console.log(`Removed stale agent ${file} -> ${destination}`);
    }
  }
}

function installSkills(plan, dryRun) {
  for (const item of plan) {
    if (dryRun) {
      console.log(`[dry-run] ${item.skill} -> ${item.destination}`);
      continue;
    }
    fs.mkdirSync(item.root, { recursive: true });
    if (fs.existsSync(item.destination)) fs.rmSync(item.destination, { recursive: true, force: true });
    fs.cpSync(item.source, item.destination, { recursive: true, force: true, dereference: false });
    console.log(`Installed ${item.skill} -> ${item.destination}`);
  }
}

function installAgents(agentPlan, dryRun) {
  for (const item of agentPlan) {
    if (dryRun) {
      console.log(`[dry-run] ${item.agent} (${item.client}) -> ${item.destination}`);
      continue;
    }
    fs.mkdirSync(item.root, { recursive: true });
    fs.writeFileSync(item.destination, item.content);
    console.log(`Installed ${item.agent} (${item.client}) -> ${item.destination}`);
  }
}

export function install(plan, agentPlan, { dryRun, source, commit }) {
  removeStale(plan, agentPlan, dryRun);
  installSkills(plan, dryRun);
  installAgents(agentPlan, dryRun);
  if (!dryRun) writeProvenance(plan, agentPlan, source, commit);
}
