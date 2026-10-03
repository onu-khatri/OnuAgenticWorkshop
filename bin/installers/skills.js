import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { CLIENTS } from './constants.js';

export function discoverSkills(repoDir, skillsPath) {
  const skillsRoot = path.resolve(repoDir, skillsPath);
  const repoResolved = path.resolve(repoDir);
  if (!(skillsRoot === repoResolved || skillsRoot.startsWith(`${repoResolved}${path.sep}`))) {
    throw new Error('Configured skillsPath resolves outside the repository.');
  }
  if (!fs.existsSync(skillsRoot) || !fs.statSync(skillsRoot).isDirectory()) {
    throw new Error(`Skills directory not found in source repository: ${skillsPath}`);
  }

  const skills = fs.readdirSync(skillsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, source: path.join(skillsRoot, entry.name) }))
    .filter((skill) => fs.existsSync(path.join(skill.source, 'SKILL.md')));

  if (!skills.length) throw new Error(`No valid skill folders found under ${skillsPath}`);
  return skills;
}

function sharedRoot(scope, cwd) {
  return scope === 'project'
    ? path.join(cwd, '.agents', 'skills')
    : path.join(os.homedir(), '.agents', 'skills');
}

function rootsFor(clients, scope, cwd, preferShared) {
  if (preferShared && clients.length > 1) {
    return [{
      key: 'shared',
      label: `Shared (.agents) for ${clients.map((c) => CLIENTS[c].label).join(', ')}`,
      root: sharedRoot(scope, cwd),
      clients,
    }];
  }

  return clients.map((client) => ({
    key: client,
    label: CLIENTS[client].label,
    root: CLIENTS[client][scope](cwd),
    clients: [client],
  }));
}

export function buildPlan(clients, scope, cwd, skills, preferShared) {
  const roots = rootsFor(clients, scope, cwd, preferShared);
  return roots.flatMap((target) => skills.map((skill) => ({
    ...target,
    skill: skill.name,
    source: skill.source,
    destination: path.join(target.root, skill.name),
  })));
}
