import knex from 'knex';
import { config } from './config.js';

export const db = knex({
  client: 'mysql2',
  connection: {
    host: config.mysql.host,
    port: config.mysql.port,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    typeCast(field: { type: string; string: () => string | null }, next: () => unknown) {
      if (field.type === 'TINY' || field.type === 'BIT') {
        return field.string() === '1';
      }
      return next();
    },
  },
  pool: { min: 2, max: 10 },
});
