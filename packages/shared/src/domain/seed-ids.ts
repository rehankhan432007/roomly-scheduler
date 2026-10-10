// Fixed seed IDs - all demo passwords: Demo@1234
export const SEED_IDS = {
  users: {
    owner1:  'a0000000-0000-4000-8000-000000000001', // owner@meetmaze.dev  Anita Rao
    client1: 'a0000000-0000-4000-8000-000000000011', // client@meetmaze.dev Rahul Mehta
    client2: 'a0000000-0000-4000-8000-000000000012', // priya@meetmaze.dev
    client3: 'a0000000-0000-4000-8000-000000000013', // arjun@meetmaze.dev
    client4: 'a0000000-0000-4000-8000-000000000014', // sneha@meetmaze.dev
  },
  locations: {
    indiranagar: 'b0000000-0000-4000-8000-000000000001',
    koramangala: 'b0000000-0000-4000-8000-000000000002',
  },
  rooms: {
    aurora:    'c0000000-0000-4000-8000-000000000001', // Aurora Boardroom
    spark:     'c0000000-0000-4000-8000-000000000002', // Spark Huddle
    zen:       'c0000000-0000-4000-8000-000000000003', // Zen Pod
    summit:    'c0000000-0000-4000-8000-000000000004', // Summit Hall
    ideation:  'c0000000-0000-4000-8000-000000000005', // Ideation Studio
    atlas:     'c0000000-0000-4000-8000-000000000006', // Atlas Room
  },
  equipment: {
    PROJECTOR:           'e0000000-0000-4000-8000-000000000001',
    TV_SCREEN:           'e0000000-0000-4000-8000-000000000002',
    WHITEBOARD:          'e0000000-0000-4000-8000-000000000003',
    VIDEO_CONFERENCING:  'e0000000-0000-4000-8000-000000000004',
    SPEAKERPHONE:        'e0000000-0000-4000-8000-000000000005',
    MICROPHONE:          'e0000000-0000-4000-8000-000000000006',
    HDMI_ADAPTER:        'e0000000-0000-4000-8000-000000000007',
    WIRELESS_CASTING:    'e0000000-0000-4000-8000-000000000008',
    POWER_STRIPS:        'e0000000-0000-4000-8000-000000000009',
    AIR_CONDITIONING:    'e0000000-0000-4000-8000-00000000000a',
    ACCESSIBLE:          'e0000000-0000-4000-8000-00000000000b',
  },
} as const;
