import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onu-agentic-workshop-stale-test-'));
const installer = path.join(repoRoot, 'bin', 'install.js');

function runInstall() {
  const result = spawnSync(process.execPath, [
    installer,
    '--local-source', repoRoot,
    '--clients', 'claude,codex,github,opencode',
    '--scope', 'project',
    '--agents',
    '--force',
  ], { cwd: projectDir, encoding: 'utf8', stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function readLock() {
  return JSON.parse(fs.readFileSync(path.join(projectDir, '.agents', 'skills', '.onu-agentic-workshop.lock.json'), 'utf8'));
}

try {
  runInstall();
  const lock = readLock();

  const skillsRoot = Object.keys(lock.files).find((root) => lock.files[root].skills.length);
  const agentsRoot = Object.keys(lock.files).find((root) => lock.files[root].agents.length);
  if (!skillsRoot || !agentsRoot) throw new Error('Expected skills and agent roots in lock file.');

  const staleSkill = 'onu-stale-skill';
  const staleSkillDir = path.join(skillsRoot, staleSkill);
  fs.mkdirSync(staleSkillDir, { recursive: true });
  fs.writeFileSync(path.join(staleSkillDir, 'SKILL.md'), '# stale\n');
  lock.files[skillsRoot].skills.push(staleSkill);
  lock.installedSkills.push(staleSkill);

  const staleAgentFile = 'onu-stale-agent.md';
  const staleAgentPath = path.join(agentsRoot, staleAgentFile);
  fs.writeFileSync(staleAgentPath, 'stale');
  lock.files[agentsRoot].agents.push(staleAgentFile);
  lock.installedAgents.push('onu-stale-agent');

  for (const root of Object.keys(lock.files)) {
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, '.onu-agentic-workshop.lock.json'), `${JSON.stringify(lock, null, 2)}\n`);
  }

  runInstall();

  if (fs.existsSync(staleSkillDir)) throw new Error(`Stale skill was not removed: ${staleSkillDir}`);
  if (fs.existsSync(staleAgentPath)) throw new Error(`Stale agent was not removed: ${staleAgentPath}`);

  console.log('Stale cleanup test passed.');
} finally {
  fs.rmSync(projectDir, { recursive: true, force: true });
}
