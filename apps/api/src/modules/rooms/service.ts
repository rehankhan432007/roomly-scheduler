import type { RoomsService, RoomSummary } from '@meetmaze/shared/contracts';
import type { ServiceRegistry } from '@meetmaze/shared/contracts';
import { RoomsRepository } from './repository.js';

export class RoomsServiceImpl implements RoomsService {
  constructor(
    private repo: RoomsRepository,
    private services: ServiceRegistry,
  ) {}

  async getRoomSummary(roomId: string): Promise<RoomSummary | null> {
    return this.repo.getRoomSummary(roomId);
  }

  async getRoomSummaries(roomIds: string[]): Promise<RoomSummary[]> {
    return this.repo.getRoomSummaries(roomIds);
  }

  async resolveRoomByQrToken(token: string): Promise<RoomSummary | null> {
    return this.repo.resolveRoomByQrToken(token);
  }

  async getOwnerId(roomId: string): Promise<string | null> {
    return this.repo.getOwnerId(roomId);
  }

  async flagEquipment(roomId: string, equipmentCode: string, reason: string): Promise<void> {
    await this.repo.flagEquipment(roomId, equipmentCode, reason);
    // Notify the owner
    const ownerId = await this.repo.getOwnerId(roomId);
    if (ownerId) {
      try {
        const notifService = this.services.get('notifications');
        await notifService.notify(ownerId, {
          type: 'EQUIPMENT_FLAGGED',
          title: 'Equipment flagged',
          body: `${equipmentCode} has been flagged as faulty: ${reason}`,
          data: { roomId, equipmentCode, reason },
        });
      } catch {
        // Notifications may be stubbed
      }
    }
  }

  async clearEquipmentFlag(roomId: string, equipmentCode: string): Promise<void> {
    await this.repo.clearEquipmentFlag(roomId, equipmentCode);
  }
}
