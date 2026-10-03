import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { settingsPath } from './constants.js';

function isSafeRelative(value) {
  return Boolean(value) && !path.isAbsolute(value) && !value.split(/[\\/]+/).includes('..');
}

export function loadSettings(args) {
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
  const agentsPath = args.agentsPath || process.env.AGENT_SKILLS_AGENTS_PATH || source.agentsPath || 'agents';

  if (!localSource && (!repository || /YOUR_ORG|YOUR_REPO/.test(repository))) {
    throw new Error('Configure source.repository in installer.config.json, or pass --repo / AGENT_SKILLS_REPOSITORY. For development, use --local-source.');
  }
  if (!localSource && !ref) throw new Error('Source ref cannot be empty.');
  if (!isSafeRelative(skillsPath)) {
    throw new Error('skillsPath must be a safe relative path inside the source repository.');
  }
  if (!isSafeRelative(agentsPath)) {
    throw new Error('agentsPath must be a safe relative path inside the source repository.');
  }
  if (localSource && (!fs.existsSync(localSource) || !fs.statSync(localSource).isDirectory())) {
    throw new Error(`Local source directory not found: ${localSource}`);
  }

  return {
    repository: localSource ? `local:${localSource}` : repository,
    ref: localSource ? 'working-tree' : ref,
    localSource,
    skillsPath,
    agentsPath,
    preferSharedPathForMultipleClients: settings.install?.preferSharedPathForMultipleClients !== false,
    registerAgentsInInstructions: settings.install?.registerAgentsInInstructions !== false,
  };
}
