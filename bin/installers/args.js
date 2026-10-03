import { CLIENTS } from './constants.js';

const DEFAULT_ARGS = {
  clients: null,
  scope: null,
  force: false,
  dryRun: false,
  agents: null,
  model: null,
  registerAgents: null,
  repository: null,
  ref: null,
  localSource: null,
  skillsPath: null,
  agentsPath: null,
};

export function usage() {
  console.log(`OnuAgenticWorkshop installer

Usage:
  npx onu-agentic-workshop
  npx onu-agentic-workshop --clients claude,codex,github,opencode --scope project

Source options (override installer.config.json):
  --repo <git-url>      Skills Git repository URL/path
  --ref <git-ref>       Branch, tag, or commit (default from settings)
  --local-source <path> Read skills directly from a local working tree (development)
  --skills-path <path>  Skills directory inside source repository
  --agents-path <path>  Agents directory inside source repository

Install options:
  --clients <list>      Comma-separated: claude,codex,github,opencode
  --scope <scope>       project | user
  --force               Overwrite existing skill directories without prompting
  --agents              Also install agents (default: ask interactively)
  --no-agents           Skip agent installation
  --register-agents     Register installed agents in the vendor instruction file
  --no-register-agents  Do not register agents in the instruction file
  --model <id>          Model to set on generated agents (leave blank to omit)
  --dry-run             Fetch and show the plan without writing skill files
  -h, --help            Show this help

Environment overrides:
  AGENT_SKILLS_REPOSITORY
  AGENT_SKILLS_REF
  AGENT_SKILLS_LOCAL_SOURCE
  AGENT_SKILLS_PATH
  AGENT_SKILLS_AGENTS_PATH

Interactive mode asks which clients to target (multi-select), then whether to
install in the current project or at the user/global level.`);
}

function parseList(value) {
  return value.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
}

export function parseArgs(argv) {
  const args = { ...DEFAULT_ARGS };

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
    } else if (arg === '--agents') {
      args.agents = true;
    } else if (arg === '--no-agents') {
      args.agents = false;
    } else if (arg === '--register-agents') {
      args.registerAgents = true;
    } else if (arg === '--no-register-agents') {
      args.registerAgents = false;
    } else if (arg === '--model') {
      args.model = valueAfter(i, arg).trim() || null;
      i += 1;
    } else if (arg.startsWith('--model=')) {
      args.model = arg.slice('--model='.length).trim() || null;
    } else if (arg === '--clients') {
      args.clients = parseList(valueAfter(i, arg));
      i += 1;
    } else if (arg.startsWith('--clients=')) {
      args.clients = parseList(arg.slice('--clients='.length));
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
    } else if (arg === '--agents-path') {
      args.agentsPath = valueAfter(i, arg).trim();
      i += 1;
    } else if (arg.startsWith('--agents-path=')) {
      args.agentsPath = arg.slice('--agents-path='.length).trim();
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  validateClients(args);
  validateScope(args);
  return args;
}

function validateClients(args) {
  if (!args.clients) return;
  const invalid = args.clients.filter((client) => !CLIENTS[client]);
  if (invalid.length) throw new Error(`Unknown client(s): ${invalid.join(', ')}`);
  args.clients = [...new Set(args.clients)];
  if (!args.clients.length) throw new Error('Select at least one client.');
}

function validateScope(args) {
  if (args.scope && !['project', 'user'].includes(args.scope)) {
    throw new Error(`Unknown scope: ${args.scope}. Use project or user.`);
  }
}
