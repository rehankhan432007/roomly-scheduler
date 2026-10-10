// Knex config file for CLI usage
import type { Knex } from 'knex';
import dotenv from 'dotenv';
dotenv.config();

const config: Knex.Config = {
  client: 'mysql2',
  connection: {
    host: process.env.MYSQL_HOST ?? 'localhost',
    port: Number(process.env.MYSQL_PORT ?? 3306),
    user: process.env.MYSQL_USER ?? 'meetmaze',
    password: process.env.MYSQL_PASSWORD ?? 'meetmaze',
    database: process.env.MYSQL_DATABASE ?? 'meetmaze',
  },
  migrations: {
    directory: '../db/migrations',
    extension: 'ts',
  },
  seeds: {
    directory: '../db/seeds',
    extension: 'ts',
  },
};

export default config;
