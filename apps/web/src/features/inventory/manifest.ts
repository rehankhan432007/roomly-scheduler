import type { FeatureManifest } from '@meetmaze/shared/contracts';

const manifest: FeatureManifest = {
  id: 'inventory',
  part: 2,
  navItems: [
    { id: 'dashboard', label: 'Dashboard', href: '/owner/dashboard', icon: 'LayoutDashboard', portal: 'owner', order: 100 },
    { id: 'rooms', label: 'My rooms', href: '/owner/rooms', icon: 'DoorOpen', portal: 'owner', order: 110 },
    { id: 'locations', label: 'Locations', href: '/owner/locations', icon: 'MapPin', portal: 'owner', order: 120 },
    { id: 'bookings', label: 'Bookings', href: '/owner/bookings', icon: 'CalendarCheck', portal: 'owner', order: 130 },
  ]
};

export default manifest;
