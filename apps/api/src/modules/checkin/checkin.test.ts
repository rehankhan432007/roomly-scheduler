import { describe, it, expect } from 'vitest';
import { resolveCheckinState } from './index.js';

describe('resolveCheckinState', () => {
  it('returns NO_BOOKING if booking is null', () => {
    expect(resolveCheckinState(null, { checkinGraceMinutes: 15 }, new Date(), 10)).toBe('NO_BOOKING');
  });

  it('returns ALREADY_CHECKED_IN if status is CHECKED_IN', () => {
    const state = resolveCheckinState(
      { startAt: '2024-01-01T10:00:00Z', endAt: '2024-01-01T11:00:00Z', status: 'CHECKED_IN' },
      { checkinGraceMinutes: 15 },
      new Date('2024-01-01T10:05:00Z'),
      10
    );
    expect(state).toBe('ALREADY_CHECKED_IN');
  });

  it('returns TOO_EARLY if current time is before window opens', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    // Open before: 10 mins -> opens at 09:50
    // Current time: 09:40
    const state = resolveCheckinState(
      { startAt: start.toISOString(), endAt: '2024-01-01T11:00:00Z', status: 'CONFIRMED' },
      { checkinGraceMinutes: 15 },
      new Date('2024-01-01T09:40:00Z'),
      10
    );
    expect(state).toBe('TOO_EARLY');
  });

  it('returns OPEN if within window', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    // Open before: 10 mins -> opens at 09:50
    // Current time: 09:55
    const state = resolveCheckinState(
      { startAt: start.toISOString(), endAt: '2024-01-01T11:00:00Z', status: 'CONFIRMED' },
      { checkinGraceMinutes: 15 },
      new Date('2024-01-01T09:55:00Z'),
      10
    );
    expect(state).toBe('OPEN');
  });

  it('returns WINDOW_CLOSED if current time is after grace period', () => {
    const start = new Date('2024-01-01T10:00:00Z');
    // Grace: 15 mins -> closes at 10:15
    // Current time: 10:20
    const state = resolveCheckinState(
      { startAt: start.toISOString(), endAt: '2024-01-01T11:00:00Z', status: 'CONFIRMED' },
      { checkinGraceMinutes: 15 },
      new Date('2024-01-01T10:20:00Z'),
      10
    );
    expect(state).toBe('WINDOW_CLOSED');
  });
});
