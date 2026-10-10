import type { Knex } from 'knex';
import bcrypt from 'bcryptjs';
import { SEED_IDS, SEED_PASSWORD } from '@meetmaze/shared/domain/seed-ids.js';

export async function seed(knex: Knex): Promise<void> {
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  
  // Create Owner
  await knex('users').insert({
    id: SEED_IDS.users.owner1,
    name: 'Anita Rao',
    email: 'owner@meetmaze.dev',
    password_hash: passwordHash,
    role: 'OWNER',
    company: 'Orbit Workspaces',
  }).onConflict('id').ignore();

  // Create Clients
  const clients = [
    { id: SEED_IDS.users.client1, name: 'Rahul Mehta', email: 'client@meetmaze.dev', company: 'Nimbus Tech' },
    { id: SEED_IDS.users.client2, name: 'Priya', email: 'priya@meetmaze.dev', company: null },
    { id: SEED_IDS.users.client3, name: 'Arjun', email: 'arjun@meetmaze.dev', company: null },
    { id: SEED_IDS.users.client4, name: 'Sneha', email: 'sneha@meetmaze.dev', company: null },
  ];

  for (const client of clients) {
    await knex('users').insert({
      id: client.id,
      name: client.name,
      email: client.email,
      password_hash: passwordHash,
      role: 'CLIENT',
      company: client.company,
    }).onConflict('id').ignore();
  }
}
