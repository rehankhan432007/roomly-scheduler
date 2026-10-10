import { createApp } from './app.js';
import { config } from './config.js';
import { logger } from './logger.js';

async function main() {
  const { app } = await createApp();
  app.listen(config.apiPort, () => {
    logger.info(`MeetMaze API running on http://localhost:${config.apiPort}`);
    logger.info(`Stubs enabled: ${config.enableDevStubs}`);
  });
}

main().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
