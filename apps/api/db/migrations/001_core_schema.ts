import type { Knex } from 'knex';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function up(knex: Knex): Promise<void> {
  const sql = fs.readFileSync(path.join(__dirname, '001_core_schema.sql'), 'utf-8');
  await knex.raw(sql);
}

export async function down(knex: Knex): Promise<void> {
  // Dangerous down migration, drop all tables.
  const tables = [
    'notifications', 'chat_messages', 'chat_sessions', 'slot_demand_stats',
    'room_stats', 'room_issues', 'reviews', 'booking_participants', 'bookings',
    'room_blackouts', 'room_equipment', 'equipment_types', 'rooms', 'locations', 'users'
  ];
  for (const table of tables) {
    await knex.raw(`DROP TABLE IF EXISTS ${table}`);
  }
}
