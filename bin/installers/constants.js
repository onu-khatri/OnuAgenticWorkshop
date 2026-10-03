import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const packageRoot = path.resolve(__dirname, '..', '..');
export const settingsPath = path.join(packageRoot, 'installer.config.json');
export const agentFormatsPath = path.join(packageRoot, 'agent-formats.json');

export const CLIENTS = {
  claude: {
    label: 'Claude Code',
    project: (cwd) => path.join(cwd, '.claude', 'skills'),
    user: () => path.join(os.homedir(), '.claude', 'skills'),
  },
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
