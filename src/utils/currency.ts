import type { CurrencyCode, Money } from '../types';

const LOCALE_MAP: Record<CurrencyCode, string> = {
  KRW: 'ko-KR',
  USD: 'en-US',
  JPY: 'ja-JP',
  SGD: 'en-SG',
  THB: 'th-TH',
  VND: 'vi-VN',
  EUR: 'de-DE',
};

/** 통화 표시 — KRW/JPY/VND는 소수점 없이 표기 */
export function formatMoney(money: Money): string {
  const noDecimal: CurrencyCode[] = ['KRW', 'JPY', 'VND'];
  const digits = noDecimal.includes(money.currency) ? 0 : 2;
  return new Intl.NumberFormat(LOCALE_MAP[money.currency] ?? 'ko-KR', {
    style: 'currency',
    currency: money.currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(money.amount);
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new Error(`통화가 다른 금액은 합산할 수 없습니다: ${a.currency} vs ${b.currency}`);
  }
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function sumMoney(items: Money[], currency: Money['currency']): Money {
  return items.reduce<Money>((acc, m) => addMoney(acc, m), { amount: 0, currency });
}

export function moneyDelta(before: Money, after: Money): Money {
  if (before.currency !== after.currency) {
    throw new Error('통화가 다른 금액은 비교할 수 없습니다');
  }
  return { amount: after.amount - before.amount, currency: after.currency };
}

export function krw(amount: number): Money {
  return { amount, currency: 'KRW' };
}
