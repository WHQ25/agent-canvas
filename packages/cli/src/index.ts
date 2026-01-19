import { Command } from 'commander';
import { start } from './commands/start';

const program = new Command();

program
  .name('canvas')
  .description('CLI for Agent Canvas - Excalidraw interface for AI agents')
  .version('0.1.0');

program
  .command('start')
  .description('Start the canvas app and establish connection')
  .action(async () => {
    await start();
  });

program.parse();
