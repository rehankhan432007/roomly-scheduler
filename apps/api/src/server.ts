import { createApp } from './core/app.js';
import { config } from './core/config.js';
import { logger } from './core/logger.js';
import { modules } from './core/modules.generated.js';

async function main() {
  try {
    const app = await createApp(modules);
    app.listen(config.apiPort, () => {
      logger.info(`MeetMaze API running on http://localhost:${config.apiPort}`);
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

main();
