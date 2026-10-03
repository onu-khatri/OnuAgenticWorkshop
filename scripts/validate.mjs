import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CLIENTS } from '../bin/installers/constants.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function collectJs(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...collectJs(full));
    else if (/\.(js|mjs)$/.test(entry.name)) files.push(full);
  }
  return files;
}

function checkJs(file) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    const detail = (result.stderr || result.stdout || '').trim();
    throw new Error(`Syntax check failed for ${path.relative(root, file)}${detail ? `\n${detail}` : ''}`);
  }
}

function readJson(file) {
  const relative = path.relative(root, file);
  if (!fs.existsSync(file)) throw new Error(`Required file not found: ${relative}`);
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid JSON in ${relative}: ${error.message}`);
  }
}

function validateAgentFormats(formats) {
  const vendors = formats.vendors || {};
  const vendorKeys = Object.keys(vendors).sort();
  const clientKeys = Object.keys(CLIENTS).sort();
  if (JSON.stringify(vendorKeys) !== JSON.stringify(clientKeys)) {
    throw new Error(
      `Vendor mismatch: constants.js CLIENTS (${clientKeys.join(', ')}) must match agent-formats.json vendors (${vendorKeys.join(', ')}).`,
    );
  }

  for (const [name, vendor] of Object.entries(vendors)) {
    for (const key of ['label', 'format', 'extension', 'filename']) {
      if (!vendor[key]) throw new Error(`agent-formats.json vendor "${name}" is missing "${key}".`);
    }
    const locations = vendor.locations || {};
    if (!locations.project || !locations.user) {
      throw new Error(`agent-formats.json vendor "${name}" is missing project/user locations.`);
    }
    if (!vendor.fieldMap || typeof vendor.fieldMap !== 'object') {
      throw new Error(`agent-formats.json vendor "${name}" is missing its fieldMap.`);
    }
  }
}

function runPythonValidator() {
  const script = path.join('scripts', 'validate.py');
  for (const python of ['python3', 'python', 'py']) {
    const probe = spawnSync(python, ['--version'], { encoding: 'utf8' });
    if (probe.status !== 0) continue;
    const result = spawnSync(python, [script], { cwd: root, encoding: 'utf8', stdio: 'inherit' });
    if (result.status !== 0) process.exit(result.status ?? 1);
    return;
  }
  throw new Error('Python 3 was not found. Install Python to run skill/agent validation.');
}

function main() {
  const jsFiles = [...collectJs(path.join(root, 'bin')), ...collectJs(path.join(root, 'scripts'))];
  for (const file of jsFiles) checkJs(file);

  const settings = readJson(path.join(root, 'installer.config.json'));
  if (!settings.source) throw new Error('installer.config.json is missing the "source" block.');

  const formats = readJson(path.join(root, 'agent-formats.json'));
  validateAgentFormats(formats);

  runPythonValidator();
  console.log('All validation checks passed.');
}

try {
  main();
} catch (error) {
  console.error(`\nError: ${error.message}`);
  process.exitCode = 1;
}
