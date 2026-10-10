import type { Knex } from 'knex';
import { generateId } from '@meetmaze/shared/core';
import { SEED_IDS } from '@meetmaze/shared/domain';

export async function seed(knex: Knex): Promise<void> {
  const now = new Date();

  // 1. room_stats (for all 6 rooms)
  const roomStats = [
    { room_id: SEED_IDS.rooms.aurora, avg_rating: 8.5, bayes_rating: 8.4, review_count: 12, booking_count: 50, no_show_count: 2, open_issue_count: 0, utilization_pct: 65.5, updated_at: now },
    { room_id: SEED_IDS.rooms.spark, avg_rating: 7.2, bayes_rating: 7.1, review_count: 5, booking_count: 20, no_show_count: 1, open_issue_count: 0, utilization_pct: 40.2, updated_at: now },
    { room_id: SEED_IDS.rooms.zen, avg_rating: 9.0, bayes_rating: 8.0, review_count: 3, booking_count: 15, no_show_count: 0, open_issue_count: 0, utilization_pct: 25.0, updated_at: now },
    { room_id: SEED_IDS.rooms.summit, avg_rating: 8.0, bayes_rating: 7.8, review_count: 8, booking_count: 30, no_show_count: 3, open_issue_count: 0, utilization_pct: 55.8, updated_at: now },
    { room_id: SEED_IDS.rooms.ideation, avg_rating: 7.8, bayes_rating: 7.6, review_count: 6, booking_count: 25, no_show_count: 2, open_issue_count: 0, utilization_pct: 45.5, updated_at: now },
    { room_id: SEED_IDS.rooms.atlas, avg_rating: 6.5, bayes_rating: 6.7, review_count: 10, booking_count: 40, no_show_count: 4, open_issue_count: 1, utilization_pct: 60.0, updated_at: now },
  ];

  await knex('room_stats').insert(roomStats).onConflict('room_id').merge();

  // 2. reviews (idempotent setup - just add a few specific ones we know we need, especially for Atlas Room)
  // We'll insert a specific booking for Atlas to attach the review to
  const atlasBookingId = 'd0000000-0000-4000-8000-000000000003';
  
  // Create booking if it doesn't exist (using raw INSERT IGNORE)
  await knex.raw(`
    INSERT IGNORE INTO bookings (id, room_id, client_id, title, start_at, end_at, attendee_count, status, source, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    atlasBookingId, SEED_IDS.rooms.atlas, SEED_IDS.users.client, 'Client Presentation (Past)',
    new Date(now.getTime() - 48 * 60 * 60 * 1000), new Date(now.getTime() - 47 * 60 * 60 * 1000),
    8, 'COMPLETED', 'WEB', now, now
  ]);

  const reviewId = 'r0000000-0000-4000-8000-000000000001';
  await knex.raw(`
    INSERT IGNORE INTO reviews (id, booking_id, room_id, reviewer_id, rating, comment, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    reviewId, atlasBookingId, SEED_IDS.rooms.atlas, SEED_IDS.users.client,
    4, 'Projector not working, very disappointed.', JSON.stringify(['EQUIPMENT_ISSUE']), now
  ]);

  // 3. room_issues (Atlas Room projector broken)
  const issueId = 'i0000000-0000-4000-8000-000000000001';
  await knex.raw(`
    INSERT IGNORE INTO room_issues (id, room_id, booking_id, reporter_id, equipment_type_id, issue_type, description, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    issueId, SEED_IDS.rooms.atlas, atlasBookingId, SEED_IDS.users.client,
    SEED_IDS.equipment.projector, 'EQUIPMENT_BROKEN', 'Projector wouldn\'t turn on during the meeting.', 'OPEN', now
  ]);

  // 4. slot_demand_stats (fake some data for Indiranagar & Koramangala)
  // Monday/Tuesday 10-12 ~90%
  const demandStats = [];
  for (const locId of [SEED_IDS.locations.indiranagar, SEED_IDS.locations.koramangala]) {
    for (const dow of [1, 2]) { // Mon, Tue
      for (const hour of [10, 11]) {
        demandStats.push({ location_id: locId, day_of_week: dow, hour_of_day: hour, fill_rate: 90.0, sample_size: 16, updated_at: now });
      }
    }
    // Quiet window Friday afternoon
    demandStats.push({ location_id: locId, day_of_week: 5, hour_of_day: 15, fill_rate: 20.0, sample_size: 8, updated_at: now });
    demandStats.push({ location_id: locId, day_of_week: 5, hour_of_day: 16, fill_rate: 15.0, sample_size: 8, updated_at: now });
  }

  for (const stat of demandStats) {
    await knex.raw(`
      INSERT INTO slot_demand_stats (location_id, day_of_week, hour_of_day, fill_rate, sample_size, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE fill_rate = VALUES(fill_rate), sample_size = VALUES(sample_size), updated_at = VALUES(updated_at)
    `, [stat.location_id, stat.day_of_week, stat.hour_of_day, stat.fill_rate, stat.sample_size, stat.updated_at]);
  }

  // 5. notifications
  const notif1 = generateId();
  const notif2 = generateId();
  await knex.raw(`
    INSERT IGNORE INTO notifications (id, user_id, type, title, body, data, created_at)
    VALUES 
    (?, ?, ?, ?, ?, ?, ?),
    (?, ?, ?, ?, ?, ?, ?)
  `, [
    notif1, SEED_IDS.users.client, 'REVIEW_REQUESTED', 'How was Zen Pod?', 'Rate it in 10 seconds.', JSON.stringify({ roomId: SEED_IDS.rooms.zen }), now,
    notif2, SEED_IDS.users.owner, 'ISSUE_REPORTED', 'Issue reported for Atlas Room', 'EQUIPMENT_BROKEN: Projector wouldn\'t turn on...', JSON.stringify({ roomId: SEED_IDS.rooms.atlas, issueId }), now
  ]);

  console.log('[seeds] Part 4 Experience seeds applied.');
}
