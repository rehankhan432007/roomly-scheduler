import type { RankingService, RoomSignals, ModuleContext } from '@meetmaze/shared/contracts';

export function createRankingStub(ctx: ModuleContext): RankingService {
  const log = ctx.logger;
  return {
    async getSignals(roomIds) {
      log.info(`[STUB] ranking.getSignals(${roomIds.length} rooms)`);
      const result: Record<string, RoomSignals> = {};
      for (const id of roomIds) {
        result[id] = { roomId: id, avgRating: null, bayesRating: null, reviewCount: 0, openIssues: 0, noShowRate: 0, utilizationPct: 0 };
      }
      return result;
    },
    async recomputeRoom(roomId) { log.info(`[STUB] ranking.recomputeRoom(${roomId})`); },
  };
}
