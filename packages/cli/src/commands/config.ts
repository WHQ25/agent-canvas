import { getConfigValue, setConfigValue, resetConfigValue, listConfig, VALID_KEYS, DEFAULTS } from '../lib/config.js';

export function configSet(key: string, value: string): void {
  const num = parseInt(value, 10);
  if (isNaN(num)) {
    console.error(`Error: "${value}" is not a valid number`);
    process.exit(1);
  }
  try {
    setConfigValue(key, num);
    console.log(`Set ${key} = ${num}`);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}

export function configGet(key: string): void {
  if (!VALID_KEYS.includes(key)) {
    console.error(`Unknown config key: ${key}. Valid keys: ${VALID_KEYS.join(', ')}`);
    process.exit(1);
  }
  const val = getConfigValue(key);
  if (val !== undefined) {
    console.log(`${key} = ${val} (config)`);
  } else {
    console.log(`${key} = ${DEFAULTS[key]} (default)`);
  }
}

export function configList(): void {
  const entries = listConfig();
  for (const [key, { value, source }] of Object.entries(entries)) {
    console.log(`${key} = ${value} (${source})`);
  }
}

export function configReset(key: string): void {
  try {
    resetConfigValue(key);
    console.log(`Reset ${key} to default (${DEFAULTS[key]})`);
  } catch (e) {
    console.error(`Error: ${(e as Error).message}`);
    process.exit(1);
  }
}
