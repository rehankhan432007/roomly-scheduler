import type { Knex } from 'knex';
import { v4 as uuid } from 'uuid';
import { SEED_IDS } from '@meetmaze/shared/domain/seed-ids.js';

export async function seed(knex: Knex): Promise<void> {
  // Locations
  await knex('locations').insert([
    {
      id: SEED_IDS.locations.indiranagarHub,
      owner_id: SEED_IDS.users.owner1,
      name: 'Indiranagar Hub',
      address_line: '100ft Road, Indiranagar',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      timezone: 'Asia/Kolkata',
    },
    {
      id: SEED_IDS.locations.koramanglaTower,
      owner_id: SEED_IDS.users.owner1,
      name: 'Koramangala Tower',
      address_line: '80ft Road, Koramangala',
      city: 'Bengaluru',
      state: 'Karnataka',
      country: 'India',
      timezone: 'Asia/Kolkata',
    }
  ]).onConflict('id').ignore();

  // Rooms
  const photos = (slug: string) => JSON.stringify([
    `https://picsum.photos/seed/${slug}-1/800/500`,
    `https://picsum.photos/seed/${slug}-2/800/500`,
    `https://picsum.photos/seed/${slug}-3/800/500`,
  ]);

  await knex('rooms').insert([
    {
      id: SEED_IDS.rooms.auroraBoardroom, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.indiranagarHub,
      name: 'Aurora Boardroom', description: 'Premium boardroom for executive meetings.', capacity: 12, room_type: 'BOARDROOM', vibe: 'FORMAL', hourly_price: 1800,
      photos: photos('aurora'), qr_token: uuid(), open_time: '09:00:00', close_time: '19:00:00', buffer_minutes: 15, checkin_grace_minutes: 15,
    },
    {
      id: SEED_IDS.rooms.sparkHuddle, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.indiranagarHub,
      name: 'Spark Huddle', description: 'Casual huddle space for quick catch-ups.', capacity: 4, room_type: 'HUDDLE', vibe: 'CASUAL', hourly_price: 500,
      photos: photos('spark'), qr_token: uuid(), open_time: '09:00:00', close_time: '19:00:00', buffer_minutes: 0, checkin_grace_minutes: 10,
    },
    {
      id: SEED_IDS.rooms.zenPod, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.indiranagarHub,
      name: 'Zen Pod', description: 'Quiet phone booth for focused calls.', capacity: 2, room_type: 'PHONE_BOOTH', vibe: 'QUIET', hourly_price: 250,
      photos: photos('zen'), qr_token: uuid(), open_time: '09:00:00', close_time: '20:00:00', buffer_minutes: 0, checkin_grace_minutes: 10,
    },
    {
      id: SEED_IDS.rooms.summitHall, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.koramanglaTower,
      name: 'Summit Hall', description: 'Large training room with full presentation setup.', capacity: 20, room_type: 'TRAINING', vibe: 'PRESENTATION', hourly_price: 2600,
      photos: photos('summit'), qr_token: uuid(), open_time: '08:00:00', close_time: '20:00:00', buffer_minutes: 30, checkin_grace_minutes: 15,
    },
    {
      id: SEED_IDS.rooms.ideationStudio, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.koramanglaTower,
      name: 'Ideation Studio', description: 'Creative meeting space with multiple whiteboards.', capacity: 8, room_type: 'MEETING', vibe: 'CREATIVE', hourly_price: 1100,
      photos: photos('ideation'), qr_token: uuid(), open_time: '09:00:00', close_time: '19:00:00', buffer_minutes: 15, checkin_grace_minutes: 15,
    },
    {
      id: SEED_IDS.rooms.atlasRoom, owner_id: SEED_IDS.users.owner1, location_id: SEED_IDS.locations.koramanglaTower,
      name: 'Atlas Room', description: 'Standard meeting room for team discussions.', capacity: 10, room_type: 'MEETING', vibe: 'FORMAL', hourly_price: 1400,
      photos: photos('atlas'), qr_token: uuid(), open_time: '09:00:00', close_time: '19:00:00', buffer_minutes: 0, checkin_grace_minutes: 15,
    }
  ]).onConflict('id').ignore();

  // Equipment mapping
  const eqData = [
    { room: SEED_IDS.rooms.auroraBoardroom, items: ['projector', 'videoConferencing', 'whiteboard', 'airConditioning', 'powerStrips'] },
    { room: SEED_IDS.rooms.sparkHuddle, items: ['tvScreen', 'whiteboard', 'wirelessCasting'] },
    { room: SEED_IDS.rooms.zenPod, items: ['speakerphone', 'powerStrips'] },
    { room: SEED_IDS.rooms.summitHall, items: ['projector', 'microphone', 'videoConferencing', 'airConditioning', 'accessible'] },
    { room: SEED_IDS.rooms.ideationStudio, items: ['whiteboard', 'tvScreen', 'hdmiAdapter', 'powerStrips'] },
    { room: SEED_IDS.rooms.atlasRoom, items: ['projector', 'whiteboard', 'videoConferencing'] },
  ];

  const eqRows: any[] = [];
  for (const r of eqData) {
    for (const code of r.items) {
      const typeId = SEED_IDS.equipmentTypes[code as keyof typeof SEED_IDS.equipmentTypes];
      let status = 'WORKING';
      let flaggedAt = null;
      let flaggedReason = null;
      
      // Seed a faulty projector in Atlas Room
      if (r.room === SEED_IDS.rooms.atlasRoom && code === 'projector') {
        status = 'FAULTY';
        flaggedAt = new Date();
        flaggedReason = 'Lamp is flickering';
      }

      eqRows.push({
        id: uuid(),
        room_id: r.room,
        equipment_type_id: typeId,
        quantity: 1,
        status,
        flagged_at: flaggedAt,
        flagged_reason: flaggedReason,
      });
    }
  }

  await knex('room_equipment').insert(eqRows).onConflict(['room_id', 'equipment_type_id']).ignore();

  // Blackouts
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  nextWeek.setHours(10, 0, 0, 0);
  const nextWeekEnd = new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000);

  await knex('room_blackouts').insert([
    { id: uuid(), room_id: SEED_IDS.rooms.auroraBoardroom, start_at: nextWeek, end_at: nextWeekEnd, reason: 'Deep cleaning' }
  ]).onConflict('id').ignore();
}
