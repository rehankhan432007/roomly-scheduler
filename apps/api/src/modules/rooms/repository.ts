import type { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import type { RoomSummary } from '@meetmaze/shared/contracts';

export class RoomsRepository {
  constructor(private db: Knex) {}

  // ---- Locations ----
  async listLocations(ownerId: string) {
    return this.db('locations').where({ owner_id: ownerId }).orderBy('name');
  }

  async getLocation(id: string) {
    return this.db('locations').where({ id }).first();
  }

  async createLocation(ownerId: string, data: {
    name: string; addressLine: string; city: string; state?: string;
    country?: string; timezone?: string; latitude?: number; longitude?: number;
  }) {
    const id = uuid();
    await this.db('locations').insert({
      id,
      owner_id: ownerId,
      name: data.name,
      address_line: data.addressLine,
      city: data.city,
      state: data.state || null,
      country: data.country || 'India',
      timezone: data.timezone || 'Asia/Kolkata',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
    });
    return this.getLocation(id);
  }

  async updateLocation(id: string, data: Record<string, unknown>) {
    const mapped: Record<string, unknown> = {};
    if (data.name !== undefined) mapped.name = data.name;
    if (data.addressLine !== undefined) mapped.address_line = data.addressLine;
    if (data.city !== undefined) mapped.city = data.city;
    if (data.state !== undefined) mapped.state = data.state;
    if (data.country !== undefined) mapped.country = data.country;
    if (data.timezone !== undefined) mapped.timezone = data.timezone;
    if (data.latitude !== undefined) mapped.latitude = data.latitude;
    if (data.longitude !== undefined) mapped.longitude = data.longitude;
    await this.db('locations').where({ id }).update(mapped);
    return this.getLocation(id);
  }

  async deleteLocation(id: string) {
    await this.db('locations').where({ id }).delete();
  }

  async locationHasRooms(locationId: string): Promise<boolean> {
    const row = await this.db('rooms').where({ location_id: locationId }).whereNull('deleted_at').first();
    return !!row;
  }

  // ---- Rooms ----
  async listOwnerRooms(ownerId: string, filters: {
    q?: string; status?: string; locationId?: string;
    page: number; pageSize: number;
  }) {
    let query = this.db('rooms')
      .where({ owner_id: ownerId })
      .whereNull('deleted_at');

    if (filters.status) query = query.where({ status: filters.status });
    if (filters.locationId) query = query.where({ location_id: filters.locationId });
    if (filters.q) query = query.where('name', 'like', `%${filters.q}%`);

    const countResult = await query.clone().count('* as total').first();
    const total = Number((countResult as Record<string, unknown>)?.total ?? 0);

    const rows = await query
      .orderBy('created_at', 'desc')
      .offset((filters.page - 1) * filters.pageSize)
      .limit(filters.pageSize);

    return { rows, total, page: filters.page, pageSize: filters.pageSize };
  }

  async getRoom(id: string) {
    return this.db('rooms').where({ id }).whereNull('deleted_at').first();
  }

  async getRoomIncludingDeleted(id: string) {
    return this.db('rooms').where({ id }).first();
  }

  async createRoom(ownerId: string, data: Record<string, unknown>) {
    const id = uuid();
    const qrToken = uuid();
    await this.db('rooms').insert({
      id,
      owner_id: ownerId,
      location_id: data.locationId,
      name: data.name,
      description: data.description || null,
      floor: data.floor || null,
      capacity: data.capacity,
      room_type: data.roomType || 'MEETING',
      vibe: data.vibe || 'FORMAL',
      hourly_price: data.hourlyPrice || 0,
      currency: 'INR',
      photos: JSON.stringify(data.photos || []),
      status: data.status || 'ACTIVE',
      open_time: data.openTime || '09:00:00',
      close_time: data.closeTime || '19:00:00',
      open_days: JSON.stringify(data.openDays || [1, 2, 3, 4, 5]),
      min_booking_minutes: data.minBookingMinutes || 30,
      max_booking_minutes: data.maxBookingMinutes || 480,
      buffer_minutes: data.bufferMinutes || 0,
      checkin_grace_minutes: data.checkinGraceMinutes || 15,
      qr_token: qrToken,
    });
    return { id, qrToken };
  }

  async updateRoom(id: string, data: Record<string, unknown>) {
    const mapped: Record<string, unknown> = {};
    if (data.name !== undefined) mapped.name = data.name;
    if (data.description !== undefined) mapped.description = data.description;
    if (data.floor !== undefined) mapped.floor = data.floor;
    if (data.capacity !== undefined) mapped.capacity = data.capacity;
    if (data.roomType !== undefined) mapped.room_type = data.roomType;
    if (data.vibe !== undefined) mapped.vibe = data.vibe;
    if (data.hourlyPrice !== undefined) mapped.hourly_price = data.hourlyPrice;
    if (data.photos !== undefined) mapped.photos = JSON.stringify(data.photos);
    if (data.status !== undefined) mapped.status = data.status;
    if (data.openTime !== undefined) mapped.open_time = data.openTime;
    if (data.closeTime !== undefined) mapped.close_time = data.closeTime;
    if (data.openDays !== undefined) mapped.open_days = JSON.stringify(data.openDays);
    if (data.minBookingMinutes !== undefined) mapped.min_booking_minutes = data.minBookingMinutes;
    if (data.maxBookingMinutes !== undefined) mapped.max_booking_minutes = data.maxBookingMinutes;
    if (data.bufferMinutes !== undefined) mapped.buffer_minutes = data.bufferMinutes;
    if (data.checkinGraceMinutes !== undefined) mapped.checkin_grace_minutes = data.checkinGraceMinutes;
    await this.db('rooms').where({ id }).update(mapped);
  }

  async softDeleteRoom(id: string) {
    await this.db('rooms').where({ id }).update({ deleted_at: new Date() });
  }

  async hasFutureBookings(roomId: string): Promise<boolean> {
    const row = await this.db('bookings')
      .where({ room_id: roomId })
      .whereIn('status', ['CONFIRMED', 'HELD'])
      .where('start_at', '>', new Date())
      .first();
    return !!row;
  }

  // ---- Equipment ----
  async getRoomEquipment(roomId: string) {
    return this.db('room_equipment as re')
      .join('equipment_types as et', 're.equipment_type_id', 'et.id')
      .where('re.room_id', roomId)
      .select('re.*', 'et.code', 'et.name as type_name', 'et.icon', 'et.category');
  }

  async replaceRoomEquipment(roomId: string, equipment: Array<{
    code: string; quantity?: number; status?: string; notes?: string;
  }>) {
    await this.db.transaction(async (trx) => {
      await trx('room_equipment').where({ room_id: roomId }).delete();
      if (equipment.length === 0) return;

      const types = await trx('equipment_types').whereIn('code', equipment.map(e => e.code));
      const typeMap = new Map(types.map((t: { code: string; id: string }) => [t.code, t.id]));

      const rows = equipment.map(e => ({
        id: uuid(),
        room_id: roomId,
        equipment_type_id: typeMap.get(e.code),
        quantity: e.quantity || 1,
        status: e.status || 'WORKING',
        notes: e.notes || null,
      })).filter(r => r.equipment_type_id);

      if (rows.length > 0) {
        await trx('room_equipment').insert(rows);
      }
    });
  }

  async patchEquipmentByCode(roomId: string, code: string, data: { status: string; notes?: string }) {
    const eqType = await this.db('equipment_types').where({ code }).first();
    if (!eqType) return null;

    const updates: Record<string, unknown> = { status: data.status };
    if (data.notes !== undefined) updates.notes = data.notes;

    if (data.status === 'WORKING') {
      updates.flagged_at = null;
      updates.flagged_reason = null;
    }

    const count = await this.db('room_equipment')
      .where({ room_id: roomId, equipment_type_id: (eqType as { id: string }).id })
      .update(updates);

    return count > 0 ? true : null;
  }

  async flagEquipment(roomId: string, equipmentCode: string, reason: string) {
    const eqType = await this.db('equipment_types').where({ code: equipmentCode }).first();
    if (!eqType) return;
    await this.db('room_equipment')
      .where({ room_id: roomId, equipment_type_id: (eqType as { id: string }).id })
      .update({ status: 'FAULTY', flagged_at: new Date(), flagged_reason: reason });
  }

  async clearEquipmentFlag(roomId: string, equipmentCode: string) {
    const eqType = await this.db('equipment_types').where({ code: equipmentCode }).first();
    if (!eqType) return;
    await this.db('room_equipment')
      .where({ room_id: roomId, equipment_type_id: (eqType as { id: string }).id })
      .update({ status: 'WORKING', flagged_at: null, flagged_reason: null });
  }

  // ---- Equipment Types ----
  async listEquipmentTypes() {
    return this.db('equipment_types').orderBy('category').orderBy('name');
  }

  // ---- Blackouts ----
  async listBlackouts(roomId: string) {
    return this.db('room_blackouts').where({ room_id: roomId }).orderBy('start_at');
  }

  async createBlackout(roomId: string, data: { startAt: string; endAt: string; reason?: string }) {
    const id = uuid();
    await this.db('room_blackouts').insert({
      id,
      room_id: roomId,
      start_at: new Date(data.startAt),
      end_at: new Date(data.endAt),
      reason: data.reason || null,
    });
    return this.db('room_blackouts').where({ id }).first();
  }

  async getBlackout(id: string) {
    return this.db('room_blackouts').where({ id }).first();
  }

  async deleteBlackout(id: string) {
    return this.db('room_blackouts').where({ id }).delete();
  }

  async hasConflictingBookingsForBlackout(roomId: string, startAt: string, endAt: string) {
    return this.db('bookings')
      .where({ room_id: roomId })
      .whereIn('status', ['CONFIRMED', 'HELD'])
      .where('start_at', '<', new Date(endAt))
      .where('end_at', '>', new Date(startAt));
  }

  // ---- QR ----
  async getQrToken(roomId: string): Promise<string | null> {
    const room = await this.db('rooms').where({ id: roomId }).select('qr_token').first();
    return room ? (room as { qr_token: string }).qr_token : null;
  }

  async rotateQrToken(roomId: string): Promise<string> {
    const newToken = uuid();
    await this.db('rooms').where({ id: roomId }).update({ qr_token: newToken });
    return newToken;
  }

  // ---- Room summary for other parts ----
  async getRoomSummary(roomId: string): Promise<RoomSummary | null> {
    const room = await this.db('rooms as r')
      .leftJoin('locations as l', 'r.location_id', 'l.id')
      .leftJoin('room_stats as rs', 'r.id', 'rs.room_id')
      .where('r.id', roomId)
      .whereNull('r.deleted_at')
      .select(
        'r.*',
        'l.name as location_name',
        'l.city',
        'l.timezone',
        'rs.avg_rating',
        'rs.review_count'
      )
      .first();

    if (!room) return null;

    const equipment = await this.getRoomEquipment(roomId);
    return this.mapToRoomSummary(room, equipment);
  }

  async getRoomSummaries(roomIds: string[]): Promise<RoomSummary[]> {
    if (roomIds.length === 0) return [];

    const rooms = await this.db('rooms as r')
      .leftJoin('locations as l', 'r.location_id', 'l.id')
      .leftJoin('room_stats as rs', 'r.id', 'rs.room_id')
      .whereIn('r.id', roomIds)
      .whereNull('r.deleted_at')
      .select(
        'r.*',
        'l.name as location_name',
        'l.city',
        'l.timezone',
        'rs.avg_rating',
        'rs.review_count'
      );

    const allEquipment = await this.db('room_equipment as re')
      .join('equipment_types as et', 're.equipment_type_id', 'et.id')
      .whereIn('re.room_id', roomIds)
      .select('re.*', 'et.code', 'et.name as type_name', 'et.icon', 'et.category');

    const equipMap = new Map<string, typeof allEquipment>();
    for (const eq of allEquipment) {
      const arr = equipMap.get((eq as Record<string, string>).room_id) || [];
      arr.push(eq);
      equipMap.set((eq as Record<string, string>).room_id, arr);
    }

    return rooms.map((r: Record<string, unknown>) =>
      this.mapToRoomSummary(r, equipMap.get(r.id as string) || [])
    );
  }

  async resolveRoomByQrToken(token: string): Promise<RoomSummary | null> {
    const room = await this.db('rooms').where({ qr_token: token }).whereNull('deleted_at').first();
    if (!room) return null;
    return this.getRoomSummary((room as { id: string }).id);
  }

  async getOwnerId(roomId: string): Promise<string | null> {
    const room = await this.db('rooms').where({ id: roomId }).select('owner_id').first();
    return room ? (room as { owner_id: string }).owner_id : null;
  }

  // ---- Dashboard ----
  async getDashboardTotals(ownerId: string, rangeDays: number) {
    const now = new Date();
    const rangeStart = new Date(now.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const rooms = await this.db('rooms').where({ owner_id: ownerId }).whereNull('deleted_at');
    const roomIds = rooms.map((r: Record<string, unknown>) => r.id as string);

    if (roomIds.length === 0) {
      return {
        rooms: 0, activeRooms: 0, bookingsToday: 0, bookingsInRange: 0,
        revenueInRange: 0, utilizationPct: 0, avgRating: null, openIssues: 0,
      };
    }

    const activeRooms = rooms.filter((r: Record<string, unknown>) => r.status === 'ACTIVE').length;

    const bookingsToday = await this.db('bookings')
      .whereIn('room_id', roomIds)
      .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'])
      .where('start_at', '>=', todayStart)
      .where('start_at', '<', todayEnd)
      .count('* as count')
      .first();

    const bookingsInRange = await this.db('bookings')
      .whereIn('room_id', roomIds)
      .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'])
      .where('start_at', '>=', rangeStart)
      .count('* as count')
      .first();

    const revenueResult = await this.db('bookings')
      .whereIn('room_id', roomIds)
      .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'])
      .where('start_at', '>=', rangeStart)
      .sum('total_price as total')
      .first();

    const statsResult = await this.db('room_stats')
      .whereIn('room_id', roomIds)
      .avg('avg_rating as avgRating')
      .first();

    const issuesResult = await this.db('room_issues')
      .whereIn('room_id', roomIds)
      .where({ status: 'OPEN' })
      .count('* as count')
      .first();

    return {
      rooms: rooms.length,
      activeRooms,
      bookingsToday: Number((bookingsToday as Record<string, unknown>)?.count ?? 0),
      bookingsInRange: Number((bookingsInRange as Record<string, unknown>)?.count ?? 0),
      revenueInRange: Number((revenueResult as Record<string, unknown>)?.total ?? 0),
      utilizationPct: 0,
      avgRating: (statsResult as Record<string, unknown>)?.avgRating
        ? Number((statsResult as Record<string, unknown>).avgRating)
        : null,
      openIssues: Number((issuesResult as Record<string, unknown>)?.count ?? 0),
    };
  }

  async getUtilizationByDay(ownerId: string, rangeDays: number) {
    const roomIds = (await this.db('rooms').where({ owner_id: ownerId }).whereNull('deleted_at').select('id'))
      .map((r: Record<string, unknown>) => r.id as string);

    if (roomIds.length === 0) return [];

    const now = new Date();
    const days: Array<{ date: string; pct: number }> = [];

    for (let i = rangeDays - 1; i >= 0; i--) {
      const dayStart = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

      const result = await this.db('bookings')
        .whereIn('room_id', roomIds)
        .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'COMPLETED'])
        .where('start_at', '>=', dayStart)
        .where('start_at', '<', dayEnd)
        .count('* as count')
        .first();

      const count = Number((result as Record<string, unknown>)?.count ?? 0);
      const totalSlots = roomIds.length * 10; // approx 10hr day
      const pct = totalSlots > 0 ? Math.round((count / totalSlots) * 100) : 0;

      days.push({
        date: dayStart.toISOString().split('T')[0]!,
        pct: Math.min(pct, 100),
      });
    }

    return days;
  }

  async getTodaySchedule(ownerId: string) {
    const roomIds = (await this.db('rooms').where({ owner_id: ownerId }).whereNull('deleted_at').select('id', 'name'))
      .map((r: Record<string, unknown>) => ({ id: r.id as string, name: r.name as string }));

    if (roomIds.length === 0) return [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    const bookings = await this.db('bookings')
      .whereIn('room_id', roomIds.map(r => r.id))
      .where('start_at', '>=', todayStart)
      .where('start_at', '<', todayEnd)
      .orderBy('start_at');

    const roomMap = new Map(roomIds.map(r => [r.id, r.name]));

    return bookings.map((b: Record<string, unknown>) => ({
      bookingId: b.id,
      roomName: roomMap.get(b.room_id as string) || 'Unknown',
      startAt: b.start_at,
      endAt: b.end_at,
      title: b.title,
      status: b.status,
    }));
  }

  async getOwnerBookings(ownerId: string, filters: {
    status?: string; roomId?: string; from?: string; to?: string;
    page: number; pageSize: number;
  }) {
    const roomIds = (await this.db('rooms').where({ owner_id: ownerId }).whereNull('deleted_at').select('id'))
      .map((r: Record<string, unknown>) => r.id as string);

    if (roomIds.length === 0) {
      return { rows: [], total: 0, page: filters.page, pageSize: filters.pageSize };
    }

    let query = this.db('bookings as b')
      .join('rooms as r', 'b.room_id', 'r.id')
      .join('users as u', 'b.client_id', 'u.id')
      .whereIn('b.room_id', roomIds);

    if (filters.status) query = query.where('b.status', filters.status);
    if (filters.roomId) query = query.where('b.room_id', filters.roomId);
    if (filters.from) query = query.where('b.start_at', '>=', new Date(filters.from));
    if (filters.to) query = query.where('b.start_at', '<=', new Date(filters.to));

    const countResult = await query.clone().count('* as total').first();
    const total = Number((countResult as Record<string, unknown>)?.total ?? 0);

    const rows = await query
      .select(
        'b.*',
        'r.name as room_name',
        'u.name as client_name',
        'u.company as client_company'
      )
      .orderBy('b.start_at', 'desc')
      .offset((filters.page - 1) * filters.pageSize)
      .limit(filters.pageSize);

    return { rows, total, page: filters.page, pageSize: filters.pageSize };
  }

  // ---- Helper ----
  private mapToRoomSummary(room: Record<string, unknown>, equipment: Array<Record<string, unknown>>): RoomSummary {
    let photos: string[] = [];
    try {
      photos = typeof room.photos === 'string' ? JSON.parse(room.photos as string) : (room.photos as string[]) || [];
    } catch { photos = []; }

    let openDays: number[] = [];
    try {
      openDays = typeof room.open_days === 'string' ? JSON.parse(room.open_days as string) : (room.open_days as number[]) || [];
    } catch { openDays = [1, 2, 3, 4, 5]; }

    return {
      id: room.id as string,
      name: room.name as string,
      locationId: room.location_id as string,
      locationName: (room.location_name as string) || '',
      city: (room.city as string) || '',
      timezone: (room.timezone as string) || 'Asia/Kolkata',
      floor: room.floor as string | null,
      capacity: room.capacity as number,
      roomType: room.room_type as string,
      vibe: room.vibe as string,
      hourlyPrice: Number(room.hourly_price),
      currency: (room.currency as string) || 'INR',
      photos,
      status: room.status as string,
      openTime: room.open_time as string,
      closeTime: room.close_time as string,
      openDays,
      minBookingMinutes: room.min_booking_minutes as number,
      maxBookingMinutes: room.max_booking_minutes as number,
      bufferMinutes: room.buffer_minutes as number,
      checkinGraceMinutes: room.checkin_grace_minutes as number,
      equipment: equipment.map(e => ({
        code: e.code as string,
        name: (e.type_name as string) || (e.name as string) || '',
        icon: e.icon as string,
        quantity: e.quantity as number,
        status: e.status as 'WORKING' | 'FAULTY' | 'MAINTENANCE',
      })),
      avgRating: room.avg_rating != null ? Number(room.avg_rating) : null,
      reviewCount: Number(room.review_count ?? 0),
    };
  }
}
