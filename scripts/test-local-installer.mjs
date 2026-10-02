import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-agent-skills-local-test-'));
const installer = path.join(repoRoot, 'bin', 'install.js');

try {
  const result = spawnSync(process.execPath, [
    installer,
    '--local-source', repoRoot,
    '--clients', 'codex,github,opencode',
    '--scope', 'project',
    '--force',
  ], { cwd: projectDir, encoding: 'utf8', stdio: 'inherit' });

  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);

  const skill = path.join(projectDir, '.agents', 'skills', 'engineering-baseline', 'SKILL.md');
  const lock = path.join(projectDir, '.agents', 'skills', '.shared-agent-skills.lock.json');
  if (!fs.existsSync(skill)) throw new Error(`Expected installed skill was not created: ${skill}`);
  if (!fs.existsSync(lock)) throw new Error(`Expected provenance lock was not created: ${lock}`);

  const provenance = JSON.parse(fs.readFileSync(lock, 'utf8'));
  if (!String(provenance.source?.repository || '').startsWith('local:')) {
    throw new Error('Local development install did not record a local source.');
  }

  console.log('Local working-tree installer test passed.');
} finally {
  fs.rmSync(projectDir, { recursive: true, force: true });
}
