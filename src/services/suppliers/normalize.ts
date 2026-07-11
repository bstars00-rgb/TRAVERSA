import { addMinutes, addDays } from 'date-fns';
import type {
  CancellationPolicy,
  CurrencyCode,
  Money,
  SupplierOfferBase,
  Supplier,
} from '../../types';
import { uid } from '../../utils/id';

/**
 * 공급사 원본 응답 → 표준 오퍼 정규화 레이어.
 * LLM은 이 레이어를 거친 데이터만 받는다.
 */

export interface RawSupplierQuote {
  /** 공급사가 준 원본 가격 (세금 포함 여부가 공급사마다 다름) */
  grossPrice: number;
  taxRate: number;
  feeRate: number;
  currency: CurrencyCode;
  availability: SupplierOfferBase['availabilityStatus'];
  refundable: boolean;
  freeCancelDaysBefore?: number;
  checkInDate?: string;
  offerTtlMinutes: number;
}

export function normalizeQuote(
  supplier: Supplier,
  raw: RawSupplierQuote,
  now: Date,
): Pick<
  SupplierOfferBase,
  | 'supplierId'
  | 'supplierName'
  | 'supplierOfferId'
  | 'retrievedAt'
  | 'expiresAt'
  | 'price'
  | 'taxes'
  | 'fees'
  | 'totalPrice'
  | 'currency'
  | 'availabilityStatus'
  | 'cancellationPolicy'
  | 'sourceType'
  | 'confidence'
  | 'warnings'
  | 'rawDataReference'
> {
  const base = Math.round(raw.grossPrice);
  const taxes = Math.round(base * raw.taxRate);
  const fees = Math.round(base * raw.feeRate);
  const money = (amount: number): Money => ({ amount, currency: raw.currency });

  const warnings: string[] = [];
  if (supplier.reliability < 0.85) {
    warnings.push('이 공급사의 데이터 품질 신뢰도가 상대적으로 낮습니다.');
  }
  if (raw.availability === 'last_room') {
    warnings.push('마지막 객실일 가능성이 있습니다.');
  }

  return {
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierOfferId: uid(`${supplier.id}_offer`),
    retrievedAt: now.toISOString(),
    expiresAt: addMinutes(now, raw.offerTtlMinutes).toISOString(),
    price: money(base),
    taxes: money(taxes),
    fees: money(fees),
    totalPrice: money(base + taxes + fees),
    currency: raw.currency,
    availabilityStatus: raw.availability,
    cancellationPolicy: buildCancellationPolicy(raw, now),
    sourceType: 'live_supplier_data',
    confidence: supplier.reliability,
    warnings,
    rawDataReference: `raw://${supplier.id}/${supplier.apiProtocol.toLowerCase()}/${uid('payload')}`,
  };
}

export function buildCancellationPolicy(raw: RawSupplierQuote, now: Date): CancellationPolicy {
  if (!raw.refundable) {
    return {
      refundable: false,
      penaltyDescription: '환불 불가 요금제입니다. 예약 즉시 100% 취소 수수료가 발생합니다.',
    };
  }
  const baseDate = raw.checkInDate ? new Date(raw.checkInDate) : addDays(now, 30);
  const deadline = addDays(baseDate, -(raw.freeCancelDaysBefore ?? 3));
  return {
    refundable: true,
    freeCancellationUntil: deadline.toISOString(),
    penaltyDescription: `체크인 ${raw.freeCancelDaysBefore ?? 3}일 전까지 무료취소, 이후 1박 요금이 부과됩니다.`,
  };
}
