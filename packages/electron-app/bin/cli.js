#!/usr/bin/env node

import { spawn } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Find electron executable
const electronPath = require('electron');

// Path to our main.js
const mainPath = resolve(__dirname, '../dist/main/index.js');

// Start electron with our app
const child = spawn(electronPath, [mainPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    ELECTRON_APP_PATH: resolve(__dirname, '..'),
  },
});

child.on('close', (code) => {
  process.exit(code ?? 0);
});
