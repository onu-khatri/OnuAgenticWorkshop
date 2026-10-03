import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function runGit(args, options = {}) {
  const result = spawnSync('git', args, {
    cwd: options.cwd,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : ['ignore', 'inherit', 'inherit'],
  });
  if (result.error?.code === 'ENOENT') throw new Error('git is required but was not found on PATH.');
  if (result.status !== 0) {
    const detail = options.capture ? (result.stderr || result.stdout || '').trim() : '';
    throw new Error(`git ${args[0]} failed${detail ? `: ${detail}` : ''}`);
  }
  return options.capture ? result.stdout.trim() : '';
}

function resolveLocalCommit(repoDir) {
  const probe = spawnSync('git', ['rev-parse', 'HEAD'], {
    cwd: repoDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  if (probe.status !== 0) return 'local-working-tree';

  const head = probe.stdout.trim();
  const status = spawnSync('git', ['status', '--porcelain'], {
    cwd: repoDir,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  return `${head}${status.status === 0 && status.stdout.trim() ? '-dirty' : ''}`;
}

function fetchLocal(source) {
  console.log(`\nUsing local skills working tree: ${source.localSource}`);
  return { tempRoot: null, repoDir: source.localSource, commit: resolveLocalCommit(source.localSource) };
}

function fetchRemote(source) {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'onu-agentic-workshop-'));
  const repoDir = path.join(tempRoot, 'repo');
  fs.mkdirSync(repoDir, { recursive: true });

  console.log(`\nFetching skills from ${source.repository}`);
  console.log(`Ref: ${source.ref}`);

  runGit(['init', '--quiet'], { cwd: repoDir });
  runGit(['remote', 'add', 'origin', source.repository], { cwd: repoDir });
  runGit(['fetch', '--quiet', '--depth', '1', 'origin', source.ref], { cwd: repoDir });
  runGit(['checkout', '--quiet', '--detach', 'FETCH_HEAD'], { cwd: repoDir });
  const commit = runGit(['rev-parse', 'HEAD'], { cwd: repoDir, capture: true });

  return { tempRoot, repoDir, commit };
}

export function fetchRepository(source) {
  return source.localSource ? fetchLocal(source) : fetchRemote(source);
}
