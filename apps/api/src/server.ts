import { createApp } from './core/app.js';
import { config } from './core/config.js';
import { logger } from './core/logger.js';

const { app } = await createApp();

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'MeetMaze API started');
});
