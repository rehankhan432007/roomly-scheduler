import knex, { Knex } from 'knex';
import { config } from './config.js';

let _db: Knex | null = null;

export function getDb(): Knex {
  if (!_db) {
    _db = knex({
      client: 'mysql2',
      connection: {
        host: config.mysql.host,
        port: config.mysql.port,
        user: config.mysql.user,
        password: config.mysql.password,
        database: config.mysql.database,
        typeCast(field: any, next: any) {
          if (field.type === 'TINY' && field.length === 1) return field.string() === '1';
          if (field.type === 'JSON') {
            const val = field.string();
            try { return val ? JSON.parse(val) : null; } catch { return val; }
          }
          return next();
        },
      },
      pool: { min: 2, max: 10 },
    });
  }
  return _db;
}

export async function pingDb(): Promise<boolean> {
  try {
    await getDb().raw('SELECT 1');
    return true;
  } catch {
    return false;
  }
}
