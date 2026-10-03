import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { agentFormatsPath } from './constants.js';
import { parseYaml, serializeToml, serializeYaml, splitFrontmatter } from './serialize.js';

export function loadAgentFormats() {
  if (!fs.existsSync(agentFormatsPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(agentFormatsPath, 'utf8'));
  } catch (error) {
    throw new Error(`Invalid agent-formats.json: ${error.message}`);
  }
}

export function discoverAgents(repoDir, agentsPath) {
  const agentsRoot = path.resolve(repoDir, agentsPath);
  if (!fs.existsSync(agentsRoot) || !fs.statSync(agentsRoot).isDirectory()) return [];
  return fs.readdirSync(agentsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => ({ name: entry.name, source: path.join(agentsRoot, entry.name) }))
    .filter((agent) => fs.existsSync(path.join(agent.source, 'AGENT.md')));
}

export function resolveLocation(location, cwd) {
  if (location.startsWith('~/')) return path.join(os.homedir(), location.slice(2));
  if (location.startsWith('~')) return path.join(os.homedir(), location.slice(1));
  return path.resolve(cwd, location);
}

export function agentCatalog(agents) {
  return agents.map((agent) => {
    const raw = fs.readFileSync(path.join(agent.source, 'AGENT.md'), 'utf8');
    const { frontmatter } = splitFrontmatter(raw);
    const data = parseYaml(frontmatter);
    return { name: data.name || agent.name, description: data.description || '' };
  });
}

function mapFields(data, fieldMap, modelOverride) {
  const mapped = {};
  for (const [canonical, target] of Object.entries(fieldMap)) {
    if (target === '@body' || target === '@filename') continue;
    if (data[canonical] === undefined || data[canonical] === null) continue;
    mapped[target] = data[canonical];
  }
  if (modelOverride && fieldMap.model) mapped[fieldMap.model] = modelOverride;
  return mapped;
}

function serializeAgent(vendor, mapped, instructions) {
  const bodyKey = vendor.bodyKey || '@body';
  if (vendor.format === 'toml') {
    const out = { ...mapped };
    if (bodyKey !== '@body') out[bodyKey] = instructions;
    return serializeToml(out);
  }
  const yaml = serializeYaml(mapped);
  return `---\n${yaml}${yaml ? '\n' : ''}---\n\n${instructions}\n`;
}

export function transformAgent(agent, client, formats, modelOverride) {
  const vendor = formats.vendors[client];
  if (!vendor) throw new Error(`No agent format configured for client: ${client}`);

  const raw = fs.readFileSync(path.join(agent.source, 'AGENT.md'), 'utf8');
  const { frontmatter, body } = splitFrontmatter(raw);
  const data = parseYaml(frontmatter);
  const name = data.name || agent.name;
  const fieldMap = vendor.fieldMap || {};

  const mapped = mapFields(data, fieldMap, modelOverride);
  const instructions = data.prompt && fieldMap.prompt && fieldMap.prompt !== '@body'
    ? String(data.prompt)
    : body.trim();

  const filename = vendor.filename.replace('{name}', name);
  const content = serializeAgent(vendor, mapped, instructions);

  return { name, filename, content };
}

function agentTargets(clients, scope, cwd, formats) {
  return clients.map((client) => {
    const vendor = formats.vendors[client];
    const root = resolveLocation(vendor.locations[scope === 'project' ? 'project' : 'user'], cwd);
    return { client, label: vendor.label, root };
  });
}

export function buildAgentPlan(clients, scope, cwd, agents, formats, modelOverride) {
  if (!agents.length || !formats) return [];
  const targets = agentTargets(clients, scope, cwd, formats);
  const plan = [];
  for (const target of targets) {
    for (const agent of agents) {
      const transformed = transformAgent(agent, target.client, formats, modelOverride);
      plan.push({
        ...target,
        agent: agent.name,
        source: agent.source,
        filename: transformed.filename,
        destination: path.join(target.root, transformed.filename),
        content: transformed.content,
      });
    }
  }
  return plan;
}
