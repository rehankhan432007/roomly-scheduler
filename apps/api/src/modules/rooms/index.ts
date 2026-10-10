import type { ApiModule } from '@meetmaze/shared/contracts';
import { RoomsRepository } from './repository.js';
import { RoomsServiceImpl } from './service.js';
import { createRoomRoutes } from './routes.js';

const roomsModule: ApiModule = {
  name: 'rooms',
  part: 2,
  provides: ['rooms'],
  requires: ['notifications'],

  async register(ctx) {
    const repo = new RoomsRepository(ctx.db);
    const service = new RoomsServiceImpl(repo, ctx.services);

    // Provide the rooms service for other parts
    ctx.services.provide('rooms', service);

    // Mount routes
    const webUrl = (ctx.config as Record<string, unknown>).webUrl as string || 'http://localhost:3000';
    const routes = createRoomRoutes(repo, webUrl);
    ctx.router.use(routes);
  },
};

export default roomsModule;
