import { describe, expect, it } from 'vitest';
import type { Itinerary, ItineraryItem } from '../../types';
import { breakdownBudget, calculateItineraryBudget, comparePrices } from './budget';
import { krw } from '../../utils/currency';

function item(amount: number, status: 'estimated' | 'retrieved'): ItineraryItem {
  return {
    id: `i${amount}`,
    type: 'activity',
    title: 't',
    startTime: '10:00',
    durationMinutes: 60,
    location: 'x',
    travelMinutesFromPrevious: 0,
    requiresBooking: false,
    bookingStatus: 'idea',
    price: { amount: krw(amount), status, capturedAt: new Date().toISOString() },
    weatherSensitive: false,
    physicalLoad: 'low',
  };
}

function itinerary(items: ItineraryItem[]): Itinerary {
  return {
    id: 'it1',
    tripId: 'tr1',
    destinationName: '하코네',
    days: [{ dayNumber: 1, date: '2026-08-14', title: 'Day 1', items }],
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

describe('여행 예산 계산', () => {
  it('전체 합계를 계산한다', () => {
    const it1 = itinerary([item(100000, 'retrieved'), item(50000, 'estimated')]);
    expect(calculateItineraryBudget(it1, 'KRW').amount).toBe(150000);
  });

  it('확정가(공급사)와 예상가(AI)를 분리 집계한다', () => {
    const b = breakdownBudget(itinerary([item(200000, 'retrieved'), item(80000, 'estimated')]), 'KRW');
    expect(b.confirmed.amount).toBe(200000);
    expect(b.estimated.amount).toBe(80000);
    expect(b.total.amount).toBe(280000);
  });

  it('예산 초과를 탐지한다', () => {
    const b = breakdownBudget(itinerary([item(300000, 'retrieved')]), 'KRW', 250000);
    expect(b.overBudget).toBe(true);
    expect(b.remaining?.amount).toBe(-50000);
  });

  it('예산 내이면 남은 예산을 계산한다', () => {
    const b = breakdownBudget(itinerary([item(300000, 'retrieved')]), 'KRW', 500000);
    expect(b.overBudget).toBe(false);
    expect(b.remaining?.amount).toBe(200000);
  });
});

describe('가격 변경 비교', () => {
  it('인상률을 계산한다', () => {
    const c = comparePrices(krw(100000), krw(108000));
    expect(c.direction).toBe('up');
    expect(c.percent).toBe(8);
  });

  it('동일 가격을 인식한다', () => {
    expect(comparePrices(krw(100000), krw(100000)).direction).toBe('same');
  });

  it('통화가 다르면 예외를 던진다', () => {
    expect(() => comparePrices(krw(1), { amount: 1, currency: 'USD' })).toThrow();
  });
});
