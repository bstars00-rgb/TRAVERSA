import { describe, expect, it } from 'vitest';
import { addMoney, formatMoney, krw, moneyDelta, sumMoney } from './currency';

describe('통화 표시', () => {
  it('KRW는 소수점 없이 원화 기호로 표시한다', () => {
    expect(formatMoney(krw(1240000))).toBe('₩1,240,000');
  });

  it('JPY는 소수점 없이 표시한다', () => {
    expect(formatMoney({ amount: 15000, currency: 'JPY' })).toContain('15,000');
  });

  it('USD는 소수점 2자리로 표시한다', () => {
    expect(formatMoney({ amount: 99.5, currency: 'USD' })).toBe('$99.50');
  });
});

describe('가격 합계 계산', () => {
  it('같은 통화 금액을 합산한다', () => {
    expect(addMoney(krw(1000), krw(500)).amount).toBe(1500);
  });

  it('여러 금액을 합산한다', () => {
    const total = sumMoney([krw(100000), krw(50000), krw(25000)], 'KRW');
    expect(total).toEqual(krw(175000));
  });

  it('통화가 다르면 예외를 던진다', () => {
    expect(() => addMoney(krw(1000), { amount: 10, currency: 'USD' })).toThrow();
  });
});

describe('가격 변경 비교 (moneyDelta)', () => {
  it('인상/인하 차액을 계산한다', () => {
    expect(moneyDelta(krw(100000), krw(112000)).amount).toBe(12000);
    expect(moneyDelta(krw(100000), krw(93000)).amount).toBe(-7000);
  });
});
