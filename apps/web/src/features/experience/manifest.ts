import type { FeatureManifest } from '@meetmaze/shared/contracts';

// We map components at integration time, but here we declare what we provide
export default {
  id: 'experience',
  part: 4,
  navItems: [
    { id: 'roombot', label: 'RoomBot', href: '/client/roombot', icon: 'Bot', portal: 'client', order: 300 },
    { id: 'notifications', label: 'Notifications', href: '/notifications', icon: 'Bell', portal: 'both', order: 310 },
    { id: 'owner-issues', label: 'Issues', href: '/owner/issues', icon: 'Wrench', portal: 'owner', order: 300 },
    { id: 'owner-reviews', label: 'Reviews', href: '/owner/reviews', icon: 'Star', portal: 'owner', order: 310 },
    { id: 'owner-insights', label: 'Insights', href: '/owner/insights', icon: 'BarChart3', portal: 'owner', order: 320 },
  ],
  // slots: {
  //   'header.right': [NotificationBell],
  //   'client.global': [RoomBotLauncher],
  //   'booking.card.actions': [BookingExperienceActions],
  //   'booking.detail.sections': [CheckinInfo, ReviewPrompt],
  //   'room.detail.sections': [RoomReviewsSection],
  //   'owner.dashboard.widgets': [InsightsWidget],
  //   'client.home.widgets': [PendingReviewsWidget],
  // },
} satisfies FeatureManifest;
