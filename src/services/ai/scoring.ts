import type { HotelOffer, TripIntent } from '../../types';
import { getSupplier } from '../../data/suppliers';

/**
 * 추천 점수 계산 — 단순 최저가가 아니라 취소조건, 결제시점, 조식,
 * 매핑/공급사 신뢰도, 가격 만료, 사용자 선호를 함께 반영한다.
 * 점수 근거는 reasons로 노출되어 "왜 이 상품인가요?"에 표시된다.
 */

export interface ScoredReason {
  label: string;
  points: number;
}

export interface ScoredHotelOffer {
  offer: HotelOffer;
  score: number;
  reasons: ScoredReason[];
  matches: string[];
  mismatches: string[];
  riskNotes: string[];
}

export function scoreHotelOffer(
  offer: HotelOffer,
  intent: TripIntent,
  cheapestTotal: number,
): ScoredHotelOffer {
  const reasons: ScoredReason[] = [];
  const matches: string[] = [];
  const mismatches: string[] = [];
  const riskNotes: string[] = [];
  const supplier = getSupplier(offer.supplierId);

  // 총가격 (최저가 대비, 최대 30점)
  const priceRatio = cheapestTotal / Math.max(1, offer.totalPrice.amount);
  const pricePoints = Math.round(priceRatio * 30);
  reasons.push({ label: `총가격 경쟁력 (최저가 대비 ${Math.round(priceRatio * 100)}%)`, points: pricePoints });

  // 무료취소 (15점)
  if (offer.cancellationPolicy.refundable) {
    reasons.push({ label: '무료취소 가능', points: 15 });
    matches.push('무료취소');
  } else {
    reasons.push({ label: '환불 불가 요금', points: 0 });
    mismatches.push('환불 불가 요금제');
  }

  // 결제시점 (현장결제 우대, 5점)
  if (offer.ratePlan.paymentTiming === 'pay_at_hotel') {
    reasons.push({ label: '현장 결제 (유연함)', points: 5 });
  }

  // 조식 (8점)
  if (offer.room.breakfastIncluded) {
    reasons.push({ label: '조식 포함', points: 8 });
    matches.push('조식 포함');
  }

  // 객실 매핑 신뢰도 (10점)
  const mappingPoints = Math.round(offer.roomMappingConfidence * 10);
  reasons.push({ label: `객실 매핑 신뢰도 ${Math.round(offer.roomMappingConfidence * 100)}%`, points: mappingPoints });
  if (offer.roomMappingConfidence < 0.75) {
    riskNotes.push('객실명 매핑 신뢰도가 낮습니다');
  }

  // 공급사 신뢰도 (10점) + 응답속도 (5점) + 지원 수준 (5점)
  reasons.push({ label: `공급사 신뢰도 ${Math.round(supplier.reliability * 100)}%`, points: Math.round(supplier.reliability * 10) });
  reasons.push({ label: '응답속도', points: supplier.avgLatencyMs < 1000 ? 5 : 2 });
  reasons.push({
    label: `지원 서비스 ${supplier.supportLevel}`,
    points: supplier.supportLevel === 'premium' ? 5 : supplier.supportLevel === 'standard' ? 3 : 1,
  });

  // 가격 만료 여유 (5점)
  const ttlMinutes = (new Date(offer.expiresAt).getTime() - new Date(offer.retrievedAt).getTime()) / 60_000;
  reasons.push({ label: `가격 유효시간 ${Math.round(ttlMinutes)}분`, points: ttlMinutes >= 40 ? 5 : ttlMinutes >= 25 ? 3 : 1 });
  if (ttlMinutes < 25) riskNotes.push('가격 만료가 임박합니다');

  // 사용자 선호도 반영 (최대 15점)
  let prefPoints = 0;
  const hasSenior = intent.travelerTypes.includes('senior');
  const hasChild = intent.travelerTypes.includes('child');
  if (hasSenior && offer.hotel.suitableForSeniors) {
    prefPoints += 6;
    matches.push('부모님 동반 적합');
  } else if (hasSenior && !offer.hotel.suitableForSeniors) {
    mismatches.push('시니어 동반에는 부적합할 수 있음');
  }
  if (hasChild && offer.hotel.suitableForChildren) {
    prefPoints += 6;
    matches.push('아이 동반 적합');
  } else if (hasChild && !offer.hotel.suitableForChildren) {
    mismatches.push('아이 동반 정책 확인 필요');
  }
  if (intent.accessibilityNeeds.length > 0 && offer.hotel.distanceToStationM <= 500) {
    prefPoints += 3;
    matches.push('역에서 도보 5분 이내');
  } else if (intent.accessibilityNeeds.length > 0 && offer.hotel.distanceToStationM > 1000) {
    mismatches.push('역에서 멀어 셔틀/차량 필요');
  }
  if (
    intent.accommodationPreferences.some((p) => p.includes('온천')) &&
    offer.hotel.amenities.some((a) => a.includes('온천') || a.includes('욕장'))
  ) {
    prefPoints += 3;
    matches.push('온천 시설 보유');
  }
  reasons.push({ label: '여행조건 일치도', points: Math.min(15, prefPoints) });

  // 위험 항목은 자동으로 숨기지 않고 감점으로 순위를 낮춘다
  if (offer.taxesIncludedInPrice === 'unclear') {
    riskNotes.push('세금 포함 여부 불명확');
    reasons.push({ label: '세금 표기 불명확 (감점)', points: -5 });
  }
  if (offer.availabilityStatus === 'last_room') {
    riskNotes.push('마지막 객실 가능성');
  }
  if (offer.cancellationPolicy.structuredTextMismatch) {
    riskNotes.push('취소정책 텍스트와 구조화 데이터 불일치');
    reasons.push({ label: '취소정책 불일치 (감점)', points: -8 });
  }

  const score = reasons.reduce((sum, r) => sum + r.points, 0);
  return { offer, score, reasons, matches, mismatches, riskNotes };
}

export type RecommendationStrategy = 'best_match' | 'best_value' | 'premium';

export interface HotelRecommendation {
  strategy: RecommendationStrategy;
  strategyLabel: string;
  scored: ScoredHotelOffer;
  /** 동일 호텔·동일 객실의 다른 공급사 오퍼 (가격 비교용) */
  alternativeSupplierOffers: ScoredHotelOffer[];
  aiReason: string;
}

/** 검색 결과를 3가지 전략으로 압축한다. 수백 개 나열 금지. */
export function buildRecommendations(
  offers: HotelOffer[],
  intent: TripIntent,
): HotelRecommendation[] {
  if (offers.length === 0) return [];
  const cheapest = Math.min(...offers.map((o) => o.totalPrice.amount));
  const scored = offers.map((o) => scoreHotelOffer(o, intent, cheapest));

  // 동일 호텔+객실(canonical ID 기준) 그룹핑 — 공급사별 가격 비교
  const groups = new Map<string, ScoredHotelOffer[]>();
  for (const s of scored) {
    const key = `${s.offer.hotel.canonicalId}::${s.offer.room.canonicalRoomId}`;
    const arr = groups.get(key) ?? [];
    arr.push(s);
    groups.set(key, arr);
  }
  const bestPerGroup = [...groups.values()].map((group) => {
    const sorted = [...group].sort((a, b) => b.score - a.score);
    return { primary: sorted[0], alternatives: sorted.slice(1) };
  });

  const byScore = [...bestPerGroup].sort((a, b) => b.primary.score - a.primary.score);
  const byPrice = [...bestPerGroup].sort(
    (a, b) => a.primary.offer.totalPrice.amount - b.primary.offer.totalPrice.amount,
  );
  const byLuxury = [...bestPerGroup].sort(
    (a, b) =>
      b.primary.offer.hotel.starRating * 10 + b.primary.offer.hotel.reviewScore -
      (a.primary.offer.hotel.starRating * 10 + a.primary.offer.hotel.reviewScore),
  );

  const picks: HotelRecommendation[] = [];
  const used = new Set<string>();
  const take = (
    list: { primary: ScoredHotelOffer; alternatives: ScoredHotelOffer[] }[],
    strategy: RecommendationStrategy,
    strategyLabel: string,
    aiReason: (s: ScoredHotelOffer) => string,
  ) => {
    const found = list.find((g) => !used.has(g.primary.offer.hotel.canonicalId));
    if (!found) return;
    used.add(found.primary.offer.hotel.canonicalId);
    picks.push({
      strategy,
      strategyLabel,
      scored: found.primary,
      alternativeSupplierOffers: found.alternatives,
      aiReason: aiReason(found.primary),
    });
  };

  take(byScore, 'best_match', 'Best Match', (s) =>
    `여행조건 일치도와 취소 유연성, 데이터 신뢰도를 종합했을 때 가장 균형이 좋습니다. ${s.matches.slice(0, 3).join(', ')} 조건을 충족합니다.`,
  );
  take(byPrice, 'best_value', 'Best Value', (s) =>
    `조건을 크게 포기하지 않으면서 총비용이 가장 낮습니다. 총 ${s.offer.totalPrice.amount.toLocaleString('ko-KR')}원 (세금·수수료 포함).`,
  );
  take(byLuxury, 'premium', 'Premium Alternative', (s) =>
    `예산에 여유가 있다면 ${s.offer.hotel.starRating}성급 · 평점 ${s.offer.hotel.reviewScore}의 상위 경험을 제공합니다.`,
  );

  return picks;
}
