import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const distDir = path.join(repoRoot, 'dist');
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';

fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });

const result = spawnSync(npm, ['pack', '--json', '--pack-destination', distDir], {
  cwd: repoRoot,
  encoding: 'utf8',
  stdio: ['ignore', 'pipe', 'inherit'],
});

if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);

const packed = JSON.parse(result.stdout);
if (!Array.isArray(packed) || !packed[0]?.filename) {
  throw new Error('npm pack did not return a tarball filename.');
}

const tarball = path.join(distDir, packed[0].filename);
console.log(`Created ${tarball}`);
