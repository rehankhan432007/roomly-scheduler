import type { FeatureManifest } from '@meetmaze/shared/contracts';

const manifest: FeatureManifest = {
  id: 'booking',
  part: 3,
  navItems: [
    { id: 'nav-search', label: 'Find a room', href: '/client/search', icon: 'search', portal: 'client', order: 210 },
    { id: 'nav-bookings', label: 'My bookings', href: '/client/bookings', icon: 'list', portal: 'client', order: 220 },
    { id: 'nav-calendar', label: 'Calendar', href: '/client/calendar', icon: 'calendar', portal: 'client', order: 230 },
  ],
};

export default manifest;
