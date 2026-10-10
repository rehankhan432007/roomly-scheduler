import type { ModuleContext } from '@meetmaze/shared/contracts';
import { requireRole } from '../../../core/auth.js';
import { validate } from '../../../core/middleware.js';
import { SearchCriteriaSchema } from '@meetmaze/shared/modules/booking';
import { createSearchService } from '../service/search.service.js';
import { ApiError } from '@meetmaze/shared/core';

export function mountSearchRoutes(ctx: ModuleContext): void {
  const { router, db, services } = ctx;

  const getSearchSvc = () => createSearchService(
    db,
    () => services.get('rooms'),
    () => services.get('bookings'),
    () => services.get('insights'),
    () => services.get('ranking')
  );

  // POST /search/rooms
  router.post('/search/rooms', requireRole('CLIENT'), validate({ body: SearchCriteriaSchema }), async (req, res, next) => {
    try {
      const svc = getSearchSvc();
      const result = await svc.searchRooms(req.body, { userId: req.user!.sub });
      res.json({ success: true, data: result });
    } catch (e) { next(e); }
  });

  // GET /rooms/:id/availability
  router.get('/rooms/:id/availability', requireRole('CLIENT'), async (req, res, next) => {
    try {
      const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new ApiError(400, 'VALIDATION_ERROR', 'date must be YYYY-MM-DD');
      }
      const svc = getSearchSvc();
      const slots = await svc.getAvailability(req.params.id, date);
      res.json({ success: true, data: slots });
    } catch (e) { next(e); }
  });
}
