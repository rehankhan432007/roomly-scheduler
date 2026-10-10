import type { ApiModule, ModuleContext, InsightsService, BusyWarning } from '@meetmaze/shared/contracts';
import type { Iso } from '@meetmaze/shared/core';
import { z } from 'zod';
import { requireAuth, requireRole, optionalAuth, validate, ok } from '../../core/middleware.js';
import { toZonedTime } from 'date-fns-tz';
import { getISODay, getHours } from 'date-fns';

const DOW_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export function buildBusyMessage(fillRate: number, dow: number, startHour: number, endHour: number, suggestedSlot?: { startAt: Iso; endAt: Iso }): BusyWarning | null {
  if (fillRate < 60) return null;

  const level = fillRate >= 85 ? 'WARN' as const : 'INFO' as const;
  const dayName = DOW_NAMES[dow] || `Day ${dow}`;
  const startStr = formatHour(startHour);
  const endStr = formatHour(endHour);
  const message = `${dayName}s ${startStr} to ${endStr} are usually ${Math.round(fillRate)}% full${suggestedSlot ? `, try ${formatHour(new Date(suggestedSlot.startAt).getUTCHours())}` : ''}`;

  return { level, message, fillRate, suggestedSlot };
}

function formatHour(h: number): string {
  if (h === 0 || h === 24) return '12 AM';
  if (h === 12) return '12 PM';
  if (h < 12) return `${h} AM`;
  return `${h - 12} PM`;
}

function createInsightsService(ctx: ModuleContext): InsightsService {
  const db = ctx.db;
  const logger = ctx.logger as any;

  return {
    async getBusyWarning(q: { locationId?: string; roomId?: string; startAt: Iso; endAt: Iso }): Promise<BusyWarning | null> {
      logger.info({ q }, 'insights.getBusyWarning');

      let locationId = q.locationId;
      if (!locationId && q.roomId) {
        const room = await db('rooms').where('id', q.roomId).first();
        if (room) locationId = room.location_id;
      }
      if (!locationId) return null;

      const location = await db('locations').where('id', locationId).first();
      const tz = location?.timezone || 'Asia/Kolkata';

      const startDate = toZonedTime(new Date(q.startAt), tz);
      const endDate = toZonedTime(new Date(q.endAt), tz);
      const dow = getISODay(startDate);
      const startHour = getHours(startDate);
      const endHour = getHours(endDate);

      const stats = await db('slot_demand_stats')
        .where('location_id', locationId)
        .where('day_of_week', dow)
        .where('hour_of_day', '>=', startHour)
        .where('hour_of_day', '<', endHour || startHour + 1)
        .select('*');

      if (stats.length === 0) return null;

      const maxFillRate = Math.max(...stats.map((s: any) => Number(s.fill_rate)));

      // Find suggested slot — nearest later window with fill < 50
      let suggestedSlot: { startAt: Iso; endAt: Iso } | undefined;
      if (maxFillRate >= 60) {
        const durationHours = Math.max(1, endHour - startHour);
        const quietSlots = await db('slot_demand_stats')
          .where('location_id', locationId)
          .where('day_of_week', dow)
          .where('fill_rate', '<', 50)
          .where('hour_of_day', '>', endHour)
          .where('hour_of_day', '<', 19)
          .orderBy('hour_of_day')
          .limit(1);

        if (quietSlots.length > 0) {
          const suggestedHour = quietSlots[0].hour_of_day;
          const base = new Date(q.startAt);
          base.setUTCHours(suggestedHour, 0, 0, 0);
          const sugEnd = new Date(base.getTime() + durationHours * 60 * 60 * 1000);
          suggestedSlot = { startAt: base.toISOString(), endAt: sugEnd.toISOString() };
        }
      }

      return buildBusyMessage(maxFillRate, dow, startHour, endHour || startHour + 1, suggestedSlot);
    },

    async recompute(): Promise<void> {
      logger.info('insights.recompute');

      const locations = await db('locations').select('id', 'timezone');

      for (const loc of locations) {
        const tz = loc.timezone || 'Asia/Kolkata';
        const eightWeeksAgo = new Date(Date.now() - 8 * 7 * 24 * 60 * 60 * 1000);

        // Get rooms that are active at this location
        const activeRooms = await db('rooms')
          .where({ location_id: loc.id, status: 'ACTIVE' })
          .whereNull('deleted_at')
          .select('id', 'open_time', 'close_time', 'open_days');

        if (activeRooms.length === 0) continue;

        // Get bookings for this location in the last 8 weeks
        const roomIds = activeRooms.map((r: any) => r.id);
        const bookings = await db('bookings')
          .whereIn('room_id', roomIds)
          .where('start_at', '>=', eightWeeksAgo)
          .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'COMPLETED', 'RELEASED', 'NO_SHOW'])
          .select('room_id', 'start_at', 'end_at');

        // Build demand grid
        for (let dow = 1; dow <= 7; dow++) {
          for (let hour = 0; hour < 24; hour++) {
            // Count rooms open this hour on this day
            let availableRooms = 0;
            for (const room of activeRooms) {
              const openDays = typeof room.open_days === 'string' ? JSON.parse(room.open_days) : room.open_days;
              if (!openDays.includes(dow)) continue;
              const openH = parseTimeHour(room.open_time);
              const closeH = parseTimeHour(room.close_time);
              if (hour >= openH && hour < closeH) availableRooms++;
            }

            if (availableRooms === 0) continue;

            // Count booked room-hours for this (dow, hour)
            let bookedCount = 0;
            let sampleSize = 0;
            for (const b of bookings) {
              const start = toZonedTime(new Date(b.start_at), tz);
              const end = toZonedTime(new Date(b.end_at), tz);
              if (getISODay(start) !== dow) continue;
              const bStartH = getHours(start);
              const bEndH = getHours(end);
              if (hour >= bStartH && hour < bEndH) {
                bookedCount++;
                sampleSize++;
              }
            }

            const totalSlots = availableRooms * 8; // rough: 8 weeks
            const fillRate = totalSlots > 0 ? Math.min(100, (bookedCount / totalSlots) * 100) : 0;

            await db.raw(`
              INSERT INTO slot_demand_stats (location_id, day_of_week, hour_of_day, fill_rate, sample_size)
              VALUES (?, ?, ?, ?, ?)
              ON DUPLICATE KEY UPDATE fill_rate = VALUES(fill_rate), sample_size = VALUES(sample_size)
            `, [loc.id, dow, hour, fillRate.toFixed(2), sampleSize]);
          }
        }
      }
      logger.info('Demand stats recomputed');
    },
  };
}

function parseTimeHour(timeStr: string): number {
  return parseInt(timeStr.split(':')[0], 10);
}

const insightsModule: ApiModule = {
  name: 'insights',
  part: 4,
  provides: ['insights'],

  async register(ctx: ModuleContext): Promise<void> {
    const service = createInsightsService(ctx);
    ctx.services.provide('insights', service);

    const { router, db } = ctx;

    // GET /insights/busy-slots
    router.get('/insights/busy-slots', requireAuth, validate({
      query: z.object({
        locationId: z.string().uuid().optional(),
        roomId: z.string().uuid().optional(),
        startAt: z.string(),
        endAt: z.string(),
      }),
    }), async (req, res, next) => {
      try {
        const q = req.query as { locationId?: string; roomId?: string; startAt: string; endAt: string };
        const warning = await service.getBusyWarning(q);
        ok(res, warning);
      } catch (e) { next(e); }
    });

    // GET /owner/insights/heatmap
    router.get('/owner/insights/heatmap', requireAuth, requireRole('OWNER'), validate({
      query: z.object({ locationId: z.string().uuid() }),
    }), async (req, res, next) => {
      try {
        const ownerId = req.user!.sub;
        const locationId = (req.query as any).locationId;

        // Verify owner owns this location
        const loc = await db('locations').where({ id: locationId, owner_id: ownerId }).first();
        if (!loc) {
          ok(res, { cells: [], peakWindows: [], quietWindows: [], suggestions: [] });
          return;
        }

        const cells = await db('slot_demand_stats').where('location_id', locationId)
          .select('day_of_week as dow', 'hour_of_day as hour', 'fill_rate as fillRate');

        const formattedCells = cells.map((c: any) => ({
          dow: Number(c.dow), hour: Number(c.hour), fillRate: Number(c.fillRate),
        }));

        // Peak windows (fill >= 80)
        const peakWindows = findWindows(formattedCells, 80, 100);
        const quietWindows = findWindows(formattedCells, 0, 30);

        const suggestions: string[] = [];
        for (const peak of peakWindows.slice(0, 3)) {
          suggestions.push(`${DOW_NAMES[peak.dow]}s ${formatHour(peak.startHour)}–${formatHour(peak.endHour)} are peak (${Math.round(peak.avgRate)}% full)`);
        }
        for (const quiet of quietWindows.slice(0, 2)) {
          suggestions.push(`Consider promoting ${DOW_NAMES[quiet.dow]}s ${formatHour(quiet.startHour)}–${formatHour(quiet.endHour)} — only ${Math.round(quiet.avgRate)}% utilized`);
        }

        ok(res, { cells: formattedCells, peakWindows, quietWindows, suggestions });
      } catch (e) { next(e); }
    });
  },

  jobs: [
    {
      name: 'recompute-demand',
      intervalMs: 60 * 60 * 1000,
      run: async (ctx: ModuleContext) => {
        const insights = ctx.services.get('insights');
        await insights.recompute();
      },
    },
  ],
};

interface DemandCell { dow: number; hour: number; fillRate: number; }
interface Window { dow: number; startHour: number; endHour: number; avgRate: number; }

function findWindows(cells: DemandCell[], minRate: number, maxRate: number): Window[] {
  const windows: Window[] = [];
  for (let dow = 1; dow <= 7; dow++) {
    const dayCells = cells.filter(c => c.dow === dow && c.fillRate >= minRate && c.fillRate <= maxRate)
      .sort((a, b) => a.hour - b.hour);
    let i = 0;
    while (i < dayCells.length) {
      let j = i;
      while (j < dayCells.length - 1 && dayCells[j + 1].hour === dayCells[j].hour + 1) j++;
      const windowCells = dayCells.slice(i, j + 1);
      const avgRate = windowCells.reduce((s, c) => s + c.fillRate, 0) / windowCells.length;
      windows.push({ dow, startHour: dayCells[i].hour, endHour: dayCells[j].hour + 1, avgRate });
      i = j + 1;
    }
  }
  return windows.sort((a, b) => b.avgRate - a.avgRate);
}

export default insightsModule;
