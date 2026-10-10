import { db, logger } from '../src/core/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    logger.warn('Resetting database...');
    // Drop all tables
    const tables = [
      'notifications', 'chat_messages', 'chat_sessions', 'slot_demand_stats',
      'room_stats', 'room_issues', 'reviews', 'booking_participants', 'bookings',
      'room_blackouts', 'room_equipment', 'equipment_types', 'rooms', 'locations', 'users'
    ];
    for (const table of tables) {
      await db.raw(`DROP TABLE IF EXISTS ${table}`);
    }
    
    // Rerun migrations
    await db.migrate.latest({
      directory: path.join(__dirname, 'migrations'),
      extension: 'ts',
      loadExtensions: ['.ts']
    });
    logger.info('Migrations applied successfully');
    
  } catch (err) {
    logger.error({ err }, 'Reset failed');
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
