import type { SearchService, SearchCriteria, SearchResponse, SlotDto } from '@meetmaze/shared/contracts';

export class SearchServiceStub implements SearchService {
  async searchRooms(_criteria: SearchCriteria): Promise<SearchResponse> {
    return { matches: [], alternatives: [], busyWarning: null, participantConflicts: [] };
  }
  async getAvailability(_roomId: string, _dateIso: string): Promise<SlotDto[]> {
    return [];
  }
}
