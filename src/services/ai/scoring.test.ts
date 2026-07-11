import { describe, expect, it } from 'vitest';
import type { HotelOffer, TripIntent } from '../../types';
import { buildRecommendations, scoreHotelOffer } from './scoring';
import { emptyIntent, parseUserInput } from './intentParser';
import { HOTEL_SEEDS } from '../../data/hotels';
import { getSupplier } from '../../data/suppliers';
import { krw } from '../../utils/currency';

function makeOffer(partial: Partial<HotelOffer> = {}): HotelOffer {
  const seed = HOTEL_SEEDS[1]; // 하코네 코와키엔 텐유
  const supplier = getSupplier('sakuradirect');
  const now = new Date();
  return {
    kind: 'hotel',
    supplierId: supplier.id,
    supplierName: supplier.name,
    supplierOfferId: `offer_${Math.random().toString(36).slice(2)}`,
    retrievedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + 45 * 60_000).toISOString(),
    price: krw(2_000_000),
    taxes: krw(200_000),
    fees: krw(0),
    totalPrice: krw(2_200_000),
    currency: 'KRW',
    availabilityStatus: 'available',
    cancellationPolicy: { refundable: true, penaltyDescription: '1일 전까지 무료취소' },
    sourceType: 'live_supplier_data',
    confidence: 0.97,
    warnings: [],
    rawDataReference: 'raw://test',
    hotel: seed.hotel,
    room: seed.rooms[0],
    ratePlan: { id: 'rp1', roomId: seed.rooms[0].id, name: '조식 포함', mealPlan: 'breakfast', paymentTiming: 'pay_at_hotel' },
    nights: 5,
    roomMappingConfidence: 0.95,
    taxesIncludedInPrice: true,
    ...partial,
  };
}

const onsenIntent: TripIntent = parseUserInput(
  '8월에 부모님과 일본 온천 5박, 많이 걷지 않게, 예산 300만 원',
  emptyIntent(),
);

describe('호텔 추천 점수 계산', () => {
  it('무료취소 상품이 환불불가 상품보다 점수가 높다', () => {
    const refundable = scoreHotelOffer(makeOffer(), onsenIntent, 2_200_000);
    const nonRefundable = scoreHotelOffer(
      makeOffer({ cancellationPolicy: { refundable: false, penaltyDescription: '환불 불가' } }),
      onsenIntent,
      2_200_000,
    );
    expect(refundable.score).toBeGreaterThan(nonRefundable.score);
    expect(refundable.matches).toContain('무료취소');
    expect(nonRefundable.mismatches).toContain('환불 불가 요금제');
  });

  it('세금 표기 불명확은 감점하고 위험으로 표시한다 (숨기지 않음)', () => {
    const unclear = scoreHotelOffer(makeOffer({ taxesIncludedInPrice: 'unclear' }), onsenIntent, 2_200_000);
    expect(unclear.riskNotes).toContain('세금 포함 여부 불명확');
    expect(unclear.reasons.some((r) => r.points < 0)).toBe(true);
  });

  it('객실 매핑 신뢰도가 낮으면 위험으로 표시한다', () => {
    const lowMapping = scoreHotelOffer(makeOffer({ roomMappingConfidence: 0.6 }), onsenIntent, 2_200_000);
    expect(lowMapping.riskNotes.some((r) => r.includes('매핑'))).toBe(true);
  });

  it('시니어 동반 조건과 일치하면 matches에 표시한다', () => {
    const s = scoreHotelOffer(makeOffer(), onsenIntent, 2_200_000);
    expect(s.matches).toContain('부모님 동반 적합');
  });

  it('점수 근거(reasons)를 항목별로 제공한다', () => {
    const s = scoreHotelOffer(makeOffer(), onsenIntent, 2_200_000);
    expect(s.reasons.length).toBeGreaterThanOrEqual(8);
    expect(s.reasons.every((r) => typeof r.points === 'number' && r.label.length > 0)).toBe(true);
  });
});

describe('공급사 점수/추천 압축', () => {
  it('3가지 전략(Best Match/Best Value/Premium)으로 압축한다', () => {
    const offers = HOTEL_SEEDS.filter((s) => s.hotel.destinationId === 'hakone').map((seed, i) =>
      makeOffer({
        hotel: seed.hotel,
        room: seed.rooms[0],
        totalPrice: krw(1_500_000 + i * 700_000),
        price: krw(1_400_000 + i * 700_000),
      }),
    );
    const recs = buildRecommendations(offers, onsenIntent);
    expect(recs).toHaveLength(3);
    expect(recs.map((r) => r.strategy)).toEqual(['best_match', 'best_value', 'premium']);
    expect(new Set(recs.map((r) => r.scored.offer.hotel.canonicalId)).size).toBe(3);
  });

  it('동일 호텔·동일 객실 중복 결과는 하나로 묶고 공급사 대안으로 제공한다', () => {
    const base = makeOffer();
    const duplicate = makeOffer({
      supplierId: 'globalbeds',
      supplierName: 'GlobalBeds',
      totalPrice: krw(2_050_000),
      roomMappingConfidence: 0.82,
    });
    const recs = buildRecommendations([base, duplicate], onsenIntent);
    const withAlt = recs.find((r) => r.alternativeSupplierOffers.length > 0);
    expect(withAlt).toBeDefined();
    expect(withAlt?.alternativeSupplierOffers[0].offer.supplierName).not.toBe(
      withAlt?.scored.offer.supplierName,
    );
  });

  it('오퍼가 없으면 빈 추천을 반환한다 (모든 공급사 실패 시나리오)', () => {
    expect(buildRecommendations([], onsenIntent)).toHaveLength(0);
  });
});
