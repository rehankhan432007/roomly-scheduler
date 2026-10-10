import type { InsightsService, BusyWarning } from '@meetmaze/shared/contracts';

export class InsightsServiceStub implements InsightsService {
  async getBusyWarning(): Promise<BusyWarning | null> {
    return null;
  }
  async recompute(): Promise<void> {
    // no-op
  }
}
