import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { SEED_IDS } from '@meetmaze/shared/domain';
import { v4 as uuid } from 'uuid';

export async function seed(knex: Knex): Promise<void> {
  const hash = await bcrypt.hash('Demo@1234', 10);

  // Users
  await knex('users').insert([
    { id: SEED_IDS.users.owner1, name: 'Anita Rao', email: 'owner@meetmaze.dev', password_hash: hash, role: 'OWNER', company: 'Orbit Workspaces' },
    { id: SEED_IDS.users.client1, name: 'Rahul Mehta', email: 'client@meetmaze.dev', password_hash: hash, role: 'CLIENT', company: 'Nimbus Tech' },
    { id: SEED_IDS.users.client2, name: 'Priya S', email: 'priya@meetmaze.dev', password_hash: hash, role: 'CLIENT', company: 'Nimbus Tech' },
    { id: SEED_IDS.users.client3, name: 'Arjun K', email: 'arjun@meetmaze.dev', password_hash: hash, role: 'CLIENT', company: 'Nimbus Tech' },
    { id: SEED_IDS.users.client4, name: 'Sneha V', email: 'sneha@meetmaze.dev', password_hash: hash, role: 'CLIENT', company: 'Nimbus Tech' },
  ]).onConflict('id').merge();

  // Locations
  await knex('locations').insert([
    { id: SEED_IDS.locations.indiranagar, owner_id: SEED_IDS.users.owner1, name: 'Indiranagar Hub', address_line: '100 Feet Road, Indiranagar', city: 'Bengaluru', state: 'Karnataka', timezone: 'Asia/Kolkata' },
    { id: SEED_IDS.locations.koramangala, owner_id: SEED_IDS.users.owner1, name: 'Koramangala Tower', address_line: '5th Block, Koramangala', city: 'Bengaluru', state: 'Karnataka', timezone: 'Asia/Kolkata' },
  ]).onConflict('id').merge();

  // Rooms
  const rooms = [
    { id: SEED_IDS.rooms.aurora, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.indiranagar, name: 'Aurora Boardroom', capacity: 12, room_type: 'BOARDROOM', vibe: 'FORMAL', hourly_price: 1800, qr_token: uuid(), photos: JSON.stringify([]) },
    { id: SEED_IDS.rooms.spark, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.indiranagar, name: 'Spark Huddle', capacity: 4, room_type: 'HUDDLE', vibe: 'CASUAL', hourly_price: 500, qr_token: uuid(), photos: JSON.stringify([]) },
    { id: SEED_IDS.rooms.zen, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.indiranagar, name: 'Zen Pod', capacity: 2, room_type: 'PHONE_BOOTH', vibe: 'QUIET', hourly_price: 250, qr_token: uuid(), photos: JSON.stringify([]) },
    { id: SEED_IDS.rooms.summit, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.koramangala, name: 'Summit Hall', capacity: 20, room_type: 'TRAINING', vibe: 'PRESENTATION', hourly_price: 2600, qr_token: uuid(), photos: JSON.stringify([]) },
    { id: SEED_IDS.rooms.ideation, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.koramangala, name: 'Ideation Studio', capacity: 8, room_type: 'MEETING', vibe: 'CREATIVE', hourly_price: 1100, qr_token: uuid(), photos: JSON.stringify([]) },
    { id: SEED_IDS.rooms.atlas, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.koramangala, name: 'Atlas Room', capacity: 10, room_type: 'MEETING', vibe: 'FORMAL', hourly_price: 1400, qr_token: uuid(), photos: JSON.stringify([]) },
  ];
  for (const r of rooms) await knex('rooms').insert(r).onConflict('id').merge();

  // Room equipment
  const eq = SEED_IDS.equipment;
  const roomEq = [
    // Aurora Boardroom: PROJECTOR, VIDEO_CONFERENCING, WHITEBOARD, AIR_CONDITIONING, POWER_STRIPS
    [SEED_IDS.rooms.aurora, [eq.PROJECTOR, eq.VIDEO_CONFERENCING, eq.WHITEBOARD, eq.AIR_CONDITIONING, eq.POWER_STRIPS]],
    // Spark Huddle: TV_SCREEN, WHITEBOARD, WIRELESS_CASTING
    [SEED_IDS.rooms.spark, [eq.TV_SCREEN, eq.WHITEBOARD, eq.WIRELESS_CASTING]],
    // Zen Pod: SPEAKERPHONE, POWER_STRIPS
    [SEED_IDS.rooms.zen, [eq.SPEAKERPHONE, eq.POWER_STRIPS]],
    // Summit Hall: PROJECTOR, MICROPHONE, VIDEO_CONFERENCING, AIR_CONDITIONING, ACCESSIBLE
    [SEED_IDS.rooms.summit, [eq.PROJECTOR, eq.MICROPHONE, eq.VIDEO_CONFERENCING, eq.AIR_CONDITIONING, eq.ACCESSIBLE]],
    // Ideation Studio: WHITEBOARD, TV_SCREEN, HDMI_ADAPTER, POWER_STRIPS
    [SEED_IDS.rooms.ideation, [eq.WHITEBOARD, eq.TV_SCREEN, eq.HDMI_ADAPTER, eq.POWER_STRIPS]],
    // Atlas Room: PROJECTOR(FAULTY), WHITEBOARD, VIDEO_CONFERENCING
    [SEED_IDS.rooms.atlas, [eq.PROJECTOR, eq.WHITEBOARD, eq.VIDEO_CONFERENCING]],
  ] as [string, string[]][];

  // Build equipment type id -> code map
  const eqTypes = await knex('equipment_types').select('id', 'code');
  const idToCode = Object.fromEntries(eqTypes.map((e: { id: string; code: string }) => [e.id, e.code]));

  for (const [roomId, eqIds] of roomEq) {
    for (const eqId of eqIds) {
      const isAtlasProjector = roomId === SEED_IDS.rooms.atlas && eqId === eq.PROJECTOR;
      await knex('room_equipment').insert({
        id: uuid(),
        room_id: roomId,
        equipment_type_id: eqId,
        quantity: 1,
        status: isAtlasProjector ? 'FAULTY' : 'WORKING',
        flagged_at: isAtlasProjector ? new Date().toISOString() : null,
        flagged_reason: isAtlasProjector ? 'Reported by user: not working' : null,
      }).onConflict(['room_id', 'equipment_type_id']).merge();
    }
  }
}
