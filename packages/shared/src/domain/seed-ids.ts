// Fixed seed IDs so every part's demo data lines up (B6)

export const SEED_IDS = {
  users: {
    owner: 'a0000000-0000-4000-8000-000000000001',
    client1: 'a0000000-0000-4000-8000-000000000011',
    client2: 'a0000000-0000-4000-8000-000000000012',
    client3: 'a0000000-0000-4000-8000-000000000013',
    client4: 'a0000000-0000-4000-8000-000000000014',
  },
  locations: {
    indiranagar: 'b0000000-0000-4000-8000-000000000001',
    koramangala: 'b0000000-0000-4000-8000-000000000002',
  },
  rooms: {
    aurora: 'c0000000-0000-4000-8000-000000000001',
    spark: 'c0000000-0000-4000-8000-000000000002',
    zen: 'c0000000-0000-4000-8000-000000000003',
    summit: 'c0000000-0000-4000-8000-000000000004',
    ideation: 'c0000000-0000-4000-8000-000000000005',
    atlas: 'c0000000-0000-4000-8000-000000000006',
  },
  equipment: {
    projector: 'e0000000-0000-4000-8000-000000000001',
    tvScreen: 'e0000000-0000-4000-8000-000000000002',
    whiteboard: 'e0000000-0000-4000-8000-000000000003',
    videoConferencing: 'e0000000-0000-4000-8000-000000000004',
    speakerphone: 'e0000000-0000-4000-8000-000000000005',
    microphone: 'e0000000-0000-4000-8000-000000000006',
    hdmiAdapter: 'e0000000-0000-4000-8000-000000000007',
    wirelessCasting: 'e0000000-0000-4000-8000-000000000008',
    powerStrips: 'e0000000-0000-4000-8000-000000000009',
    airConditioning: 'e0000000-0000-4000-8000-00000000000a',
    accessible: 'e0000000-0000-4000-8000-00000000000b',
  },
} as const;

export const DEMO_PASSWORD = 'Demo@1234';

export const SEED_USERS = [
  { id: SEED_IDS.users.owner, name: 'Anita Rao', email: 'owner@meetmaze.dev', role: 'OWNER' as const, company: 'Orbit Workspaces' },
  { id: SEED_IDS.users.client1, name: 'Rahul Mehta', email: 'client@meetmaze.dev', role: 'CLIENT' as const, company: 'Nimbus Tech' },
  { id: SEED_IDS.users.client2, name: 'Priya Sharma', email: 'priya@meetmaze.dev', role: 'CLIENT' as const, company: 'Nimbus Tech' },
  { id: SEED_IDS.users.client3, name: 'Arjun Patel', email: 'arjun@meetmaze.dev', role: 'CLIENT' as const, company: 'Nimbus Tech' },
  { id: SEED_IDS.users.client4, name: 'Sneha Gupta', email: 'sneha@meetmaze.dev', role: 'CLIENT' as const, company: 'Nimbus Tech' },
] as const;
