import type { ApiModule, ModuleContext, RankingService, RoomSignals } from '@meetmaze/shared/contracts';
import { generateId, BAYES_PRIOR_MEAN, BAYES_PRIOR_WEIGHT } from '@meetmaze/shared/core';
import { SEED_IDS } from '@meetmaze/shared/domain';

function createRankingService(ctx: ModuleContext): RankingService {
  const db = ctx.db;
  const logger = ctx.logger as any;

  return {
    async recomputeRoom(roomId: string): Promise<void> {
      logger.info({ roomId }, 'Recomputing room stats');

      // Review stats
      const reviewAgg = await db('reviews').where('room_id', roomId)
        .select(db.raw('COUNT(*) as review_count'), db.raw('AVG(rating) as avg_rating'), db.raw('SUM(rating) as sum_rating'));
      const { review_count, avg_rating, sum_rating } = reviewAgg[0];
      const n = Number(review_count) || 0;
      const avg = avg_rating ? Number(avg_rating) : null;
      const sum = sum_rating ? Number(sum_rating) : 0;

      // Bayesian rating = (sum + prior_weight * prior_mean) / (n + prior_weight)
      const bayesRating = n > 0 ? (sum + BAYES_PRIOR_WEIGHT * BAYES_PRIOR_MEAN) / (n + BAYES_PRIOR_WEIGHT) : null;

      // Booking stats
      const bookingCount = await db('bookings').where('room_id', roomId)
        .whereNotIn('status', ['CANCELLED']).count('* as count');
      const noShowCount = await db('bookings').where('room_id', roomId)
        .whereIn('status', ['RELEASED', 'NO_SHOW']).count('* as count');
      const openIssueCount = await db('room_issues').where('room_id', roomId)
        .where('status', 'OPEN').count('* as count');

      // Utilization (last 30 days)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const room = await db('rooms').where('id', roomId).first();
      let utilizationPct = 0;
      if (room) {
        const openHoursPerDay = (parseTime(room.close_time) - parseTime(room.open_time)) / 60;
        const openDays = (typeof room.open_days === 'string' ? JSON.parse(room.open_days) : room.open_days) as number[];
        const totalOpenMinutes = openDays.length * 30 * openHoursPerDay; // rough approximation

        const bookedMinutes = await db('bookings').where('room_id', roomId)
          .where('start_at', '>=', thirtyDaysAgo)
          .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'RELEASED', 'NO_SHOW'])
          .select(db.raw('SUM(TIMESTAMPDIFF(MINUTE, start_at, end_at)) as total'));
        const totalBooked = Number(bookedMinutes[0]?.total) || 0;

        utilizationPct = totalOpenMinutes > 0 ? Math.min(100, (totalBooked / totalOpenMinutes) * 100) : 0;
      }

      // Upsert room_stats
      const exists = await db('room_stats').where('room_id', roomId).first();
      const stats = {
        room_id: roomId,
        avg_rating: avg ? Number(avg.toFixed(2)) : null,
        bayes_rating: bayesRating ? Number(bayesRating.toFixed(2)) : null,
        review_count: n,
        booking_count: Number(bookingCount[0].count),
        no_show_count: Number(noShowCount[0].count),
        open_issue_count: Number(openIssueCount[0].count),
        utilization_pct: Number(utilizationPct.toFixed(2)),
      };

      if (exists) {
        await db('room_stats').where('room_id', roomId).update(stats);
      } else {
        await db('room_stats').insert(stats);
      }
    },

    async getSignals(roomIds: string[]): Promise<Record<string, RoomSignals>> {
      logger.info(`ranking.getSignals(${roomIds.length} rooms)`);
      const rows = await db('room_stats').whereIn('room_id', roomIds);
      const result: Record<string, RoomSignals> = {};

      for (const roomId of roomIds) {
        const row = rows.find((r: any) => r.room_id === roomId);
        if (row) {
          const bookingCount = Number(row.booking_count) || 1;
          result[roomId] = {
            roomId,
            avgRating: row.avg_rating ? Number(row.avg_rating) : null,
            bayesRating: row.bayes_rating ? Number(row.bayes_rating) : null,
            reviewCount: Number(row.review_count),
            openIssues: Number(row.open_issue_count),
            noShowRate: Number(row.no_show_count) / bookingCount,
            utilizationPct: Number(row.utilization_pct),
          };
        } else {
          result[roomId] = {
            roomId, avgRating: null, bayesRating: null, reviewCount: 0,
            openIssues: 0, noShowRate: 0, utilizationPct: 0,
          };
        }
      }
      return result;
    },
  };
}

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

async function recomputeAllStatsJob(ctx: ModuleContext): Promise<void> {
  const logger = ctx.logger as any;
  const ranking = ctx.services.get('ranking');
  try {
    const rooms = await ctx.db('rooms').whereNull('deleted_at').select('id');
    for (const room of rooms) {
      try { await ranking.recomputeRoom(room.id); } catch (e) { logger.error({ err: e, roomId: room.id }, 'recompute failed'); }
    }
    logger.info(`Recomputed stats for ${rooms.length} rooms`);
  } catch (err) {
    logger.error({ err }, 'recompute-all-stats job failed');
  }
}

const rankingModule: ApiModule = {
  name: 'ranking',
  part: 4,
  provides: ['ranking'],
  requires: ['rooms'],

  async register(ctx: ModuleContext): Promise<void> {
    const service = createRankingService(ctx);
    ctx.services.provide('ranking', service);
  },

  jobs: [
    { name: 'recompute-all-stats', intervalMs: 24 * 60 * 60 * 1000, run: recomputeAllStatsJob },
  ],
};

export default rankingModule;
