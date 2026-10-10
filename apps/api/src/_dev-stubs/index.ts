import type { ModuleContext } from '@meetmaze/shared/contracts';
import type { RoomsService, InsightsService, RankingService, NotificationService } from '@meetmaze/shared/contracts';
import type { RoomSummary, BusyWarning, RoomSignals } from '@meetmaze/shared/contracts';
import { logger } from '../core/logger.js';
import { SEED_IDS } from '@meetmaze/shared/domain';

// ---- Rooms Stub (read-through to DB) ----
function makeRoomsStub(ctx: ModuleContext): RoomsService {
  const db = ctx.db;

  async function buildRoomSummary(row: Record<string, unknown>): Promise<RoomSummary> {
    const location = await db('locations').where('id', row['location_id'] as string).first();
    const equipment = await db('room_equipment as re')
      .join('equipment_types as et', 'et.id', 're.equipment_type_id')
      .where('re.room_id', row['id'] as string)
      .select('et.code', 'et.name', 'et.icon', 're.quantity', 're.status');
    const stats = await db('room_stats').where('room_id', row['id'] as string).first();
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      locationId: row['location_id'] as string,
      locationName: location?.name ?? '',
      city: location?.city ?? '',
      timezone: location?.timezone ?? 'Asia/Kolkata',
      floor: row['floor'] as string | null,
      capacity: row['capacity'] as number,
      roomType: row['room_type'] as string,
      vibe: row['vibe'] as string,
      hourlyPrice: parseFloat(row['hourly_price'] as string),
      currency: row['currency'] as string,
      photos: JSON.parse(row['photos'] as string ?? '[]'),
      status: row['status'] as string,
      openTime: row['open_time'] as string,
      closeTime: row['close_time'] as string,
      openDays: JSON.parse(row['open_days'] as string ?? '[1,2,3,4,5]'),
      minBookingMinutes: row['min_booking_minutes'] as number,
      maxBookingMinutes: row['max_booking_minutes'] as number,
      bufferMinutes: row['buffer_minutes'] as number,
      checkinGraceMinutes: row['checkin_grace_minutes'] as number,
      equipment: equipment.map((e: Record<string, unknown>) => ({
        code: e['code'] as string,
        name: e['name'] as string,
        icon: e['icon'] as string,
        quantity: e['quantity'] as number,
        status: e['status'] as 'WORKING' | 'FAULTY' | 'MAINTENANCE',
      })),
      avgRating: stats?.avg_rating ? parseFloat(stats.avg_rating) : null,
      reviewCount: stats?.review_count ?? 0,
    };
  }

  return {
    async getRoomSummary(roomId) {
      logger.debug({ roomId }, '[STUB] rooms.getRoomSummary');
      const row = await db('rooms').where('id', roomId).whereNull('deleted_at').first();
      if (!row) return null;
      return buildRoomSummary(row);
    },
    async getRoomSummaries(roomIds) {
      logger.debug({ count: roomIds.length }, '[STUB] rooms.getRoomSummaries');
      if (!roomIds.length) return [];
      const rows = await db('rooms').whereIn('id', roomIds).whereNull('deleted_at');
      return Promise.all(rows.map(buildRoomSummary));
    },
    async resolveRoomByQrToken(token) {
      logger.debug({ token }, '[STUB] rooms.resolveRoomByQrToken');
      const row = await db('rooms').where('qr_token', token).whereNull('deleted_at').first();
      if (!row) return null;
      return buildRoomSummary(row);
    },
    async getOwnerId(roomId) {
      logger.debug({ roomId }, '[STUB] rooms.getOwnerId');
      const row = await db('rooms').where('id', roomId).first();
      return row?.owner_id ?? null;
    },
    async flagEquipment(roomId, equipmentCode, reason) {
      logger.debug({ roomId, equipmentCode, reason }, '[STUB] rooms.flagEquipment');
      const eq = await db('equipment_types').where('code', equipmentCode).first();
      if (!eq) return;
      await db('room_equipment')
        .where({ room_id: roomId, equipment_type_id: eq.id })
        .update({ status: 'FAULTY', flagged_at: new Date(), flagged_reason: reason });
    },
    async clearEquipmentFlag(roomId, equipmentCode) {
      logger.debug({ roomId, equipmentCode }, '[STUB] rooms.clearEquipmentFlag');
      const eq = await db('equipment_types').where('code', equipmentCode).first();
      if (!eq) return;
      await db('room_equipment')
        .where({ room_id: roomId, equipment_type_id: eq.id })
        .update({ status: 'WORKING', flagged_at: null, flagged_reason: null });
    },
  };
}

// ---- Insights Stub ----
function makeInsightsStub(): InsightsService {
  return {
    async getBusyWarning(q) {
      logger.debug(q, '[STUB] insights.getBusyWarning');
      if (!q.startAt) return null;
      const d = new Date(q.startAt);
      const day = d.getDay(); // 0=Sun,1=Mon,...
      const hour = d.getHours();
      if ((day === 1 || day === 2) && hour >= 10 && hour < 12) {
        return {
          level: 'WARN',
          message: 'Mondays 10 to 12 are usually 90% full, try 2 PM',
          fillRate: 90,
          suggestedSlot: {
            startAt: new Date(d.setHours(14, 0, 0, 0)).toISOString(),
            endAt: new Date(d.setHours(15, 0, 0, 0)).toISOString(),
          },
        } satisfies BusyWarning;
      }
      return null;
    },
    async recompute() {
      logger.debug('[STUB] insights.recompute');
    },
  };
}

// ---- Ranking Stub ----
function makeRankingStub(): RankingService {
  return {
    async getSignals(roomIds) {
      logger.debug({ count: roomIds.length }, '[STUB] ranking.getSignals');
      const signals: Record<string, RoomSignals> = {};
      for (const id of roomIds) {
        signals[id] = {
          roomId: id,
          avgRating: 8,
          bayesRating: 8,
          reviewCount: 10,
          openIssues: 0,
          noShowRate: 0.05,
          utilizationPct: 60,
        };
      }
      return signals;
    },
    async recomputeRoom(roomId) {
      logger.debug({ roomId }, '[STUB] ranking.recomputeRoom');
    },
  };
}

// ---- Notifications Stub ----
function makeNotificationsStub(): NotificationService {
  return {
    async notify(userId, n) {
      logger.info({ userId, type: n.type, title: n.title }, '[STUB] notifications.notify');
    },
  };
}

// ---- Auth Stub ----
async function registerAuthStub(ctx: ModuleContext): Promise<void> {
  const { router, db, config } = ctx;
  const jwt = await import('jsonwebtoken');
  const bcrypt = await import('bcryptjs');

  router.post('/auth/register', async (req, res, next) => {
    try {
      const { name, email, password, role, company, phone } = req.body;
      const { v4: uuid } = await import('uuid');
      const exists = await db('users').where('email', email).first();
      if (exists) { res.status(409).json({ success: false, error: { code: 'CONFLICT', message: 'Email already in use' } }); return; }
      const id = uuid();
      const hash = await bcrypt.hash(password, 10);
      await db('users').insert({ id, name, email, password_hash: hash, role: role ?? 'CLIENT', company, phone });
      const jwtConfReg = (config as Record<string, Record<string, string>>)['jwt'];
      const token = jwt.sign({ sub: id, role: role ?? 'CLIENT', email, name }, jwtConfReg?.['secret'] ?? 'change-me', { expiresIn: '7d' });
      res.cookie(jwtConfReg?.['cookieName'] ?? 'mm_token', token, { httpOnly: true, sameSite: 'lax' });
      res.status(201).json({ success: true, data: { id, name, email, role: role ?? 'CLIENT' } });
    } catch (e) { next(e); }
  });

  router.post('/auth/login', async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await db('users').where('email', email).first();
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Invalid credentials' } }); return;
      }
      const jwtConf = (config as Record<string, Record<string, string>>)['jwt'];
      const token = jwt.sign({ sub: user.id, role: user.role, email: user.email, name: user.name }, jwtConf?.['secret'] ?? 'change-me', { expiresIn: '7d' });
      res.cookie(jwtConf?.['cookieName'] ?? 'mm_token', token, { httpOnly: true, sameSite: 'lax' });
      res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role } });
    } catch (e) { next(e); }
  });

  router.post('/auth/logout', (req, res) => {
    const jwtConf = (config as Record<string, Record<string, string>>)['jwt'];
    res.clearCookie(jwtConf?.['cookieName'] ?? 'mm_token');
    res.json({ success: true, data: null });
  });

  router.get('/auth/me', async (req, res, next) => {
    try {
      const jwtConf = (config as Record<string, Record<string, string>>)['jwt'];
      const token = req.cookies?.[jwtConf?.['cookieName'] ?? 'mm_token'] ?? req.headers.authorization?.replace('Bearer ', '');
      if (!token) { res.status(401).json({ success: false, error: { code: 'UNAUTHENTICATED', message: 'Not authenticated' } }); return; }
      const payload = jwt.verify(token, jwtConf?.['secret'] ?? 'change-me') as { sub: string };
      const user = await db('users').where('id', payload.sub).first();
      if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }); return; }
      res.json({ success: true, data: { id: user.id, name: user.name, email: user.email, role: user.role, company: user.company, phone: user.phone } });
    } catch (e) { next(e); }
  });

  // Equipment types
  router.get('/equipment-types', async (req, res, next) => {
    try {
      const types = await db('equipment_types').select('id', 'code', 'name', 'icon', 'category');
      res.json({ success: true, data: types });
    } catch (e) { next(e); }
  });
}

export default async function loadStubs(ctx: ModuleContext): Promise<void> {
  const { services } = ctx;

  if (!services.has('rooms')) {
    services.provide('rooms', makeRoomsStub(ctx), { stub: true });
  }
  if (!services.has('insights')) {
    services.provide('insights', makeInsightsStub(), { stub: true });
  }
  if (!services.has('ranking')) {
    services.provide('ranking', makeRankingStub(), { stub: true });
  }
  if (!services.has('notifications')) {
    services.provide('notifications', makeNotificationsStub(), { stub: true });
  }

  // Auth stub (if no real auth module)
  await registerAuthStub(ctx);
}
