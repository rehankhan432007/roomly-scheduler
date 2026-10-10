import { db, logger } from '../src/core/db.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    // Only run if not already migrated? This is a raw sql migration for now.
    // In a real setup, knex migrations would be used. But the contract says:
    // "each device runs 001_core_schema.sql through a knex migration 001_core_schema.ts"
    // Wait, the prompt says "001_core_schema.sql" is run through "001_core_schema.ts"
    // I created `001_core_schema.sql`, let me just create a script that runs it directly, or create the TS wrapper.
    
    // For simplicity, let's just use knex migration config.
    await db.migrate.latest({
      directory: path.join(__dirname, 'migrations'),
      extension: 'ts',
      loadExtensions: ['.ts']
    });
    logger.info('Migrations applied successfully');
  } catch (err) {
    logger.error({ err }, 'Migration failed');
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
