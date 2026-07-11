import type { CurrencyCode, Itinerary, Money, PriceSnapshot } from '../../types';

/** 일정 전체 예산 합계 — 확정(공급사)가와 예상(AI)가를 함께 합산하되 구분 가능 */
export function calculateItineraryBudget(itinerary: Itinerary, currency: CurrencyCode): Money {
  let total = 0;
  for (const day of itinerary.days) {
    for (const item of day.items) {
      if (item.price && item.price.amount.currency === currency) {
        total += item.price.amount.amount;
      }
    }
  }
  return { amount: total, currency };
}

export interface BudgetBreakdown {
  confirmed: Money;
  estimated: Money;
  total: Money;
  remaining: Money | null;
  overBudget: boolean;
}

/** 확정가(retrieved/rechecked/locked)와 예상가(estimated/changed) 분리 집계 */
export function breakdownBudget(
  itinerary: Itinerary,
  currency: CurrencyCode,
  budgetLimit?: number,
): BudgetBreakdown {
  let confirmed = 0;
  let estimated = 0;
  const confirmedStatuses: PriceSnapshot['status'][] = ['retrieved', 'rechecked', 'locked'];
  for (const day of itinerary.days) {
    for (const item of day.items) {
      if (!item.price || item.price.amount.currency !== currency) continue;
      if (confirmedStatuses.includes(item.price.status)) {
        confirmed += item.price.amount.amount;
      } else {
        estimated += item.price.amount.amount;
      }
    }
  }
  const total = confirmed + estimated;
  const remaining = budgetLimit !== undefined ? budgetLimit - total : null;
  return {
    confirmed: { amount: confirmed, currency },
    estimated: { amount: estimated, currency },
    total: { amount: total, currency },
    remaining: remaining !== null ? { amount: remaining, currency } : null,
    overBudget: remaining !== null && remaining < 0,
  };
}

export interface PriceChange {
  direction: 'same' | 'up' | 'down';
  delta: Money;
  percent: number;
}

/** 가격 변경 비교 — 재확인 결과 표시에 사용 */
export function comparePrices(before: Money, after: Money): PriceChange {
  if (before.currency !== after.currency) {
    throw new Error('통화가 다른 가격은 비교할 수 없습니다');
  }
  const diff = after.amount - before.amount;
  return {
    direction: diff === 0 ? 'same' : diff > 0 ? 'up' : 'down',
    delta: { amount: diff, currency: after.currency },
    percent: before.amount === 0 ? 0 : Math.round((diff / before.amount) * 1000) / 10,
  };
}
