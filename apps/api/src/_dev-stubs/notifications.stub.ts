import type { NotificationService, NotificationInput } from '@meetmaze/shared/contracts';
import { logger } from '../core/logger.js';

export class NotificationServiceStub implements NotificationService {
  async notify(userId: string, n: NotificationInput): Promise<void> {
    logger.info({ userId, notification: n }, '[STUB] notifications.notify');
  }
}
