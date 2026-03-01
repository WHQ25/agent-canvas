import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

const CONFIG_DIR = join(homedir(), '.agent-canvas');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

const DEFAULTS: Record<string, number> = {
  port: 39820,
  'http-port': 39821,
};

const VALID_KEYS = Object.keys(DEFAULTS);

export interface AgentCanvasConfig {
  port?: number;
  'http-port'?: number;
}

function readConfig(): AgentCanvasConfig {
  try {
    if (existsSync(CONFIG_FILE)) {
      return JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
    }
  } catch {
    // ignore
  }
  return {};
}

function writeConfig(config: AgentCanvasConfig): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
}

export function getConfigValue(key: string): number | undefined {
  return readConfig()[key as keyof AgentCanvasConfig];
}

export function setConfigValue(key: string, value: number): void {
  if (!VALID_KEYS.includes(key)) {
    throw new Error(`Unknown config key: ${key}. Valid keys: ${VALID_KEYS.join(', ')}`);
  }
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('Port must be an integer between 1 and 65535');
  }
  const config = readConfig();
  config[key as keyof AgentCanvasConfig] = value;
  writeConfig(config);
}

export function resetConfigValue(key: string): void {
  if (!VALID_KEYS.includes(key)) {
    throw new Error(`Unknown config key: ${key}. Valid keys: ${VALID_KEYS.join(', ')}`);
  }
  const config = readConfig();
  delete config[key as keyof AgentCanvasConfig];
  writeConfig(config);
}

export function listConfig(): Record<string, { value: number; source: string }> {
  const config = readConfig();
  const result: Record<string, { value: number; source: string }> = {};
  for (const key of VALID_KEYS) {
    const envKey = key === 'port' ? 'AGENT_CANVAS_WS_PORT' : 'AGENT_CANVAS_HTTP_PORT';
    const envVal = process.env[envKey];
    if (envVal) {
      result[key] = { value: parseInt(envVal, 10), source: `env ${envKey}` };
    } else if (config[key as keyof AgentCanvasConfig] !== undefined) {
      result[key] = { value: config[key as keyof AgentCanvasConfig]!, source: 'config' };
    } else {
      result[key] = { value: DEFAULTS[key], source: 'default' };
    }
  }
  return result;
}

export function getWsPort(): number {
  const envVal = process.env.AGENT_CANVAS_WS_PORT;
  if (envVal) return parseInt(envVal, 10);
  return getConfigValue('port') ?? DEFAULTS.port;
}

export function getHttpPort(): number {
  const envVal = process.env.AGENT_CANVAS_HTTP_PORT;
  if (envVal) return parseInt(envVal, 10);
  return getConfigValue('http-port') ?? DEFAULTS['http-port'];
}

export { VALID_KEYS, DEFAULTS };
