import type { NotificationService, ModuleContext } from '@meetmaze/shared/contracts';

export function createNotificationsStub(ctx: ModuleContext): NotificationService {
  const log = ctx.logger;
  return {
    async notify(userId, n) { log.info(`[STUB] notifications.notify(${userId}, ${n.type}: ${n.title})`); },
  };
}
