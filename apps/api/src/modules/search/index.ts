import type { ApiModule } from '@meetmaze/shared/contracts';
import { mountSearchRoutes } from './routes/search.routes.js';
import { createSearchService } from './service/search.service.js';

const searchModule: ApiModule = {
  name: 'search',
  part: 3,
  provides: ['search'],
  requires: ['rooms', 'bookings', 'insights', 'ranking'],

  async register(ctx) {
    const { db, services } = ctx;

    // Mount routes
    mountSearchRoutes(ctx);

    // Provide SearchService
    const svc = createSearchService(
      db,
      () => services.get('rooms'),
      () => services.get('bookings'),
      () => services.get('insights'),
      () => services.get('ranking')
    );
    services.provide('search', svc);
  },
};

export default searchModule;
