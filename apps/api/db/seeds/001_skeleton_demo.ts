// Skeleton seed: demo users, locations, rooms, equipment, room_stats
import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { SEED_IDS, DEMO_PASSWORD, SEED_USERS } from '@meetmaze/shared/domain';
import { v4 as uuid } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);

  // ---- Users (INSERT IGNORE) ----
  for (const u of SEED_USERS) {
    await knex.raw(
      `INSERT IGNORE INTO users (id, name, email, password_hash, role, company) VALUES (?, ?, ?, ?, ?, ?)`,
      [u.id, u.name, u.email, hash, u.role, u.company],
    );
  }

  // ---- Locations ----
  const locations = [
    {
      id: SEED_IDS.locations.indiranagar,
      owner_id: SEED_IDS.users.owner,
      name: 'Indiranagar Hub',
      address_line: '100 Feet Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      timezone: 'Asia/Kolkata',
    },
    {
      id: SEED_IDS.locations.koramangala,
      owner_id: SEED_IDS.users.owner,
      name: 'Koramangala Tower',
      address_line: '80 Feet Road, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      timezone: 'Asia/Kolkata',
    },
  ];

  for (const loc of locations) {
    await knex.raw(
      `INSERT IGNORE INTO locations (id, owner_id, name, address_line, city, state, country, timezone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [loc.id, loc.owner_id, loc.name, loc.address_line, loc.city, loc.state, loc.country, loc.timezone],
    );
  }

  // ---- Rooms ----
  const rooms = [
    { id: SEED_IDS.rooms.aurora, owner_id: SEED_IDS.users.owner, location_id: SEED_IDS.locations.indiranagar, name: 'Aurora Boardroom', capacity: 12, room_type: 'BOARDROOM', vibe: 'FORMAL', hourly_price: 1800, floor: '3', description: 'Premium boardroom with panoramic views', qr_token: uuid() },
    { id: SEED_IDS.rooms.spark, owner_id: SEED_IDS.users.owner, location_id: SEED_IDS.locations.indiranagar, name: 'Spark Huddle', capacity: 4, room_type: 'HUDDLE', vibe: 'CASUAL', hourly_price: 500, floor: '2', description: 'Cozy huddle space for quick meetings', qr_token: uuid() },
    { id: SEED_IDS.rooms.zen, owner_id: SEED_IDS.users.owner, location_id: SEED_IDS.locations.indiranagar, name: 'Zen Pod', capacity: 2, room_type: 'PHONE_BOOTH', vibe: 'QUIET', hourly_price: 250, floor: '1', description: 'Quiet phone booth for private calls', qr_token: uuid() },
    { id: SEED_IDS.rooms.summit, owner_id: SEED_IDS.users.owner, location_id: SEED_IDS.locations.koramangala, name: 'Summit Hall', capacity: 20, room_type: 'TRAINING', vibe: 'PRESENTATION', hourly_price: 2600, floor: '5', description: 'Large training hall with full AV setup', qr_token: uuid() },
    { id: SEED_IDS.rooms.ideation, owner_id: SEED_IDS.users.owner, location_id: SEED_IDS.locations.koramangala, name: 'Ideation Studio', capacity: 8, room_type: 'MEETING', vibe: 'CREATIVE', hourly_price: 1100, floor: '3', description: 'Creative space for brainstorming sessions', qr_token: uuid() },
    { id: SEED_IDS.rooms.atlas, owner_id: SEED_IDS.users.owner, location_id: SEED_IDS.locations.koramangala, name: 'Atlas Room', capacity: 10, room_type: 'MEETING', vibe: 'FORMAL', hourly_price: 1400, floor: '4', description: 'Formal meeting room for client presentations', qr_token: uuid() },
  ];

  for (const room of rooms) {
    await knex.raw(
      `INSERT IGNORE INTO rooms (id, owner_id, location_id, name, capacity, room_type, vibe, hourly_price, floor, description, qr_token) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [room.id, room.owner_id, room.location_id, room.name, room.capacity, room.room_type, room.vibe, room.hourly_price, room.floor, room.description, room.qr_token],
    );
  }

  // ---- Room Equipment ----
  const E = SEED_IDS.equipment;
  const R = SEED_IDS.rooms;
  const roomEquipment: { room_id: string; equipment_type_id: string; status?: string }[] = [
    // Aurora Boardroom
    { room_id: R.aurora, equipment_type_id: E.projector },
    { room_id: R.aurora, equipment_type_id: E.videoConferencing },
    { room_id: R.aurora, equipment_type_id: E.whiteboard },
    { room_id: R.aurora, equipment_type_id: E.airConditioning },
    { room_id: R.aurora, equipment_type_id: E.powerStrips },
    // Spark Huddle
    { room_id: R.spark, equipment_type_id: E.tvScreen },
    { room_id: R.spark, equipment_type_id: E.whiteboard },
    { room_id: R.spark, equipment_type_id: E.wirelessCasting },
    // Zen Pod
    { room_id: R.zen, equipment_type_id: E.speakerphone },
    { room_id: R.zen, equipment_type_id: E.powerStrips },
    // Summit Hall
    { room_id: R.summit, equipment_type_id: E.projector },
    { room_id: R.summit, equipment_type_id: E.microphone },
    { room_id: R.summit, equipment_type_id: E.videoConferencing },
    { room_id: R.summit, equipment_type_id: E.airConditioning },
    { room_id: R.summit, equipment_type_id: E.accessible },
    // Ideation Studio
    { room_id: R.ideation, equipment_type_id: E.whiteboard },
    { room_id: R.ideation, equipment_type_id: E.tvScreen },
    { room_id: R.ideation, equipment_type_id: E.hdmiAdapter },
    { room_id: R.ideation, equipment_type_id: E.powerStrips },
    // Atlas Room (FAULTY projector)
    { room_id: R.atlas, equipment_type_id: E.projector, status: 'FAULTY' },
    { room_id: R.atlas, equipment_type_id: E.whiteboard },
    { room_id: R.atlas, equipment_type_id: E.videoConferencing },
  ];

  for (const re of roomEquipment) {
    const reId = uuid();
    await knex.raw(
      `INSERT IGNORE INTO room_equipment (id, room_id, equipment_type_id, status) VALUES (?, ?, ?, ?)`,
      [reId, re.room_id, re.equipment_type_id, re.status ?? 'WORKING'],
    );
  }

  // ---- Room Stats ----
  for (const room of rooms) {
    await knex.raw(
      `INSERT IGNORE INTO room_stats (room_id, avg_rating, review_count, booking_count, utilization_pct) VALUES (?, NULL, 0, 0, 0)`,
      [room.id],
    );
  }
}
