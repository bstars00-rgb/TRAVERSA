import { describe, expect, it } from 'vitest';
import type { Itinerary, ItineraryItem } from '../../types';
import { validateItinerary } from './validator';
import { krw } from '../../utils/currency';

let seq = 0;
function item(partial: Partial<ItineraryItem>): ItineraryItem {
  seq += 1;
  return {
    id: `item${seq}`,
    type: 'activity',
    title: `일정 ${seq}`,
    startTime: '10:00',
    durationMinutes: 60,
    location: 'x',
    travelMinutesFromPrevious: 0,
    requiresBooking: false,
    bookingStatus: 'idea',
    weatherSensitive: false,
    physicalLoad: 'low',
    ...partial,
  };
}

function build(items: ItineraryItem[]): Itinerary {
  return {
    id: 'it1',
    tripId: 'tr1',
    destinationName: '하코네',
    days: [{ dayNumber: 1, date: '2026-08-14', title: 'Day 1', items }],
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

describe('일정 충돌 탐지 (ItineraryValidator)', () => {
  it('예약시간 중복을 탐지한다', () => {
    const issues = validateItinerary(
      build([
        item({ startTime: '10:00', durationMinutes: 120, requiresBooking: true }),
        item({ startTime: '11:00', durationMinutes: 60, requiresBooking: true }),
      ]),
    );
    expect(issues.some((i) => i.type === 'booking_time_overlap')).toBe(true);
  });

  it('이동시간 부족을 탐지한다', () => {
    const issues = validateItinerary(
      build([
        item({ startTime: '10:00', durationMinutes: 60 }),
        item({ startTime: '11:10', travelMinutesFromPrevious: 30 }),
      ]),
    );
    expect(issues.some((i) => i.type === 'insufficient_travel_time')).toBe(true);
  });

  it('하루 일정 과다를 탐지한다', () => {
    const issues = validateItinerary(
      build([
        item({ startTime: '08:00', durationMinutes: 240 }),
        item({ startTime: '12:00', durationMinutes: 240 }),
        item({ startTime: '16:00', durationMinutes: 240 }),
      ]),
    );
    expect(issues.some((i) => i.type === 'overpacked_day')).toBe(true);
  });

  it('고강도 일정 연속 + 휴식 부재를 탐지한다', () => {
    const issues = validateItinerary(
      build([
        item({ startTime: '09:00', physicalLoad: 'high' }),
        item({ startTime: '11:00', physicalLoad: 'high' }),
      ]),
    );
    expect(issues.some((i) => i.type === 'insufficient_rest')).toBe(true);
  });

  it('체크인 시각 전 호텔 도착을 경고한다', () => {
    const issues = validateItinerary(build([item({ type: 'checkin', startTime: '12:00' })]));
    expect(issues.some((i) => i.type === 'arrival_before_checkin')).toBe(true);
  });

  it('문제가 없으면 빈 배열을 반환한다', () => {
    const issues = validateItinerary(
      build([
        item({ startTime: '10:00', durationMinutes: 60 }),
        item({ startTime: '12:00', travelMinutesFromPrevious: 20 }),
      ]),
    );
    expect(issues).toHaveLength(0);
  });
});

describe('예산 초과 탐지', () => {
  it('예산 초과 시 critical 이슈를 만든다', () => {
    const it1 = build([
      item({ price: { amount: krw(3_500_000), status: 'retrieved', capturedAt: new Date().toISOString() } }),
    ]);
    const issues = validateItinerary(it1, 3_000_000);
    const budget = issues.find((i) => i.type === 'budget_exceeded');
    expect(budget).toBeDefined();
    expect(budget?.severity).toBe('critical');
    expect(budget?.message).toContain('500,000');
  });

  it('예산 내이면 예산 이슈가 없다', () => {
    const it1 = build([
      item({ price: { amount: krw(1_000_000), status: 'retrieved', capturedAt: new Date().toISOString() } }),
    ]);
    expect(validateItinerary(it1, 3_000_000).some((i) => i.type === 'budget_exceeded')).toBe(false);
  });
});
