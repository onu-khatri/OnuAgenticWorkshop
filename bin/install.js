#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import process from 'node:process';
import { parseArgs, usage } from './installers/args.js';
import { loadSettings } from './installers/settings.js';
import { chooseMany, chooseOne, confirm, promptText } from './installers/prompts.js';
import { fetchRepository } from './installers/source.js';
import { buildPlan, discoverSkills } from './installers/skills.js';
import { buildAgentPlan, discoverAgents, loadAgentFormats } from './installers/agents.js';
import { install, printPlan } from './installers/install.js';

const CLIENT_OPTIONS = [
  { value: 'claude', label: 'Claude Code' },
  { value: 'codex', label: 'Codex' },
  { value: 'github', label: 'GitHub Copilot' },
  { value: 'opencode', label: 'OpenCode' },
];

const isInteractive = () => process.stdin.isTTY && process.stdout.isTTY;

async function resolveClients(args) {
  return args.clients || await chooseMany('Select target client providers:', CLIENT_OPTIONS);
}

async function resolveScope(args, cwd) {
  return args.scope || await chooseOne('Where should the skills be installed?', [
    { value: 'project', label: `Current project (${cwd})` },
    { value: 'user', label: `User root / global (${os.homedir()})` },
  ]);
}

async function resolveAgents(args) {
  if (args.agents !== null) return args.agents;
  return isInteractive() ? await confirm('Also install agents?') : false;
}

async function resolveModel(args, wantAgents) {
  if (args.model !== null) return args.model;
  if (!wantAgents || !isInteractive()) return null;
  const answer = await promptText('Agent model override (optional, leave blank to omit):');
  return answer.trim() || null;
}

function buildAgentInstallation(fetched, source, clients, scope, cwd, wantAgents, modelOverride) {
  if (!wantAgents) return [];
  const formats = loadAgentFormats();
  if (!formats) return [];
  const agents = discoverAgents(fetched.repoDir, source.agentsPath);
  return buildAgentPlan(clients, scope, cwd, agents, formats, modelOverride);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    usage();
    return;
  }

  const source = loadSettings(args);
  const cwd = process.cwd();

  const clients = await resolveClients(args);
  const scope = await resolveScope(args, cwd);
  const wantAgents = await resolveAgents(args);
  const modelOverride = await resolveModel(args, wantAgents);

  const fetched = fetchRepository(source);
  try {
    const skills = discoverSkills(fetched.repoDir, source.skillsPath);
    const plan = buildPlan(clients, scope, cwd, skills, source.preferSharedPathForMultipleClients);
    const agentPlan = buildAgentInstallation(fetched, source, clients, scope, cwd, wantAgents, modelOverride);

    printPlan(plan, agentPlan, scope, source, fetched.commit);

    const conflicts = [...plan, ...agentPlan].filter((item) => fs.existsSync(item.destination));
    if (conflicts.length && !args.force && !args.dryRun) {
      console.log('Existing skills or agents that would be replaced:');
      for (const item of conflicts) console.log(`  ${item.destination}`);
      const approved = await confirm('Replace these existing files?');
      if (!approved) throw new Error('Installation cancelled; no files were changed.');
    }

    install(plan, agentPlan, { dryRun: args.dryRun, source, commit: fetched.commit });
    console.log(args.dryRun ? '\nDry run complete.' : '\nDone.');
  } finally {
    if (fetched.tempRoot) fs.rmSync(fetched.tempRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  process.exitCode = 1;
});
