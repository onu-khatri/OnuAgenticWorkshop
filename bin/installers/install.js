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

function buildProvenance(plan, agentPlan, source, commit) {
  return {
    schemaVersion: 1,
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
  };
}

function writeProvenance(plan, agentPlan, source, commit) {
  const roots = [...new Set([...plan, ...agentPlan].map((item) => item.root))];
  const payload = buildProvenance(plan, agentPlan, source, commit);

  for (const root of roots) {
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, '.onu-agentic-workshop.lock.json'), `${JSON.stringify(payload, null, 2)}\n`);
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
  installSkills(plan, dryRun);
  installAgents(agentPlan, dryRun);
  if (!dryRun) writeProvenance(plan, agentPlan, source, commit);
}
