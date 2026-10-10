import type { Knex } from 'knex';
import { SEED_IDS } from '@meetmaze/shared/domain';
import { v4 as uuid } from 'uuid';
import { addWeeks, subWeeks, setDay, setHours, setMinutes, setSeconds, setMilliseconds, addHours, format, isMonday, isTuesday, startOfDay } from 'date-fns';

// Seeded pseudo-random for determinism
function seededRng(seed: number) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) & 0xffffffff; return (s >>> 0) / 0xffffffff; };
}

const rng = seededRng(42);

function rngChoice<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

export async function seed(knex: Knex): Promise<void> {
  // Remove old part3 history bookings (idempotent)
  await knex('booking_participants').whereIn('booking_id',
    knex('bookings').where('source', 'WEB').where('notes', 'like', '%[seed-p3]%').select('id')
  ).delete();
  await knex('bookings').where('notes', 'like', '%[seed-p3]%').delete();

  const now = new Date();
  const clients = [SEED_IDS.users.client1, SEED_IDS.users.client2, SEED_IDS.users.client3, SEED_IDS.users.client4];
  const roomIds = Object.values(SEED_IDS.rooms);
  const indiranagar = [SEED_IDS.rooms.aurora, SEED_IDS.rooms.spark, SEED_IDS.rooms.zen];

  const toInsert: object[] = [];

  // Generate 8 weeks of history
  for (let w = 8; w >= 1; w--) {
    const weekStart = subWeeks(now, w);

    // Mon/Tue 10-12: heavy bookings (~90% fill) in Indiranagar
    for (const dayOffset of [1, 2]) { // 1=Mon 2=Tue
      const day = setDay(weekStart, dayOffset, { weekStartsOn: 1 });
      for (const roomId of indiranagar) {
        if (rng() < 0.9) {
          const startAt = setMilliseconds(setSeconds(setMinutes(setHours(day, 10), 0), 0), 0);
          const endAt = addHours(startAt, 2);
          const clientId = rngChoice(clients);
          const price = roomId === SEED_IDS.rooms.aurora ? 1800 : roomId === SEED_IDS.rooms.spark ? 500 : 250;
          toInsert.push({
            id: uuid(),
            room_id: roomId,
            client_id: clientId,
            title: `Weekly Sync ${format(day, 'EEE')}`,
            notes: '[seed-p3]',
            start_at: startAt.toISOString().slice(0, 19).replace('T', ' '),
            end_at: endAt.toISOString().slice(0, 19).replace('T', ' '),
            attendee_count: rngChoice([2, 4, 6, 8]),
            required_equipment: JSON.stringify([]),
            status: 'COMPLETED',
            source: 'WEB',
            total_price: price * 2,
            match_score: Math.floor(rng() * 30) + 70,
          });
        }
      }
    }

    // Afternoons: light bookings (30% fill) any day
    for (let d = 0; d < 5; d++) {
      const day = setDay(weekStart, d + 1, { weekStartsOn: 1 });
      const roomId = rngChoice(roomIds);
      if (rng() < 0.3) {
        const hour = rngChoice([13, 14, 15, 16, 17]);
        const startAt = setMilliseconds(setSeconds(setMinutes(setHours(day, hour), 0), 0), 0);
        const endAt = addHours(startAt, 1);
        const clientId = rngChoice(clients);
        const statusRoll = rng();
        const status = statusRoll < 0.05 ? 'CANCELLED' : statusRoll < 0.1 ? 'RELEASED' : 'COMPLETED';
        toInsert.push({
          id: uuid(),
          room_id: roomId,
          client_id: clientId,
          title: 'Afternoon Meeting',
          notes: '[seed-p3]',
          start_at: startAt.toISOString().slice(0, 19).replace('T', ' '),
          end_at: endAt.toISOString().slice(0, 19).replace('T', ' '),
          attendee_count: rngChoice([2, 3, 4]),
          required_equipment: JSON.stringify([]),
          status,
          cancelled_at: status === 'CANCELLED' ? now.toISOString().slice(0, 19).replace('T', ' ') : null,
          source: 'WEB',
          total_price: 1000,
          match_score: 75,
        });
      }
    }
  }

  // 3 upcoming CONFIRMED bookings for client@meetmaze.dev
  const tomorrow = addHours(now, 24);
  const upcomingBookings = [
    {
      id: 'f0000000-0000-4000-8000-000000000031',
      room_id: SEED_IDS.rooms.aurora,
      client_id: SEED_IDS.users.client1,
      title: 'Q4 Planning',
      notes: '[seed-p3]',
      start_at: setMilliseconds(setSeconds(setMinutes(setHours(addHours(now, 25), 10), 0), 0), 0).toISOString().slice(0, 19).replace('T', ' '),
      end_at: setMilliseconds(setSeconds(setMinutes(setHours(addHours(now, 25), 12), 0), 0), 0).toISOString().slice(0, 19).replace('T', ' '),
      attendee_count: 8,
      required_equipment: JSON.stringify(['PROJECTOR']),
      status: 'CONFIRMED',
      source: 'WEB',
      total_price: 3600,
      match_score: 88,
      match_reason: 'Seats 12 for your 8 people, has the projector you asked for, rated 8.7/10.',
    },
    {
      id: 'f0000000-0000-4000-8000-000000000032',
      room_id: SEED_IDS.rooms.ideation,
      client_id: SEED_IDS.users.client1,
      title: 'Design Sprint',
      notes: '[seed-p3]',
      start_at: setMilliseconds(setSeconds(setMinutes(setHours(addHours(now, 49), 14), 0), 0), 0).toISOString().slice(0, 19).replace('T', ' '),
      end_at: setMilliseconds(setSeconds(setMinutes(setHours(addHours(now, 49), 17), 0), 0), 0).toISOString().slice(0, 19).replace('T', ' '),
      attendee_count: 6,
      required_equipment: JSON.stringify(['WHITEBOARD']),
      status: 'CONFIRMED',
      source: 'WEB',
      total_price: 3300,
      match_score: 82,
      match_reason: 'Creative vibe, whiteboard available, seats 8 for 6.',
    },
    {
      id: 'f0000000-0000-4000-8000-000000000033',
      room_id: SEED_IDS.rooms.summit,
      client_id: SEED_IDS.users.client1,
      title: 'All Hands',
      notes: '[seed-p3]',
      start_at: setMilliseconds(setSeconds(setMinutes(setHours(addHours(now, 73), 9), 0), 0), 0).toISOString().slice(0, 19).replace('T', ' '),
      end_at: setMilliseconds(setSeconds(setMinutes(setHours(addHours(now, 73), 11), 0), 0), 0).toISOString().slice(0, 19).replace('T', ' '),
      attendee_count: 15,
      required_equipment: JSON.stringify(['PROJECTOR', 'MICROPHONE']),
      status: 'CONFIRMED',
      source: 'WEB',
      total_price: 5200,
      match_score: 91,
      match_reason: 'Seats 20 for 15, has projector and microphone, wheelchair accessible.',
    },
  ];

  for (const b of upcomingBookings) {
    toInsert.push(b);
  }

  // Batch insert
  const BATCH = 50;
  for (let i = 0; i < toInsert.length; i += BATCH) {
    await knex('bookings').insert(toInsert.slice(i, i + BATCH));
  }
}
