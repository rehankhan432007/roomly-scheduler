import { Router } from 'express';
import QRCode from 'qrcode';
import { requireAuth, requireRole, optionalAuth } from '../../core/middleware.js';
import { validate } from '../../core/errors.js';
import { ApiError, successResponse } from '@meetmaze/shared/core';
import {
  createLocationSchema, updateLocationSchema,
  createRoomSchema, updateRoomSchema,
  replaceEquipmentSchema, patchEquipmentSchema,
  createBlackoutSchema,
  ownerRoomsQuerySchema, ownerBookingsQuerySchema, dashboardQuerySchema,
} from '@meetmaze/shared/modules/rooms';
import { z } from 'zod';
import type { RoomsRepository } from './repository.js';

export function createRoomRoutes(repo: RoomsRepository, webUrl: string) {
  const router = Router();

  // ---- Equipment Types (public) ----
  let equipmentTypesCache: { data: unknown; expiresAt: number } | null = null;

  router.get('/equipment-types', async (_req, res, next) => {
    try {
      if (equipmentTypesCache && equipmentTypesCache.expiresAt > Date.now()) {
        res.json(successResponse(equipmentTypesCache.data));
        return;
      }
      const types = await repo.listEquipmentTypes();
      equipmentTypesCache = { data: types, expiresAt: Date.now() + 5 * 60 * 1000 };
      res.json(successResponse(types));
    } catch (err) { next(err); }
  });

  // ---- Public room detail ----
  router.get('/rooms/:id', optionalAuth, async (req, res, next) => {
    try {
      const room = await repo.getRoomIncludingDeleted(req.params.id!);
      if (!room) throw new ApiError(404, 'NOT_FOUND', 'Room not found');

      const r = room as Record<string, unknown>;
      // Deleted/inactive rooms only visible to owner
      if (r.deleted_at || r.status === 'INACTIVE') {
        if (!req.user || req.user.sub !== r.owner_id) {
          throw new ApiError(404, 'NOT_FOUND', 'Room not found');
        }
      }

      const summary = await repo.getRoomSummary(req.params.id!);
      if (!summary) throw new ApiError(404, 'NOT_FOUND', 'Room not found');

      // Add extra fields for detail view
      const location = await repo.getLocation(r.location_id as string);
      res.json(successResponse({
        ...summary,
        description: r.description,
        location: location ? {
          name: (location as Record<string, unknown>).name,
          addressLine: (location as Record<string, unknown>).address_line,
          city: (location as Record<string, unknown>).city,
          timezone: (location as Record<string, unknown>).timezone,
          latitude: (location as Record<string, unknown>).latitude,
          longitude: (location as Record<string, unknown>).longitude,
        } : null,
      }));
    } catch (err) { next(err); }
  });

  // ---- Owner Locations CRUD ----
  router.get('/owner/locations', requireAuth, requireRole('OWNER'), async (req, res, next) => {
    try {
      const locations = await repo.listLocations(req.user!.sub);
      res.json(successResponse(locations.map((l: Record<string, unknown>) => ({
        id: l.id,
        name: l.name,
        addressLine: l.address_line,
        city: l.city,
        state: l.state,
        country: l.country,
        timezone: l.timezone,
        latitude: l.latitude,
        longitude: l.longitude,
        createdAt: l.created_at,
      }))));
    } catch (err) { next(err); }
  });

  router.post('/owner/locations', requireAuth, requireRole('OWNER'),
    validate({ body: createLocationSchema }),
    async (req, res, next) => {
      try {
        // Validate timezone
        try {
          Intl.DateTimeFormat(undefined, { timeZone: req.body.timezone || 'Asia/Kolkata' });
        } catch {
          throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid timezone');
        }
        const location = await repo.createLocation(req.user!.sub, req.body);
        res.status(201).json(successResponse(location));
      } catch (err) { next(err); }
    }
  );

  router.patch('/owner/locations/:id', requireAuth, requireRole('OWNER'),
    validate({ body: updateLocationSchema }),
    async (req, res, next) => {
      try {
        const loc = await repo.getLocation(req.params.id!);
        if (!loc || (loc as Record<string, unknown>).owner_id !== req.user!.sub) {
          throw new ApiError(404, 'NOT_FOUND', 'Location not found');
        }
        if (req.body.timezone) {
          try {
            Intl.DateTimeFormat(undefined, { timeZone: req.body.timezone });
          } catch {
            throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid timezone');
          }
        }
        const updated = await repo.updateLocation(req.params.id!, req.body);
        res.json(successResponse(updated));
      } catch (err) { next(err); }
    }
  );

  router.delete('/owner/locations/:id', requireAuth, requireRole('OWNER'), async (req, res, next) => {
    try {
      const loc = await repo.getLocation(req.params.id!);
      if (!loc || (loc as Record<string, unknown>).owner_id !== req.user!.sub) {
        throw new ApiError(404, 'NOT_FOUND', 'Location not found');
      }
      if (await repo.locationHasRooms(req.params.id!)) {
        throw new ApiError(409, 'CONFLICT', 'Location has rooms and cannot be deleted');
      }
      await repo.deleteLocation(req.params.id!);
      res.json(successResponse({ deleted: true }));
    } catch (err) { next(err); }
  });

  // ---- Owner Rooms CRUD ----
  router.get('/owner/rooms', requireAuth, requireRole('OWNER'),
    validate({ query: ownerRoomsQuerySchema }),
    async (req, res, next) => {
      try {
        const { q, status, locationId, page, pageSize } = req.query as unknown as {
          q?: string; status?: string; locationId?: string; page: number; pageSize: number;
        };
        const result = await repo.listOwnerRooms(req.user!.sub, { q, status, locationId, page, pageSize });

        // Enrich with equipment
        const roomIds = result.rows.map((r: Record<string, unknown>) => r.id as string);
        const summaries = roomIds.length > 0 ? await repo.getRoomSummaries(roomIds) : [];
        const summaryMap = new Map(summaries.map(s => [s.id, s]));

        const enrichedRooms = result.rows.map((r: Record<string, unknown>) => {
          const s = summaryMap.get(r.id as string);
          return s ? { ...s, description: r.description } : r;
        });

        res.json(successResponse(enrichedRooms, {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        }));
      } catch (err) { next(err); }
    }
  );

  router.post('/owner/rooms', requireAuth, requireRole('OWNER'),
    validate({ body: createRoomSchema }),
    async (req, res, next) => {
      try {
        // Verify location belongs to owner
        const loc = await repo.getLocation(req.body.locationId);
        if (!loc || (loc as Record<string, unknown>).owner_id !== req.user!.sub) {
          throw new ApiError(404, 'NOT_FOUND', 'Location not found');
        }

        const { equipment, ...roomData } = req.body;
        const { id } = await repo.createRoom(req.user!.sub, roomData);

        if (equipment && equipment.length > 0) {
          await repo.replaceRoomEquipment(id, equipment);
        }

        const summary = await repo.getRoomSummary(id);
        res.status(201).json(successResponse(summary));
      } catch (err) { next(err); }
    }
  );

  router.get('/owner/rooms/:id', requireAuth, requireRole('OWNER'), async (req, res, next) => {
    try {
      const room = await repo.getRoom(req.params.id!);
      if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
        throw new ApiError(404, 'NOT_FOUND', 'Room not found');
      }
      const summary = await repo.getRoomSummary(req.params.id!);
      const r = room as Record<string, unknown>;
      res.json(successResponse({ ...summary, description: r.description }));
    } catch (err) { next(err); }
  });

  router.patch('/owner/rooms/:id', requireAuth, requireRole('OWNER'),
    validate({ body: updateRoomSchema }),
    async (req, res, next) => {
      try {
        const room = await repo.getRoom(req.params.id!);
        if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
          throw new ApiError(404, 'NOT_FOUND', 'Room not found');
        }
        await repo.updateRoom(req.params.id!, req.body);
        const summary = await repo.getRoomSummary(req.params.id!);
        res.json(successResponse(summary));
      } catch (err) { next(err); }
    }
  );

  router.delete('/owner/rooms/:id', requireAuth, requireRole('OWNER'), async (req, res, next) => {
    try {
      const room = await repo.getRoom(req.params.id!);
      if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
        throw new ApiError(404, 'NOT_FOUND', 'Room not found');
      }
      if (await repo.hasFutureBookings(req.params.id!)) {
        throw new ApiError(409, 'CONFLICT', 'Room has future bookings and cannot be deleted');
      }
      await repo.softDeleteRoom(req.params.id!);
      res.json(successResponse({ deleted: true }));
    } catch (err) { next(err); }
  });

  // ---- Equipment management ----
  router.put('/owner/rooms/:id/equipment', requireAuth, requireRole('OWNER'),
    validate({ body: replaceEquipmentSchema }),
    async (req, res, next) => {
      try {
        const room = await repo.getRoom(req.params.id!);
        if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
          throw new ApiError(404, 'NOT_FOUND', 'Room not found');
        }
        await repo.replaceRoomEquipment(req.params.id!, req.body);
        const equipment = await repo.getRoomEquipment(req.params.id!);
        res.json(successResponse(equipment));
      } catch (err) { next(err); }
    }
  );

  router.patch('/owner/rooms/:id/equipment/:code', requireAuth, requireRole('OWNER'),
    validate({ body: patchEquipmentSchema }),
    async (req, res, next) => {
      try {
        const room = await repo.getRoom(req.params.id!);
        if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
          throw new ApiError(404, 'NOT_FOUND', 'Room not found');
        }
        const result = await repo.patchEquipmentByCode(req.params.id!, req.params.code!, req.body);
        if (!result) throw new ApiError(404, 'NOT_FOUND', 'Equipment not found in this room');
        const equipment = await repo.getRoomEquipment(req.params.id!);
        res.json(successResponse(equipment));
      } catch (err) { next(err); }
    }
  );

  // ---- Blackouts ----
  router.get('/owner/rooms/:id/blackouts', requireAuth, requireRole('OWNER'), async (req, res, next) => {
    try {
      const room = await repo.getRoom(req.params.id!);
      if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
        throw new ApiError(404, 'NOT_FOUND', 'Room not found');
      }
      const blackouts = await repo.listBlackouts(req.params.id!);
      res.json(successResponse(blackouts));
    } catch (err) { next(err); }
  });

  router.post('/owner/rooms/:id/blackouts', requireAuth, requireRole('OWNER'),
    validate({ body: createBlackoutSchema }),
    async (req, res, next) => {
      try {
        const room = await repo.getRoom(req.params.id!);
        if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
          throw new ApiError(404, 'NOT_FOUND', 'Room not found');
        }
        // Check for conflicting bookings
        const conflicts = await repo.hasConflictingBookingsForBlackout(
          req.params.id!, req.body.startAt, req.body.endAt
        );
        if (conflicts.length > 0) {
          throw new ApiError(409, 'CONFLICT', 'Blackout conflicts with existing bookings', {
            bookings: conflicts.map((b: Record<string, unknown>) => ({
              id: b.id, startAt: b.start_at, endAt: b.end_at, title: b.title,
            })),
          });
        }
        const blackout = await repo.createBlackout(req.params.id!, req.body);
        res.status(201).json(successResponse(blackout));
      } catch (err) { next(err); }
    }
  );

  router.delete('/owner/rooms/:id/blackouts/:blackoutId', requireAuth, requireRole('OWNER'),
    async (req, res, next) => {
      try {
        const room = await repo.getRoom(req.params.id!);
        if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
          throw new ApiError(404, 'NOT_FOUND', 'Room not found');
        }
        const blackout = await repo.getBlackout(req.params.blackoutId!);
        if (!blackout || (blackout as Record<string, unknown>).room_id !== req.params.id) {
          throw new ApiError(404, 'NOT_FOUND', 'Blackout not found');
        }
        await repo.deleteBlackout(req.params.blackoutId!);
        res.json(successResponse({ deleted: true }));
      } catch (err) { next(err); }
    }
  );

  // ---- QR ----
  router.get('/owner/rooms/:id/qr', requireAuth, requireRole('OWNER'), async (req, res, next) => {
    try {
      const room = await repo.getRoom(req.params.id!);
      if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
        throw new ApiError(404, 'NOT_FOUND', 'Room not found');
      }
      const token = await repo.getQrToken(req.params.id!);
      const checkinUrl = `${webUrl}/checkin/${token}`;
      const svg = await QRCode.toString(checkinUrl, { type: 'svg', errorCorrectionLevel: 'M' });
      res.json(successResponse({ checkinUrl, token, svg }));
    } catch (err) { next(err); }
  });

  router.post('/owner/rooms/:id/qr/rotate', requireAuth, requireRole('OWNER'), async (req, res, next) => {
    try {
      const room = await repo.getRoom(req.params.id!);
      if (!room || (room as Record<string, unknown>).owner_id !== req.user!.sub) {
        throw new ApiError(404, 'NOT_FOUND', 'Room not found');
      }
      const newToken = await repo.rotateQrToken(req.params.id!);
      const checkinUrl = `${webUrl}/checkin/${newToken}`;
      const svg = await QRCode.toString(checkinUrl, { type: 'svg', errorCorrectionLevel: 'M' });
      res.json(successResponse({ checkinUrl, token: newToken, svg }));
    } catch (err) { next(err); }
  });

  // ---- Owner Dashboard ----
  router.get('/owner/dashboard', requireAuth, requireRole('OWNER'),
    validate({ query: dashboardQuerySchema }),
    async (req, res, next) => {
      try {
        const range = (req.query as { range?: string }).range || '7d';
        const rangeDays = range === '30d' ? 30 : 7;

        const totals = await repo.getDashboardTotals(req.user!.sub, rangeDays);
        const utilizationByDay = await repo.getUtilizationByDay(req.user!.sub, rangeDays);
        const todaySchedule = await repo.getTodaySchedule(req.user!.sub);

        res.json(successResponse({
          totals,
          utilizationByDay,
          topRooms: [],
          underusedRooms: [],
          todaySchedule,
        }));
      } catch (err) { next(err); }
    }
  );

  // ---- Owner Bookings ----
  router.get('/owner/bookings', requireAuth, requireRole('OWNER'),
    validate({ query: ownerBookingsQuerySchema }),
    async (req, res, next) => {
      try {
        const filters = req.query as unknown as {
          status?: string; roomId?: string; from?: string; to?: string;
          page: number; pageSize: number;
        };
        const result = await repo.getOwnerBookings(req.user!.sub, filters);

        const rows = result.rows.map((b: Record<string, unknown>) => ({
          id: b.id,
          roomId: b.room_id,
          roomName: b.room_name,
          clientId: b.client_id,
          clientName: b.client_name,
          clientCompany: b.client_company,
          title: b.title,
          startAt: b.start_at,
          endAt: b.end_at,
          attendeeCount: b.attendee_count,
          status: b.status,
          totalPrice: b.total_price,
          source: b.source,
          createdAt: b.created_at,
        }));

        res.json(successResponse(rows, {
          page: result.page,
          pageSize: result.pageSize,
          total: result.total,
        }));
      } catch (err) { next(err); }
    }
  );

  return router;
}
