import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
export async function up(knex) {
    const sql = readFileSync(join(__dirname, '001_core_schema.sql'), 'utf-8');
    // Split by semicolons and run each statement
    const statements = sql
        .split(';')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    for (const stmt of statements) {
        await knex.raw(stmt);
    }
}
export async function down(knex) {
    const tables = [
        'notifications', 'chat_messages', 'chat_sessions',
        'slot_demand_stats', 'room_stats', 'room_issues',
        'reviews', 'booking_participants', 'bookings',
        'room_blackouts', 'room_equipment', 'equipment_types',
        'rooms', 'locations', 'users',
    ];
    for (const table of tables) {
        await knex.raw(`DROP TABLE IF EXISTS \`${table}\``);
    }
}
//# sourceMappingURL=001_core_schema.js.map