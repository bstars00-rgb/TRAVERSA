import { Check, Minus } from 'lucide-react';
import type { HotelRecommendation } from '../../services/ai/scoring';
import { Badge, Button, ConfidenceIndicator } from '../shared';
import { formatMoney } from '../../utils/currency';
import { useConversationStore } from '../../stores/useConversationStore';

const STRATEGY_TONE: Record<HotelRecommendation['strategy'], 'brand' | 'success' | 'gold'> = {
  best_match: 'brand',
  best_value: 'success',
  premium: 'gold',
};

function Yes() {
  return <span className="inline-flex items-center gap-1 text-emerald-700"><Check size={12} /> 가능</span>;
}
function No({ label = '불가' }: { label?: string }) {
  return <span className="inline-flex items-center gap-1 text-ink-400"><Minus size={12} /> {label}</span>;
}

/** 추천 3종을 항목별로 나란히 비교하는 표 — 모바일에서는 가로 스크롤 */
export function RecommendationCompareTable({ recs }: { recs: HotelRecommendation[] }) {
  const selectRecommendation = useConversationStore((s) => s.selectRecommendation);

  const rows: { label: string; render: (r: HotelRecommendation) => React.ReactNode }[] = [
    {
      label: '총액 (세금 포함)',
      render: (r) => {
        const cheapest = Math.min(...recs.map((x) => x.scored.offer.totalPrice.amount));
        const isCheapest = r.scored.offer.totalPrice.amount === cheapest;
        return (
          <span className={`font-bold tabular-nums ${isCheapest ? 'text-emerald-700' : 'text-ink-800'}`}>
            {formatMoney(r.scored.offer.totalPrice)}
            {isCheapest && <span className="ml-1 text-xs font-medium">최저</span>}
          </span>
        );
      },
    },
    {
      label: '1박 요금',
      render: (r) => (
        <span className="tabular-nums text-ink-600">
          {formatMoney({
            amount: Math.round(r.scored.offer.totalPrice.amount / Math.max(1, r.scored.offer.nights)),
            currency: r.scored.offer.totalPrice.currency,
          })}
        </span>
      ),
    },
    {
      label: '무료취소',
      render: (r) => (r.scored.offer.cancellationPolicy.refundable ? <Yes /> : <No />),
    },
    {
      label: '조식',
      render: (r) => (r.scored.offer.room.breakfastIncluded ? <Yes /> : <No label="미포함" />),
    },
    {
      label: '평점',
      render: (r) => (
        <span>⭐ {r.scored.offer.hotel.reviewScore} <span className="text-ink-400">· {r.scored.offer.hotel.starRating}성급</span></span>
      ),
    },
    {
      label: '역까지 거리',
      render: (r) => <span>{r.scored.offer.hotel.distanceToStationM}m</span>,
    },
    {
      label: '객실',
      render: (r) => (
        <span className="text-ink-600">{r.scored.offer.room.sizeSqm}㎡ · {r.scored.offer.room.bedConfiguration}</span>
      ),
    },
    {
      label: '부모님 동반',
      render: (r) => (r.scored.offer.hotel.suitableForSeniors ? <Yes /> : <No label="확인 필요" />),
    },
    {
      label: '아이 동반',
      render: (r) => (r.scored.offer.hotel.suitableForChildren ? <Yes /> : <No label="확인 필요" />),
    },
    {
      label: '판매처 신뢰도',
      render: (r) => (
        <span className="flex flex-col gap-0.5">
          <span className="text-ink-600">{r.scored.offer.supplierName}</span>
          <ConfidenceIndicator value={r.scored.offer.confidence} label="판매처 신뢰도" />
        </span>
      ),
    },
    {
      label: '추천 점수',
      render: (r) => <span className="font-semibold tabular-nums text-brand-700">{r.scored.score}점</span>,
    },
  ];

  return (
    <div className="overflow-x-auto rounded-2xl border border-ink-100 bg-white">
      <table className="w-full min-w-[560px] text-left text-xs">
        <caption className="sr-only">추천 호텔 비교표</caption>
        <thead>
          <tr>
            <th className="w-28 px-3 py-3 align-bottom text-xs font-medium text-ink-400">항목</th>
            {recs.map((r) => (
              <th key={r.scored.offer.supplierOfferId} className="px-3 py-3">
                <div className={`tone-${r.scored.offer.hotel.imageTone} mb-2 flex h-12 items-center justify-center rounded-lg text-xl`} aria-hidden>
                  🏨
                </div>
                <Badge tone={STRATEGY_TONE[r.strategy]}>{r.strategyLabel}</Badge>
                <p className="mt-1 text-sm font-bold leading-snug text-ink-800">{r.scored.offer.hotel.name}</p>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-ink-50">
              <th scope="row" className="px-3 py-2.5 text-xs font-medium text-ink-400">{row.label}</th>
              {recs.map((r) => (
                <td key={r.scored.offer.supplierOfferId} className="px-3 py-2.5 align-top">
                  {row.render(r)}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t border-ink-100">
            <th scope="row" className="px-3 py-3" />
            {recs.map((r) => (
              <td key={r.scored.offer.supplierOfferId} className="px-3 py-3">
                <Button size="sm" onClick={() => selectRecommendation(r)}>이 호텔 선택</Button>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
