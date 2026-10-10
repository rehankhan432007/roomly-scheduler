// Search service stub
import type { SearchService, SearchResponse, SlotDto, ModuleContext } from '@meetmaze/shared/contracts';

export function createSearchStub(ctx: ModuleContext): SearchService {
  const log = ctx.logger;
  return {
    async searchRooms(criteria, actor) {
      log.info(`[STUB] search.searchRooms`);
      return { matches: [], alternatives: [], busyWarning: null, participantConflicts: [] };
    },
    async getAvailability(roomId, dateIso) {
      log.info(`[STUB] search.getAvailability(${roomId}, ${dateIso})`);
      const slots: SlotDto[] = [];
      for (let h = 9; h < 19; h++) {
        slots.push({
          startAt: `${dateIso}T${String(h).padStart(2, '0')}:00:00.000Z`,
          endAt: `${dateIso}T${String(h).padStart(2, '0')}:30:00.000Z`,
          state: 'FREE',
        });
        slots.push({
          startAt: `${dateIso}T${String(h).padStart(2, '0')}:30:00.000Z`,
          endAt: `${dateIso}T${String(h + 1).padStart(2, '0')}:00:00.000Z`,
          state: 'FREE',
        });
      }
      return slots;
    },
  };
}
