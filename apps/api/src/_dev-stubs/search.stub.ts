import type { SearchService, SearchResponse, SearchCriteria, SlotDto, RoomMatch, ModuleContext } from '@meetmaze/shared/contracts';
import { seedRooms } from './rooms.stub.js';

export function createStub(ctx: ModuleContext): SearchService {
  const logger = ctx.logger as any;

  return {
    async searchRooms(criteria: SearchCriteria, _actor?: { userId: string }): Promise<SearchResponse> {
      logger.info(`[STUB] search.searchRooms(${criteria.attendeeCount} people)`);
      const matches: RoomMatch[] = seedRooms
        .filter(r => r.status === 'ACTIVE' && r.capacity >= criteria.attendeeCount)
        .map(r => {
          const reqEquip = criteria.requiredEquipment ?? [];
          const roomCodes = r.equipment.filter(e => e.status === 'WORKING').map(e => e.code);
          const missing = reqEquip.filter(c => !roomCodes.includes(c));
          const faulty = r.equipment.filter(e => e.status === 'FAULTY' && reqEquip.includes(e.code)).map(e => e.code);

          const capScore = Math.min(25, Math.round(25 * (1 - Math.abs(r.capacity - criteria.attendeeCount) / r.capacity)));
          const eqScore = reqEquip.length > 0 ? Math.round(25 * (1 - missing.length / reqEquip.length)) : 25;
          const availScore = 25;
          const ratingScore = Math.round((r.avgRating ?? 7) / 10 * 15);
          const priceScore = Math.round(10 * (1 - Math.min(r.hourlyPrice / 3000, 1)));
          const vibeScore = (criteria.vibe && r.vibe === criteria.vibe) ? 5 : 0;
          const total = capScore + eqScore + availScore + ratingScore + priceScore + vibeScore;

          return {
            room: r,
            matchScore: total,
            matchReason: `${total}% match — capacity ${r.capacity}, ${missing.length === 0 ? 'all equipment available' : `missing: ${missing.join(', ')}`}`,
            breakdown: { capacity: capScore, equipment: eqScore, availability: availScore, rating: ratingScore, price: priceScore, vibe: vibeScore },
            availability: 'FREE' as const,
            missingEquipment: missing,
            faultyEquipment: faulty,
            warnings: faulty.length > 0 ? [`${faulty.join(', ')} reported as faulty`] : [],
          };
        })
        .sort((a, b) => b.matchScore - a.matchScore);

      return {
        matches: matches.slice(0, criteria.limit ?? 10),
        alternatives: [],
        busyWarning: null,
        participantConflicts: [],
      };
    },

    async getAvailability(roomId: string, dateIso: string): Promise<SlotDto[]> {
      logger.info(`[STUB] search.getAvailability(${roomId}, ${dateIso})`);
      const slots: SlotDto[] = [];
      for (let h = 9; h < 19; h++) {
        for (const half of [0, 30]) {
          const start = `${dateIso}T${String(h).padStart(2, '0')}:${String(half).padStart(2, '0')}:00.000Z`;
          const endH = half === 30 ? h + 1 : h;
          const endM = half === 30 ? 0 : 30;
          const end = `${dateIso}T${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}:00.000Z`;
          slots.push({ startAt: start, endAt: end, state: 'FREE' });
        }
      }
      return slots;
    },
  };
}
