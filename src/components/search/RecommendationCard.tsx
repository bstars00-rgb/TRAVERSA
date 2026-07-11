import { useState } from 'react';
import { AlertTriangle, BedDouble, ChevronDown, ChevronUp, MapPin, Ruler, TrainFront, Users } from 'lucide-react';
import type { HotelRecommendation } from '../../services/ai/scoring';
import {
  Badge,
  Button,
  ConfidenceIndicator,
  PriceDisplay,
  SourceTag,
  SupplierBadge,
} from '../shared';
import { formatMoney } from '../../utils/currency';
import { formatDateTime, formatTimeAgo } from '../../utils/format';
import { useConversationStore } from '../../stores/useConversationStore';

const STRATEGY_TONE: Record<HotelRecommendation['strategy'], 'brand' | 'success' | 'gold'> = {
  best_match: 'brand',
  best_value: 'success',
  premium: 'gold',
};

export function RecommendationCard({ rec }: { rec: HotelRecommendation }) {
  const [showReasons, setShowReasons] = useState(false);
  const selectRecommendation = useConversationStore((s) => s.selectRecommendation);
  const { offer, matches, mismatches, riskNotes, reasons, score } = rec.scored;
  const hotel = offer.hotel;

  return (
    <article className="rounded-xl border border-ink-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <Badge tone={STRATEGY_TONE[rec.strategy]}>{rec.strategyLabel}</Badge>
          <h4 className="mt-1.5 text-sm font-bold text-ink-900">
            {hotel.name} <span className="text-xs font-normal text-ink-400">{'★'.repeat(hotel.starRating)} · 평점 {hotel.reviewScore}</span>
          </h4>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-500">
            <MapPin size={11} /> {hotel.location}
          </p>
        </div>
        <div className="text-right">
          <PriceDisplay amount={offer.totalPrice} status="retrieved" size="lg" />
          <p className="mt-0.5 text-[10px] text-ink-400">
            {offer.nights}박 · 세금 {formatMoney(offer.taxes)} · 수수료 {formatMoney(offer.fees)} 포함
          </p>
        </div>
      </div>

      {/* AI 추천 이유 — 출처 표시 */}
      <div className="mt-3 rounded-lg bg-ink-50 p-2.5">
        <SourceTag source="ai_recommendation" />
        <p className="mt-1 text-xs leading-relaxed text-ink-600">{rec.aiReason}</p>
      </div>

      {/* 객실/적합성 팩트 — 공급사 데이터 */}
      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] text-ink-600 md:grid-cols-3">
        <span className="flex items-center gap-1"><BedDouble size={11} /> {offer.room.bedConfiguration}</span>
        <span className="flex items-center gap-1"><Ruler size={11} /> {offer.room.sizeSqm}㎡ · {offer.room.name}</span>
        <span className="flex items-center gap-1"><TrainFront size={11} /> 역까지 {hotel.distanceToStationM}m</span>
        <span className="flex items-center gap-1"><Users size={11} /> 아이 {hotel.suitableForChildren ? '적합' : '확인 필요'} · 부모님 {hotel.suitableForSeniors ? '적합' : '확인 필요'}</span>
        <span>취소: {offer.cancellationPolicy.refundable ? `무료취소 (${offer.cancellationPolicy.freeCancellationUntil ? formatDateTime(offer.cancellationPolicy.freeCancellationUntil) + '까지' : ''})` : '환불 불가'}</span>
        <span className="flex items-center gap-1">
          매핑 신뢰도 <ConfidenceIndicator value={offer.roomMappingConfidence} label="객실 매핑 신뢰도" />
        </span>
      </div>

      {/* 일치/불일치 */}
      <div className="mt-2.5 flex flex-wrap gap-1">
        {matches.map((m) => <Badge key={m} tone="success">✓ {m}</Badge>)}
        {mismatches.map((m) => <Badge key={m} tone="warning">△ {m}</Badge>)}
      </div>

      {/* 위험 경고 — 숨기지 않고 명시 */}
      {riskNotes.length > 0 && (
        <div className="mt-2.5 rounded-lg border border-amber-200 bg-amber-50 p-2.5" role="alert">
          {riskNotes.map((r) => (
            <p key={r} className="flex items-center gap-1.5 text-[11px] text-amber-800">
              <AlertTriangle size={11} /> {r}
            </p>
          ))}
        </div>
      )}

      {/* 공급사·가격 확인 시점 */}
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-ink-100 pt-2.5">
        <SourceTag source="live_supplier_data" />
        <SupplierBadge name={offer.supplierName} />
        <span className="text-[10px] text-ink-400">
          {formatTimeAgo(offer.retrievedAt)} 확인 · {formatDateTime(offer.expiresAt)} 만료
        </span>
      </div>

      {/* 동일 호텔·동일 객실 공급사 가격 비교 */}
      {rec.alternativeSupplierOffers.length > 0 && (
        <div className="mt-2.5 rounded-lg border border-ink-100 p-2.5">
          <p className="mb-1.5 text-[11px] font-semibold text-ink-500">같은 객실, 다른 공급사</p>
          <ul className="space-y-1">
            {rec.alternativeSupplierOffers.map((alt) => (
              <li key={alt.offer.supplierOfferId} className="flex items-center justify-between gap-2 text-[11px]">
                <span className="flex items-center gap-1.5">
                  <SupplierBadge name={alt.offer.supplierName} />
                  <span className="text-ink-400">
                    {alt.offer.cancellationPolicy.refundable ? '무료취소' : '환불불가'} · 점수 {alt.score}
                  </span>
                </span>
                <span className="tabular-nums font-medium text-ink-700">{formatMoney(alt.offer.totalPrice)}</span>
              </li>
            ))}
          </ul>
          <p className="mt-1.5 text-[10px] text-ink-400">최저가가 아니라 취소조건·신뢰도·응답품질을 종합해 추천합니다.</p>
        </div>
      )}

      {/* 왜 이 상품인가요? */}
      <button
        onClick={() => setShowReasons(!showReasons)}
        aria-expanded={showReasons}
        className="mt-2.5 flex items-center gap-1 text-[11px] font-medium text-brand-700 hover:underline cursor-pointer"
      >
        왜 이 상품인가요? (추천 점수 {score}점) {showReasons ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {showReasons && (
        <ul className="mt-1.5 space-y-0.5 rounded-lg bg-ink-50 p-2.5">
          {reasons.map((r) => (
            <li key={r.label} className="flex justify-between text-[11px]">
              <span className="text-ink-600">{r.label}</span>
              <span className={`tabular-nums font-medium ${r.points < 0 ? 'text-red-600' : 'text-ink-700'}`}>
                {r.points > 0 ? '+' : ''}{r.points}점
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 flex justify-end">
        <Button onClick={() => selectRecommendation(rec)}>이 호텔로 일정 만들기</Button>
      </div>
    </article>
  );
}
