#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageRoot = path.resolve(__dirname, '..');
const settingsPath = path.join(packageRoot, 'installer.config.json');

const CLIENTS = {
  codex: {
    label: 'Codex',
    project: (cwd) => path.join(cwd, '.agents', 'skills'),
    user: () => path.join(os.homedir(), '.agents', 'skills'),
  },
  github: {
    label: 'GitHub Copilot',
    project: (cwd) => path.join(cwd, '.github', 'skills'),
    user: () => path.join(process.env.COPILOT_HOME || path.join(os.homedir(), '.copilot'), 'skills'),
  },
  opencode: {
    label: 'OpenCode',
    project: (cwd) => path.join(cwd, '.opencode', 'skills'),
    user: () => {
      const configHome = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), '.config');
      return path.join(configHome, 'opencode', 'skills');
    },
  },
};

function usage() {
  console.log(`Shared Agent Skills installer

Usage:
  npx shared-agent-skills
  npx shared-agent-skills --clients codex,github,opencode --scope project

Source options (override installer.config.json):
  --repo <git-url>      Skills Git repository URL/path
  --ref <git-ref>       Branch, tag, or commit (default from settings)
  --local-source <path> Read skills directly from a local working tree (development)
  --skills-path <path>  Skills directory inside source repository

Install options:
  --clients <list>      Comma-separated: codex,github,opencode
  --scope <scope>       project | user
  --force               Overwrite existing skill directories without prompting
  --dry-run             Fetch and show the plan without writing skill files
  -h, --help            Show this help

Environment overrides:
  AGENT_SKILLS_REPOSITORY
  AGENT_SKILLS_REF
  AGENT_SKILLS_LOCAL_SOURCE
  AGENT_SKILLS_PATH

Interactive mode asks which clients to target (multi-select), then whether to
install in the current project or at the user/global level.`);
}

function parseArgs(argv) {
  const args = {
    clients: null,
    scope: null,
    force: false,
    dryRun: false,
    repository: null,
    ref: null,
    localSource: null,
    skillsPath: null,
  };

  const valueAfter = (index, option) => {
    const value = argv[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`${option} requires a value.`);
    return value;
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '-h' || arg === '--help') {
      args.help = true;
    } else if (arg === '--force') {
      args.force = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--clients') {
      args.clients = valueAfter(i, arg).split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
      i += 1;
    } else if (arg.startsWith('--clients=')) {
      args.clients = arg.slice('--clients='.length).split(',').map((v) => v.trim().toLowerCase()).filter(Boolean);
    } else if (arg === '--scope') {
      args.scope = valueAfter(i, arg).trim().toLowerCase();
      i += 1;
    } else if (arg.startsWith('--scope=')) {
      args.scope = arg.slice('--scope='.length).trim().toLowerCase();
    } else if (arg === '--repo') {
      args.repository = valueAfter(i, arg).trim();
      i += 1;
    } else if (arg.startsWith('--repo=')) {
      args.repository = arg.slice('--repo='.length).trim();
    } else if (arg === '--ref') {
      args.ref = valueAfter(i, arg).trim();
      i += 1;
    } else if (arg.startsWith('--ref=')) {
      args.ref = arg.slice('--ref='.length).trim();
    } else if (arg === '--local-source') {
      args.localSource = valueAfter(i, arg).trim();
      i += 1;
    } else if (arg.startsWith('--local-source=')) {
      args.localSource = arg.slice('--local-source='.length).trim();
    } else if (arg === '--skills-path') {
      args.skillsPath = valueAfter(i, arg).trim();
      i += 1;
    } else if (arg.startsWith('--skills-path=')) {
      args.skillsPath = arg.slice('--skills-path='.length).trim();
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  if (args.clients) {
    const invalid = args.clients.filter((client) => !CLIENTS[client]);
    if (invalid.length) throw new Error(`Unknown client(s): ${invalid.join(', ')}`);
    args.clients = [...new Set(args.clients)];
    if (!args.clients.length) throw new Error('Select at least one client.');
  }

  if (args.scope && !['project', 'user'].includes(args.scope)) {
    throw new Error(`Unknown scope: ${args.scope}. Use project or user.`);
  }

  return args;
}

function loadSettings(args) {
  if (!fs.existsSync(settingsPath)) throw new Error(`Installer settings not found: ${settingsPath}`);
  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid installer.config.json: ${error.message}`);
  }

  const source = settings.source || {};
  const localSourceValue = args.localSource || process.env.AGENT_SKILLS_LOCAL_SOURCE || null;
  const localSource = localSourceValue ? path.resolve(process.cwd(), localSourceValue) : null;
  const repository = args.repository || process.env.AGENT_SKILLS_REPOSITORY || source.repository;
  const ref = args.ref || process.env.AGENT_SKILLS_REF || source.ref || 'main';
  const skillsPath = args.skillsPath || process.env.AGENT_SKILLS_PATH || source.skillsPath || 'skills';

  if (!localSource && (!repository || /YOUR_ORG|YOUR_REPO/.test(repository))) {
    throw new Error('Configure source.repository in installer.config.json, or pass --repo / AGENT_SKILLS_REPOSITORY. For development, use --local-source.');
  }
  if (!localSource && !ref) throw new Error('Source ref cannot be empty.');
  if (!skillsPath || path.isAbsolute(skillsPath) || skillsPath.split(/[\\/]+/).includes('..')) {
    throw new Error('skillsPath must be a safe relative path inside the source repository.');
  }
  if (localSource && (!fs.existsSync(localSource) || !fs.statSync(localSource).isDirectory())) {
    throw new Error(`Local source directory not found: ${localSource}`);
  }

  return {
    repository: localSource ? `local:${localSource}` : repository,
    ref: localSource ? 'working-tree' : ref,
    localSource,
    skillsPath,
    preferSharedPathForMultipleClients: settings.install?.preferSharedPathForMultipleClients !== false,
  };
}

function ensureInteractive() {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Interactive selection requires a TTY. Use --clients and --scope in non-interactive environments.');
  }
}

async function chooseMany(message, options) {
  ensureInteractive();
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  let cursor = 0;
  const selected = new Set();
  const lineCount = options.length + 2;
  let firstRender = true;

  const render = () => {
    if (!firstRender) process.stdout.write(`\x1b[${lineCount}A`);
    firstRender = false;
    process.stdout.write(`${message}\x1b[K\n`);
    for (let i = 0; i < options.length; i += 1) {
      const option = options[i];
      const pointer = i === cursor ? '›' : ' ';
      const mark = selected.has(option.value) ? '◉' : '◯';
      process.stdout.write(`${pointer} ${mark} ${option.label}\x1b[K\n`);
    }
    process.stdout.write('  ↑/↓ move • Space toggle • Enter confirm\x1b[K\n');
  };

  render();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      process.stdin.off('keypress', onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    const onKeypress = (_str, key) => {
      if (key?.ctrl && key.name === 'c') {
        cleanup();
        process.stdout.write('\n');
        reject(new Error('Installation cancelled.'));
        return;
      }
      if (key?.name === 'up') {
        cursor = (cursor - 1 + options.length) % options.length;
        render();
      } else if (key?.name === 'down') {
        cursor = (cursor + 1) % options.length;
        render();
      } else if (key?.name === 'space') {
        const value = options[cursor].value;
        selected.has(value) ? selected.delete(value) : selected.add(value);
        render();
      } else if (key?.name === 'return' || key?.name === 'enter') {
        if (selected.size === 0) {
          process.stdout.write('\x07');
          return;
        }
        cleanup();
        resolve(options.filter((option) => selected.has(option.value)).map((option) => option.value));
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}

async function chooseOne(message, options) {
  ensureInteractive();
  readline.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);
  process.stdin.resume();

  let cursor = 0;
  const lineCount = options.length + 2;
  let firstRender = true;

  const render = () => {
    if (!firstRender) process.stdout.write(`\x1b[${lineCount}A`);
    firstRender = false;
    process.stdout.write(`${message}\x1b[K\n`);
    for (let i = 0; i < options.length; i += 1) {
      const pointer = i === cursor ? '›' : ' ';
      process.stdout.write(`${pointer} ${options[i].label}\x1b[K\n`);
    }
    process.stdout.write('  ↑/↓ move • Enter confirm\x1b[K\n');
  };

  render();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      process.stdin.off('keypress', onKeypress);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    const onKeypress = (_str, key) => {
      if (key?.ctrl && key.name === 'c') {
        cleanup();
        process.stdout.write('\n');
        reject(new Error('Installation cancelled.'));
        return;
      }
      if (key?.name === 'up') {
        cursor = (cursor - 1 + options.length) % options.length;
        render();
      } else if (key?.name === 'down') {
        cursor = (cursor + 1) % options.length;
        render();
      } else if (key?.name === 'return' || key?.name === 'enter') {
        cleanup();
        resolve(options[cursor].value);
      }
    };

    process.stdin.on('keypress', onKeypress);
  });
}

async function confirm(message) {
  ensureInteractive();
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise((resolve) => rl.question(`${message} [y/N] `, resolve));
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    rl.close();
  }
}

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

function fetchRepository(source) {
  if (source.localSource) {
    const repoDir = source.localSource;
    let commit = 'local-working-tree';
    const probe = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: repoDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    if (probe.status === 0) {
      const head = probe.stdout.trim();
      const status = spawnSync('git', ['status', '--porcelain'], { cwd: repoDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
      commit = `${head}${status.status === 0 && status.stdout.trim() ? '-dirty' : ''}`;
    }

    console.log(`\nUsing local skills working tree: ${repoDir}`);
    return { tempRoot: null, repoDir, commit };
  }

  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'shared-agent-skills-'));
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

function discoverSkills(repoDir, skillsPath) {
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

function buildPlan(clients, scope, cwd, skills, preferShared) {
  const roots = rootsFor(clients, scope, cwd, preferShared);
  return roots.flatMap((target) => skills.map((skill) => ({
    ...target,
    skill: skill.name,
    source: skill.source,
    destination: path.join(target.root, skill.name),
  })));
}

function printPlan(plan, scope, source, commit) {
  console.log('\nInstall plan');
  console.log(`Source: ${source.repository}`);
  console.log(`Resolved commit: ${commit}`);
  console.log(`Skills path: ${source.skillsPath}`);
  console.log(`Scope: ${scope === 'project' ? 'Current project' : 'User root / global'}\n`);

  const roots = new Map();
  for (const item of plan) roots.set(item.root, item.label);
  for (const [root, label] of roots) console.log(`  ${label}: ${root}`);
  console.log('');
}

function writeProvenance(plan, source, commit) {
  const roots = [...new Set(plan.map((item) => item.root))];
  const skillNames = [...new Set(plan.map((item) => item.skill))].sort();
  const payload = {
    schemaVersion: 1,
    source: {
      repository: source.repository,
      requestedRef: source.ref,
      commit,
      skillsPath: source.skillsPath,
    },
    installedSkills: skillNames,
    installedAt: new Date().toISOString(),
  };

  for (const root of roots) {
    fs.mkdirSync(root, { recursive: true });
    fs.writeFileSync(path.join(root, '.shared-agent-skills.lock.json'), `${JSON.stringify(payload, null, 2)}\n`);
  }
}

function install(plan, { dryRun, source, commit }) {
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
  if (!dryRun) writeProvenance(plan, source, commit);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const source = loadSettings(args);
  const cwd = process.cwd();
  const clients = args.clients || await chooseMany('Select target client providers:', [
    { value: 'codex', label: 'Codex' },
    { value: 'github', label: 'GitHub Copilot' },
    { value: 'opencode', label: 'OpenCode' },
  ]);

  const scope = args.scope || await chooseOne('Where should the skills be installed?', [
    { value: 'project', label: `Current project (${cwd})` },
    { value: 'user', label: `User root / global (${os.homedir()})` },
  ]);

  const fetched = fetchRepository(source);
  try {
    const skills = discoverSkills(fetched.repoDir, source.skillsPath);
    const plan = buildPlan(clients, scope, cwd, skills, source.preferSharedPathForMultipleClients);
    printPlan(plan, scope, source, fetched.commit);

    const conflicts = plan.filter((item) => fs.existsSync(item.destination));
    if (conflicts.length && !args.force && !args.dryRun) {
      console.log('Existing skill directories that would be replaced:');
      for (const item of conflicts) console.log(`  ${item.destination}`);
      const approved = await confirm('Replace these existing skills?');
      if (!approved) throw new Error('Installation cancelled; no skill files were changed.');
    }

    install(plan, { dryRun: args.dryRun, source, commit: fetched.commit });
    console.log(args.dryRun ? '\nDry run complete.' : '\nDone.');
  } finally {
    if (fetched.tempRoot) fs.rmSync(fetched.tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exitCode = 1;
});
