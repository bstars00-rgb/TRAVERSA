import { describe, expect, it } from 'vitest';
import { normalizeQuote, type RawSupplierQuote } from './normalize';
import { getSupplier } from '../../data/suppliers';

const NOW = new Date('2026-07-11T10:00:00Z');

function raw(partial: Partial<RawSupplierQuote> = {}): RawSupplierQuote {
  return {
    grossPrice: 1_000_000,
    taxRate: 0.1,
    feeRate: 0.03,
    currency: 'KRW',
    availability: 'available',
    refundable: true,
    freeCancelDaysBefore: 3,
    checkInDate: '2026-08-14',
    offerTtlMinutes: 30,
    ...partial,
  };
}

describe('MCP 결과 정규화 (Supplier Adapter)', () => {
  it('총액 = 기본가 + 세금 + 수수료', () => {
    const n = normalizeQuote(getSupplier('globalbeds'), raw(), NOW);
    expect(n.price.amount).toBe(1_000_000);
    expect(n.taxes.amount).toBe(100_000);
    expect(n.fees.amount).toBe(30_000);
    expect(n.totalPrice.amount).toBe(1_130_000);
  });

  it('공통 결과 필드를 모두 포함한다', () => {
    const n = normalizeQuote(getSupplier('sakuradirect'), raw(), NOW);
    expect(n.supplierId).toBe('sakuradirect');
    expect(n.supplierName).toBe('SakuraDirect');
    expect(n.supplierOfferId).toBeTruthy();
    expect(n.retrievedAt).toBe(NOW.toISOString());
    expect(new Date(n.expiresAt).getTime()).toBe(NOW.getTime() + 30 * 60_000);
    expect(n.sourceType).toBe('live_supplier_data');
    expect(n.rawDataReference).toContain('raw://sakuradirect');
    expect(n.confidence).toBeGreaterThan(0.9);
  });

  it('신뢰도 낮은 공급사에는 경고를 추가한다', () => {
    const n = normalizeQuote(getSupplier('asiaroomshub'), raw(), NOW);
    expect(n.warnings.some((w) => w.includes('신뢰도'))).toBe(true);
  });

  it('마지막 객실이면 경고를 추가한다', () => {
    const n = normalizeQuote(getSupplier('globalbeds'), raw({ availability: 'last_room' }), NOW);
    expect(n.warnings.some((w) => w.includes('마지막 객실'))).toBe(true);
  });
});

describe('취소조건 표시', () => {
  it('환불 가능 요금은 무료취소 마감일을 계산한다', () => {
    const n = normalizeQuote(getSupplier('globalbeds'), raw({ refundable: true, freeCancelDaysBefore: 3 }), NOW);
    expect(n.cancellationPolicy.refundable).toBe(true);
    expect(n.cancellationPolicy.freeCancellationUntil).toBeTruthy();
    // 체크인 2026-08-14의 3일 전
    expect(n.cancellationPolicy.freeCancellationUntil?.slice(0, 10)).toBe('2026-08-11');
    expect(n.cancellationPolicy.penaltyDescription).toContain('무료취소');
  });

  it('환불 불가 요금을 명확히 표기한다', () => {
    const n = normalizeQuote(getSupplier('globalbeds'), raw({ refundable: false }), NOW);
    expect(n.cancellationPolicy.refundable).toBe(false);
    expect(n.cancellationPolicy.penaltyDescription).toContain('환불 불가');
  });
});
