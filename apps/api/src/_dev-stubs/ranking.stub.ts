import type { RankingService, RoomSignals } from '@meetmaze/shared/contracts';

export class RankingServiceStub implements RankingService {
  async getSignals(_roomIds: string[]): Promise<Record<string, RoomSignals>> {
    return {};
  }
  async recomputeRoom(_roomId: string): Promise<void> {
    // no-op
  }
}
