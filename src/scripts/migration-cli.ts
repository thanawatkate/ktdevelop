#!/usr/bin/env node

/**
 * Migration CLI Helper
 * Used to manage database migrations
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const commands = {
  up: 'db-migrate up --env dev',
  down: 'db-migrate down --env dev',
  status: 'db-migrate db:version --env dev',
  prod: 'db-migrate up --env production',
  create: 'db-migrate create',
};

async function runMigration(cmd: string) {
  try {
    console.log(`\n📦 Running: ${cmd}\n`);
    const { stdout, stderr } = await execAsync(cmd);
    if (stdout) console.log(stdout);
    if (stderr) console.error(stderr);
    console.log(`\n✅ Migration completed!\n`);
  } catch (error: any) {
    console.error(`\n❌ Migration failed:\n${error.message}\n`);
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const command = args[0] as keyof typeof commands;

if (!command || !commands[command]) {
  console.log(`
Available commands:
  npm run db:migrate          - Run pending migrations (dev)
  npm run db:migrate:down     - Rollback last migration (dev)
  npm run db:migrate:status   - Show migration status (dev)
  npm run db:migrate:prod     - Run migrations (production)
  npm run db:migrate:create   - Create new migration file
  `);
  process.exit(0);
}

runMigration(commands[command]);
