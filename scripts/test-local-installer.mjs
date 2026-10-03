import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(__filename), '..');
const projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'onu-agentic-workshop-local-test-'));
const installer = path.join(repoRoot, 'bin', 'install.js');

try {
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

  const skill = path.join(projectDir, '.agents', 'skills', 'onu-skill-discovery', 'SKILL.md');
  const lock = path.join(projectDir, '.agents', 'skills', '.onu-agentic-workshop.lock.json');
  if (!fs.existsSync(skill)) throw new Error(`Expected installed skill was not created: ${skill}`);
  if (!fs.existsSync(lock)) throw new Error(`Expected provenance lock was not created: ${lock}`);

  const claudeAgent = path.join(projectDir, '.claude', 'agents', 'onu-code-reviewer.md');
  const codexAgent = path.join(projectDir, '.codex', 'agents', 'onu-code-reviewer.toml');
  const copilotAgent = path.join(projectDir, '.github', 'agents', 'onu-code-reviewer.agent.md');
  const opencodeAgent = path.join(projectDir, '.opencode', 'agent', 'onu-code-reviewer.md');
  if (!fs.existsSync(claudeAgent)) throw new Error(`Expected Claude Code agent was not created: ${claudeAgent}`);
  if (!fs.existsSync(codexAgent)) throw new Error(`Expected Codex agent was not created: ${codexAgent}`);
  if (!fs.existsSync(copilotAgent)) throw new Error(`Expected Copilot agent was not created: ${copilotAgent}`);
  if (!fs.existsSync(opencodeAgent)) throw new Error(`Expected OpenCode agent was not created: ${opencodeAgent}`);

  const codexToml = fs.readFileSync(codexAgent, 'utf8');
  if (!codexToml.includes('developer_instructions')) {
    throw new Error(`Codex agent was not serialized as TOML: ${codexAgent}`);
  }
  const copilotFrontmatter = fs.readFileSync(copilotAgent, 'utf8');
  if (!copilotFrontmatter.startsWith('---\n') || !copilotFrontmatter.includes('description:')) {
    throw new Error(`Copilot agent was not serialized as Markdown+YAML: ${copilotAgent}`);
  }

  const provenance = JSON.parse(fs.readFileSync(lock, 'utf8'));
  if (!String(provenance.source?.repository || '').startsWith('local:')) {
    throw new Error('Local development install did not record a local source.');
  }
  if (!Array.isArray(provenance.installedAgents) || !provenance.installedAgents.includes('onu-code-reviewer')) {
    throw new Error('Provenance lock did not record installed agents.');
  }

  console.log('Local working-tree installer test passed.');
} finally {
  fs.rmSync(projectDir, { recursive: true, force: true });
}
