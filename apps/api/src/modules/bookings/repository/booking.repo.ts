import type { Knex } from 'knex';
import type { BookingDto } from '@meetmaze/shared/contracts';
import { v4 as uuid } from 'uuid';

// Map a DB row to a BookingDto
export function rowToDto(row: Record<string, unknown>, participants: { email: string; name?: string | null; status: string }[] = []): BookingDto {
  return {
    id: row['id'] as string,
    roomId: row['room_id'] as string,
    clientId: row['client_id'] as string,
    title: row['title'] as string,
    notes: row['notes'] as string | null,
    startAt: toIso(row['start_at'] as string),
    endAt: toIso(row['end_at'] as string),
    attendeeCount: row['attendee_count'] as number,
    requiredEquipment: parseJson<string[]>(row['required_equipment'], []),
    status: row['status'] as BookingDto['status'],
    holdExpiresAt: row['hold_expires_at'] ? toIso(row['hold_expires_at'] as string) : null,
    checkedInAt: row['checked_in_at'] ? toIso(row['checked_in_at'] as string) : null,
    source: (row['source'] ?? 'WEB') as BookingDto['source'],
    totalPrice: parseFloat(row['total_price'] as string ?? '0'),
    matchScore: row['match_score'] as number | null,
    matchReason: row['match_reason'] as string | null,
    participants,
    createdAt: toIso(row['created_at'] as string),
  };
}

function toIso(s: string | null): string {
  if (!s) return '';
  // MySQL DATETIME → 'YYYY-MM-DD HH:mm:ss' → ISO
  if (s.includes('T')) return s;
  return s.replace(' ', 'T') + '.000Z';
}

function parseJson<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') { try { return JSON.parse(val); } catch { return fallback; } }
  if (Array.isArray(val) || typeof val === 'object') return val as T;
  return fallback;
}

export async function getBookingWithParticipants(db: Knex, id: string): Promise<BookingDto | null> {
  const row = await db('bookings').where('id', id).first();
  if (!row) return null;
  const parts = await db('booking_participants').where('booking_id', id).select('email', 'name', 'status');
  return rowToDto(row, parts);
}

export async function insertParticipants(db: Knex, bookingId: string, emails: string[]): Promise<void> {
  if (!emails.length) return;
  const rows = emails.map(email => ({ id: uuid(), booking_id: bookingId, email, status: 'INVITED' }));
  await db('booking_participants').insert(rows);
}

export async function getBlockingBookings(db: Knex, roomId: string, startAt: Date, endAt: Date, excludeId?: string): Promise<Record<string, unknown>[]> {
  let q = db('bookings')
    .where('room_id', roomId)
    .whereIn('status', ['CONFIRMED', 'CHECKED_IN', 'HELD'])
    .where(function() {
      this.where('status', '!=', 'HELD').orWhere('hold_expires_at', '>', new Date());
    })
    .where('start_at', '<', endAt.toISOString().slice(0, 19).replace('T', ' '))
    .where('end_at', '>', startAt.toISOString().slice(0, 19).replace('T', ' '));
  if (excludeId) q = q.where('id', '!=', excludeId);
  return q;
}

export async function findParticipantConflicts(db: Knex, emails: string[], startAt: Date, endAt: Date): Promise<{ email: string; startAt: string; endAt: string }[]> {
  if (!emails.length) return [];
  const users = await db('users').whereIn('email', emails).select('id', 'email');
  const conflicts: { email: string; startAt: string; endAt: string }[] = [];
  for (const user of users) {
    // Check if this user has a blocking booking overlapping the window
    const conflict = await db('bookings')
      .where('client_id', user.id)
      .whereIn('status', ['CONFIRMED', 'CHECKED_IN'])
      .where('start_at', '<', endAt.toISOString().slice(0, 19).replace('T', ' '))
      .where('end_at', '>', startAt.toISOString().slice(0, 19).replace('T', ' '))
      .first();
    if (conflict) {
      conflicts.push({ email: user.email, startAt: toIso(conflict.start_at), endAt: toIso(conflict.end_at) });
    }
  }
  return conflicts;
}
