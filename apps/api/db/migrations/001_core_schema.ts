import type { Knex } from 'knex';
export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(255) NOT NULL,
  company VARCHAR(160) NULL,
  phone VARCHAR(32) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS locations (
  id CHAR(36) PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  address_line VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NULL,
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
  latitude REAL NULL, longitude REAL NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_loc_owner FOREIGN KEY (owner_id) REFERENCES users(id)
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS rooms (
  id CHAR(36) PRIMARY KEY,
  owner_id CHAR(36) NOT NULL,
  location_id CHAR(36) NOT NULL,
  name VARCHAR(160) NOT NULL,
  description TEXT NULL,
  floor VARCHAR(32) NULL,
  capacity INTEGER NOT NULL,
  room_type VARCHAR(255) NOT NULL DEFAULT 'MEETING',
  vibe VARCHAR(255) NOT NULL DEFAULT 'FORMAL',
  hourly_price REAL NOT NULL DEFAULT 0,
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  photos TEXT NOT NULL DEFAULT '[]',
  status VARCHAR(255) NOT NULL DEFAULT 'ACTIVE',
  open_time TIME NOT NULL DEFAULT '09:00:00',
  close_time TIME NOT NULL DEFAULT '19:00:00',
  open_days TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
  min_booking_minutes INTEGER NOT NULL DEFAULT 30,
  max_booking_minutes INTEGER NOT NULL DEFAULT 480,
  buffer_minutes INTEGER NOT NULL DEFAULT 0,
  checkin_grace_minutes TINYINTEGER NOT NULL DEFAULT 15,
  qr_token CHAR(36) NOT NULL UNIQUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at DATETIME NULL,
  CONSTRAINT fk_room_owner FOREIGN KEY (owner_id) REFERENCES users(id),
  CONSTRAINT fk_room_loc FOREIGN KEY (location_id) REFERENCES locations(id)
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS equipment_types (
  id CHAR(36) PRIMARY KEY,
  code VARCHAR(40) NOT NULL UNIQUE,
  name VARCHAR(80) NOT NULL,
  icon VARCHAR(40) NOT NULL,
  category VARCHAR(255) NOT NULL
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS room_equipment (
  id CHAR(36) PRIMARY KEY,
  room_id CHAR(36) NOT NULL,
  equipment_type_id CHAR(36) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status VARCHAR(255) NOT NULL DEFAULT 'WORKING',
  notes VARCHAR(255) NULL,
  flagged_at DATETIME NULL,
  flagged_reason VARCHAR(255) NULL,
  UNIQUE (room_id, equipment_type_id),
  CONSTRAINT fk_re_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  CONSTRAINT fk_re_type FOREIGN KEY (equipment_type_id) REFERENCES equipment_types(id)
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS room_blackouts (
  id CHAR(36) PRIMARY KEY,
  room_id CHAR(36) NOT NULL,
  start_at DATETIME NOT NULL, end_at DATETIME NOT NULL,
  reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_bo_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS bookings (
  id CHAR(36) PRIMARY KEY,
  room_id CHAR(36) NOT NULL,
  client_id CHAR(36) NOT NULL,
  title VARCHAR(160) NOT NULL,
  notes VARCHAR(500) NULL,
  start_at DATETIME NOT NULL,
  end_at DATETIME NOT NULL,
  attendee_count INTEGER NOT NULL,
  required_equipment TEXT NOT NULL DEFAULT '[]',
  status VARCHAR(255) NOT NULL,
  hold_expires_at DATETIME NULL,
  checked_in_at DATETIME NULL,
  cancelled_at DATETIME NULL,
  cancel_reason VARCHAR(255) NULL,
  source VARCHAR(255) NOT NULL DEFAULT 'WEB',
  total_price REAL NOT NULL DEFAULT 0,
  match_score TINYINTEGER NULL,
  match_reason VARCHAR(500) NULL,
  idempotency_key VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (client_id, idempotency_key),
  CONSTRAINT fk_b_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT fk_b_client FOREIGN KEY (client_id) REFERENCES users(id)
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS booking_participants (
  id CHAR(36) PRIMARY KEY,
  booking_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,
  email VARCHAR(190) NOT NULL,
  name VARCHAR(120) NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'INVITED',
  CONSTRAINT fk_bp_booking FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS reviews (
  id CHAR(36) PRIMARY KEY,
  booking_id CHAR(36) NOT NULL UNIQUE,
  room_id CHAR(36) NOT NULL,
  reviewer_id CHAR(36) NOT NULL,
  rating TINYINTEGER NOT NULL,
  comment VARCHAR(500) NULL,
  tags TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_rating CHECK (rating BETWEEN 1 AND 10),
  CONSTRAINT fk_r_booking FOREIGN KEY (booking_id) REFERENCES bookings(id),
  CONSTRAINT fk_r_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT fk_r_user FOREIGN KEY (reviewer_id) REFERENCES users(id)
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS room_issues (
  id CHAR(36) PRIMARY KEY,
  room_id CHAR(36) NOT NULL,
  booking_id CHAR(36) NULL,
  reporter_id CHAR(36) NOT NULL,
  equipment_type_id CHAR(36) NULL,
  issue_type VARCHAR(255) NOT NULL,
  description VARCHAR(500) NULL,
  status VARCHAR(255) NOT NULL DEFAULT 'OPEN',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  CONSTRAINT fk_i_room FOREIGN KEY (room_id) REFERENCES rooms(id),
  CONSTRAINT fk_i_user FOREIGN KEY (reporter_id) REFERENCES users(id)
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS room_stats (
  room_id CHAR(36) PRIMARY KEY,
  avg_rating REAL NULL,
  bayes_rating REAL NULL,
  review_count INTEGER NOT NULL DEFAULT 0,
  booking_count INTEGER NOT NULL DEFAULT 0,
  no_show_count INTEGER NOT NULL DEFAULT 0,
  open_issue_count INTEGER NOT NULL DEFAULT 0,
  utilization_pct REAL NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_rs_room FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS slot_demand_stats (
  location_id CHAR(36) NOT NULL,
  day_of_week TINYINTEGER NOT NULL,
  hour_of_day TINYINTEGER NOT NULL,
  fill_rate REAL NOT NULL,
  sample_size INTEGER NOT NULL,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (location_id, day_of_week, hour_of_day),
  CONSTRAINT fk_sds_loc FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE CASCADE
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS chat_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  state TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cs_user FOREIGN KEY (user_id) REFERENCES users(id)
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS chat_messages (
  id CHAR(36) PRIMARY KEY,
  session_id CHAR(36) NOT NULL,
  role VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  metadata TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cm_session FOREIGN KEY (session_id) REFERENCES chat_sessions(id) ON DELETE CASCADE
) `);
  await knex.raw(`
CREATE TABLE IF NOT EXISTS notifications (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  type VARCHAR(255) NOT NULL,
  title VARCHAR(160) NOT NULL,
  body VARCHAR(500) NOT NULL,
  data TEXT NULL,
  read_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_n_user FOREIGN KEY (user_id) REFERENCES users(id)
) `);
  // Seed equipment types
  await knex.raw(`
INSERT OR IGNORE INTO equipment_types (id, code, name, icon, category) VALUES
 ('e0000000-0000-4000-8000-000000000001','PROJECTOR','Projector','Projector','DISPLAY'),
 ('e0000000-0000-4000-8000-000000000002','TV_SCREEN','TV / Display Screen','Tv','DISPLAY'),
 ('e0000000-0000-4000-8000-000000000003','WHITEBOARD','Whiteboard','PenSquare','COLLABORATION'),
 ('e0000000-0000-4000-8000-000000000004','VIDEO_CONFERENCING','Video Conferencing','Video','AUDIO_VIDEO'),
 ('e0000000-0000-4000-8000-000000000005','SPEAKERPHONE','Speakerphone','Phone','AUDIO_VIDEO'),
 ('e0000000-0000-4000-8000-000000000006','MICROPHONE','Microphone','Mic','AUDIO_VIDEO'),
 ('e0000000-0000-4000-8000-000000000007','HDMI_ADAPTER','HDMI / Adapters','Cable','CONNECTIVITY'),
 ('e0000000-0000-4000-8000-000000000008','WIRELESS_CASTING','Wireless Casting','Cast','CONNECTIVITY'),
 ('e0000000-0000-4000-8000-000000000009','POWER_STRIPS','Power Strips','Plug','CONNECTIVITY'),
 ('e0000000-0000-4000-8000-00000000000a','AIR_CONDITIONING','Air Conditioning','Snowflake','COMFORT'),
 ('e0000000-0000-4000-8000-00000000000b','ACCESSIBLE','Wheelchair Accessible','Accessibility','ACCESSIBILITY')`);
}
export async function down(knex: Knex): Promise<void> {
  const tables = ['notifications','chat_messages','chat_sessions','slot_demand_stats','room_stats','room_issues','reviews','booking_participants','bookings','room_blackouts','room_equipment','equipment_types','rooms','locations','users'];
  for (const t of tables) await knex.schema.dropTableIfExists(t);
}