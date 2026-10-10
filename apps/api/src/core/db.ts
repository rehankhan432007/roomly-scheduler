import knex from 'knex';
import { config } from './config.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const db = knex({
  client: config.db.client,
  connection: config.db.client === 'sqlite3' ? {
    filename: path.resolve(__dirname, '../../dev.sqlite3')
  } : {
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    dateStrings: true,
  },
  useNullAsDefault: config.db.client === 'sqlite3',
  pool: config.db.client === 'sqlite3' ? { min: 1, max: 1 } : { min: 2, max: 10 },
  migrations: {
    directory: path.resolve(__dirname, '../../db/migrations'),
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
  seeds: {
    directory: path.resolve(__dirname, '../../db/seeds'),
    extension: 'ts',
    loadExtensions: ['.ts'],
  },
});

// CLI runner for migrate/seed/reset
if (process.argv[2]) {
  const cmd = process.argv[2];
  if (cmd === 'migrate') {
    await db.migrate.latest();
    console.log('Migrations done');
  } else if (cmd === 'seed') {
    await db.seed.run();
    console.log('Seeds done');
  } else if (cmd === 'reset') {
    await db.migrate.rollback(undefined, true);
    await db.migrate.latest();
    await db.seed.run();
    console.log('Reset done');
  }
  await db.destroy();
}
