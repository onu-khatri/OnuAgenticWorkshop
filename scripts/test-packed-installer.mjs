import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const distDir = path.join(repoRoot, 'dist');
const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-agent-skills-packed-test-'));
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';

function run(command, args, cwd = repoRoot) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

try {
  run(npm, ['run', 'bundle']);
  const tarballs = fs.readdirSync(distDir).filter((name) => name.endsWith('.tgz'));
  if (tarballs.length !== 1) throw new Error(`Expected exactly one tarball in dist/, found ${tarballs.length}.`);
  const tarball = path.join(distDir, tarballs[0]);

  run(npx, [
    '--yes',
    `--package=${tarball}`,
    'shared-agent-skills',
    '--local-source', repoRoot,
    '--clients', 'codex,github,opencode',
    '--scope', 'project',
    '--force',
  ], projectDir);

  const skill = path.join(projectDir, '.agents', 'skills', 'engineering-baseline', 'SKILL.md');
  if (!fs.existsSync(skill)) throw new Error(`Packed installer did not install expected skill: ${skill}`);

  console.log('Packed npx installer test passed.');
} finally {
  fs.rmSync(projectDir, { recursive: true, force: true });
}
