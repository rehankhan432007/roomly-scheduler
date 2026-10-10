import type { BookingService, BookingDto, CreateBookingInput } from '@meetmaze/shared/contracts';

export class BookingServiceStub implements BookingService {
  async getBooking(_id: string): Promise<BookingDto | null> {
    return null;
  }
  async createHold(_input: CreateBookingInput, _actor: { userId: string }): Promise<BookingDto> {
    throw new Error('[STUB] bookings.createHold not implemented');
  }
  async confirm(_bookingId: string, _actor: { userId: string }): Promise<BookingDto> {
    throw new Error('[STUB] bookings.confirm not implemented');
  }
  async cancel(_bookingId: string, _actor: { userId: string }, _reason?: string): Promise<BookingDto> {
    throw new Error('[STUB] bookings.cancel not implemented');
  }
  async listMine(_userId: string, _scope: 'upcoming' | 'past' | 'cancelled'): Promise<BookingDto[]> {
    return [];
  }
  async findCheckinCandidate(): Promise<BookingDto | null> {
    return null;
  }
  async markCheckedIn(_bookingId: string, _at: Date): Promise<BookingDto> {
    throw new Error('[STUB] bookings.markCheckedIn not implemented');
  }
  async markReleased(_bookingId: string, _reason: string): Promise<BookingDto> {
    throw new Error('[STUB] bookings.markReleased not implemented');
  }
  async listDueForRelease(_now: Date): Promise<BookingDto[]> {
    return [];
  }
}
