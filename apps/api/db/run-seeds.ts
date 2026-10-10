import { db, logger } from '../src/core/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    const seedsDir = path.join(__dirname, 'seeds');
    if (!fs.existsSync(seedsDir)) {
      logger.info('No seeds directory found');
      return;
    }
    const files = fs.readdirSync(seedsDir).filter(f => f.endsWith('.ts')).sort();
    
    for (const file of files) {
      logger.info(`Running seed ${file}`);
      const seedModule = await import(path.join(seedsDir, file));
      await seedModule.seed(db);
    }
    logger.info('Seeds applied successfully');
  } catch (err) {
    logger.error({ err }, 'Seed failed');
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

run();
