import type { Knex } from 'knex';
import type { SearchService, RoomsService, BookingService, InsightsService, RankingService, SearchCriteria, SearchResponse, RoomMatch, AlternativeSlot, SlotDto, MatchBreakdown, RoomSummary } from '@meetmaze/shared/contracts';
import { addMinutes, parseISO, differenceInMinutes, isAfter, isBefore, startOfDay, endOfDay, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

function toDbDt(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

function parseJson<T>(v: unknown, def: T): T {
  if (!v) return def;
  if (typeof v === 'string') { try { return JSON.parse(v); } catch { return def; } }
  return v as T;
}

async function getBlockingForRooms(db: Knex, roomIds: string[], startAt: Date, endAt: Date): Promise<Map<string, number>> {
  if (!roomIds.length) return new Map();
  const rows = await db('bookings')
    .whereIn('room_id', roomIds)
    .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'HELD'])
    .where(function() { this.where('status', '!=', 'HELD').orWhere('hold_expires_at', '>', new Date()); })
    .where('start_at', '<', toDbDt(endAt))
    .where('end_at', '>', toDbDt(startAt))
    .select('room_id');
  const map = new Map<string, number>();
  for (const r of rows) {
    map.set(r.room_id, (map.get(r.room_id) ?? 0) + 1);
  }
  return map;
}

function scoreCapacity(capacity: number, attendees: number): number {
  const ratio = capacity / attendees;
  if (ratio >= 1.0 && ratio <= 1.4) return 30;
  if (ratio > 1.4 && ratio <= 3) return Math.round(30 - ((ratio - 1.4) / (3 - 1.4)) * 20);
  if (ratio > 3) return 5;
  return 0;
}

function scoreEquipment(room: RoomSummary, required: string[]): { score: number; missing: string[]; faulty: string[] } {
  if (!required.length) return { score: 30, missing: [], faulty: [] };
  const missing: string[] = [];
  const faulty: string[] = [];
  let matched = 0;
  for (const code of required) {
    const eq = room.equipment.find(e => e.code === code);
    if (!eq) { missing.push(code); }
    else if (eq.status !== 'WORKING') { faulty.push(code); }
    else matched++;
  }
  return { score: Math.round(30 * (matched / required.length)), missing, faulty };
}

function scorePrice(roomPrice: number, maxPrice: number | undefined, prices: number[]): number {
  if (maxPrice && roomPrice > maxPrice) return 0;
  if (!prices.length) return 5;
  const minP = Math.min(...prices);
  const maxP = Math.max(...prices);
  if (maxP === minP) return 5;
  return Math.round(5 * (1 - (roomPrice - minP) / (maxP - minP)));
}

function buildMatchReason(room: RoomSummary, attendees: number, required: string[], missing: string[], faulty: string[], available: boolean, signals: { avgRating: number | null; bayesRating: number | null; openIssues: number }, warnings: string[]): string {
  const parts: string[] = [];
  parts.push(`Seats ${room.capacity} for your ${attendees}`);
  if (required.length && !missing.length && !faulty.length) {
    const names = required.map(c => room.equipment.find(e => e.code === c)?.name ?? c);
    parts.push(`has the ${names.join(' and ')} you asked for`);
  }
  if (missing.length) parts.push(`missing: ${missing.join(', ')}`);
  if (faulty.length) parts.push(`${faulty.join(', ')} reported faulty`);
  if (available) parts.push(`free at requested time`);
  if (signals.bayesRating) parts.push(`rated ${signals.bayesRating.toFixed(1)}/10`);
  if (warnings.length) parts.push(warnings[0]);
  return parts.join(', ') + '.';
}

function isWithinHours(room: RoomSummary, startAt: Date, endAt: Date): boolean {
  const tz = room.timezone;
  const startZ = toZonedTime(startAt, tz);
  const endZ = toZonedTime(endAt, tz);
  const day = startZ.getDay() === 0 ? 7 : startZ.getDay();
  const openDays: number[] = parseJson(room.openDays, [1,2,3,4,5]);
  if (!openDays.includes(day)) return false;
  const [oH, oM] = room.openTime.split(':').map(Number);
  const [cH, cM] = room.closeTime.split(':').map(Number);
  const openMin = oH * 60 + oM;
  const closeMin = cH * 60 + cM;
  const sMin = startZ.getHours() * 60 + startZ.getMinutes();
  const eMin = endZ.getHours() * 60 + endZ.getMinutes();
  return sMin >= openMin && eMin <= closeMin;
}

export function createSearchService(
  db: Knex,
  getRooms: () => RoomsService,
  getBookings: () => BookingService,
  getInsights: () => InsightsService,
  getRanking: () => RankingService
): SearchService {
  return {
    async searchRooms(criteria: SearchCriteria, actor?): Promise<SearchResponse> {
      const startAt = parseISO(criteria.startAt);
      const endAt = parseISO(criteria.endAt);
      const required = criteria.requiredEquipment ?? [];

      // 1. Candidate set: ACTIVE rooms
      let q = db('rooms').where('status', 'ACTIVE').whereNull('deleted_at');
      if (criteria.locationId) q = q.where('location_id', criteria.locationId);
      if (criteria.city) {
        const locs = await db('locations').where('city', 'like', `%${criteria.city}%`).select('id');
        q = q.whereIn('location_id', locs.map((l: { id: string }) => l.id));
      }
      q = q.where('capacity', '>=', criteria.attendeeCount);

      const rawRooms = await q;
      const roomIds = rawRooms.map((r: { id: string }) => r.id);
      if (!roomIds.length) return { matches: [], alternatives: [], busyWarning: null, participantConflicts: [] };

      const roomSummaries = await getRooms().getRoomSummaries(roomIds);
      const conflictMap = await getBlockingForRooms(db, roomIds, startAt, endAt);
      const signals = await getRanking().getSignals(roomIds);
      const prices = roomSummaries.map(r => r.hourlyPrice);

      const matches: RoomMatch[] = [];
      const conflictMatches: RoomMatch[] = [];

      for (const room of roomSummaries) {
        if (!isWithinHours(room, startAt, endAt)) continue;
        const { score: eqScore, missing, faulty } = scoreEquipment(room, required);
        // Exclude rooms missing required equipment unless < 3 results
        if (missing.length > 0 && roomSummaries.length >= 3) continue;
        // Price exclusion
        if (criteria.maxHourlyPrice && room.hourlyPrice > criteria.maxHourlyPrice * 1.25) continue;

        const available = !conflictMap.has(room.id);
        const sig = signals[room.id];
        const ratingScore = sig?.bayesRating ? Math.round((sig.bayesRating / 10) * 10) - 2 * Math.min(sig.openIssues, 3) : 7;
        const capScore = scoreCapacity(room.capacity, criteria.attendeeCount);
        const avScore = available ? 20 : 0;
        const priceScore = scorePrice(room.hourlyPrice, criteria.maxHourlyPrice, prices);
        const vibeScore = criteria.vibe && room.vibe === criteria.vibe ? 5 : 0;
        const breakdown: MatchBreakdown = { capacity: capScore, equipment: eqScore, availability: avScore, rating: Math.max(0, ratingScore), price: priceScore, vibe: vibeScore };
        const matchScore = Object.values(breakdown).reduce((a, b) => a + b, 0);
        const warnings: string[] = [];
        if (faulty.length) warnings.push(`${faulty.join(', ')} reported faulty`);
        const matchReason = buildMatchReason(room, criteria.attendeeCount, required, missing, faulty, available, sig ?? { avgRating: null, bayesRating: null, openIssues: 0 }, warnings);

        const match: RoomMatch = { room, matchScore, matchReason, breakdown, availability: available ? 'FREE' : 'CONFLICT', missingEquipment: missing, faultyEquipment: faulty, warnings };
        if (available) matches.push(match);
        else conflictMatches.push(match);
      }

      // Sort by matchScore desc, then price asc, then name
      const sortFn = (a: RoomMatch, b: RoomMatch) =>
        b.matchScore - a.matchScore || a.room.hourlyPrice - b.room.hourlyPrice || a.room.name.localeCompare(b.room.name);

      matches.sort(sortFn);
      conflictMatches.sort(sortFn);

      // If < 3 FREE matches, include CONFLICT rooms in matches
      let finalMatches = matches;
      const alternatives: AlternativeSlot[] = [];
      if (matches.length < 3) {
        finalMatches = [...matches, ...conflictMatches];
      } else {
        // CONFLICT rooms become alternatives: find nearest free window
        for (const cm of conflictMatches.slice(0, 3)) {
          for (let offset = 30; offset <= 180; offset += 30) {
            const altStart = addMinutes(startAt, offset);
            const altEnd = addMinutes(endAt, offset);
            const alts = await getBlockingForRooms(db, [cm.room.id], altStart, altEnd);
            if (!alts.has(cm.room.id)) {
              alternatives.push({ roomId: cm.room.id, roomName: cm.room.name, startAt: altStart.toISOString(), endAt: altEnd.toISOString(), matchScore: cm.matchScore, reason: `${cm.room.name} free ${offset < 60 ? `${offset}min` : `${offset/60}h`} later` });
              break;
            }
          }
        }
      }

      // Busy warning from insights
      const busyWarning = await getInsights().getBusyWarning({ locationId: criteria.locationId, startAt: criteria.startAt, endAt: criteria.endAt }).catch(() => null);

      // Participant conflicts
      const participantEmails = criteria.participantEmails ?? [];
      const participantConflicts: { email: string; startAt: string; endAt: string }[] = [];
      for (const email of participantEmails) {
        const user = await db('users').where('email', email).first();
        if (!user) continue;
        const conflict = await db('bookings').where('client_id', user.id).whereIn('status', ['CONFIRMED', 'CHECKED_IN']).where('start_at', '<', toDbDt(endAt)).where('end_at', '>', toDbDt(startAt)).first();
        if (conflict) participantConflicts.push({ email, startAt: conflict.start_at, endAt: conflict.end_at });
      }

      return { matches: finalMatches.slice(0, criteria.limit ?? 20), alternatives, busyWarning, participantConflicts };
    },

    async getAvailability(roomId: string, dateIso: string): Promise<SlotDto[]> {
      const room = await getRooms().getRoomSummary(roomId);
      if (!room) return [];
      const tz = room.timezone;
      const date = new Date(dateIso + 'T00:00:00Z');
      const dateInTz = toZonedTime(date, tz);
      const [oH, oM] = room.openTime.split(':').map(Number);
      const [cH, cM] = room.closeTime.split(':').map(Number);
      const dayStart = new Date(dateInTz);
      dayStart.setHours(oH, oM, 0, 0);
      const dayEnd = new Date(dateInTz);
      dayEnd.setHours(cH, cM, 0, 0);
      const now = new Date();

      // Get all blocking bookings for this room on this date
      const bookingRows = await db('bookings')
        .where('room_id', roomId)
        .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'HELD'])
        .where('start_at', '<', toDbDt(dayEnd))
        .where('end_at', '>', toDbDt(dayStart));

      // Get blackouts
      const blackoutRows = await db('room_blackouts')
        .where('room_id', roomId)
        .where('start_at', '<', toDbDt(dayEnd))
        .where('end_at', '>', toDbDt(dayStart));

      const openDays: number[] = parseJson(room.openDays, [1,2,3,4,5]);
      const day = dateInTz.getDay() === 0 ? 7 : dateInTz.getDay();
      const closed = !openDays.includes(day);

      const slots: SlotDto[] = [];
      let cur = new Date(dayStart);
      while (cur < dayEnd) {
        const next = addMinutes(cur, 30);
        const slotStart = cur.toISOString();
        const slotEnd = next.toISOString();

        let state: SlotDto['state'] = 'FREE';
        if (closed) state = 'CLOSED';
        else if (isBefore(next, now)) state = 'PAST';
        else {
          for (const b of blackoutRows) {
            if (new Date(b.start_at) < next && new Date(b.end_at) > cur) { state = 'BLACKOUT'; break; }
          }
          if (state === 'FREE') {
            for (const b of bookingRows) {
              const bStart = new Date(b.start_at.replace(' ', 'T') + 'Z');
              const bEnd = new Date(b.end_at.replace(' ', 'T') + 'Z');
              if (bStart < next && bEnd > cur) {
                state = b.status === 'HELD' ? 'HELD' : 'BOOKED';
                break;
              }
            }
          }
        }
        slots.push({ startAt: slotStart, endAt: slotEnd, state });
        cur = next;
      }
      return slots;
    },
  };
}
