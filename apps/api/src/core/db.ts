// Database connection via Knex
import knex, { type Knex } from 'knex';
import { config } from './config.js';

export const db: Knex = knex({
  client: 'mysql2',
  connection: {
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DATABASE,
    typeCast(field: { type: string; string: () => string | null }, next: () => unknown) {
      if (field.type === 'TINY' || field.type === 'BIT') {
        const val = field.string();
        return val ? val === '1' : null;
      }
      return next();
    },
  },
  pool: { min: 2, max: 10 },
  migrations: {
    directory: './db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './db/seeds',
    extension: 'ts',
  },
});

export async function checkDbConnection(): Promise<boolean> {
  try {
    await db.raw('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
