import type { FeatureManifest } from '@meetmaze/shared/contracts';

export const manifest: FeatureManifest = {
  id: 'account',
  part: 1,
  navItems: [
    {
      id: 'profile',
      label: 'Profile',
      href: '/profile',
      icon: 'User',
      portal: 'both',
      order: 90,
    },
  ],
};
