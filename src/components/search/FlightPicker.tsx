import { Check, Luggage, Plane } from 'lucide-react';
import type { FlightOffer } from '../../types';
import { Badge, PriceDisplay, SourceTag, SupplierBadge } from '../shared';
import { formatDuration } from '../../utils/format';
import { useSearchStore } from '../../stores/useSearchStore';
import { useTripStore } from '../../stores/useTripStore';
import { useUIStore } from '../../stores/useUIStore';

/**
 * 1단계: 항공편 선택 — 고객의 실제 예약 순서를 따라 항공을 가장 먼저 고른다.
 * 최저가가 기본 선택되며, 사용자가 언제든 바꿀 수 있다.
 */
export function FlightPicker({ flights }: { flights: FlightOffer[] }) {
  const selectedFlightId = useSearchStore((s) => s.selectedFlightId);
  const setSelectedFlight = useSearchStore((s) => s.setSelectedFlight);
  const logEvent = useTripStore((s) => s.logEvent);
  const pushToast = useUIStore((s) => s.pushToast);

  if (flights.length === 0) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" role="alert">
        항공편 검색에 실패했어요. 숙소를 먼저 고른 뒤 대화에서 항공 재검색을 요청할 수 있어요.
      </div>
    );
  }

  const cheapest = Math.min(...flights.map((f) => f.totalPrice.amount));

  const choose = (f: FlightOffer) => {
    setSelectedFlight(f.supplierOfferId);
    logEvent('OFFER_SELECTED', `항공편 선택: ${f.airline} ${f.flightNumber}`);
    pushToast('success', `${f.airline} ${f.flightNumber} 항공편이 선택되었습니다`);
  };

  return (
    <div className="space-y-2" role="radiogroup" aria-label="항공편 선택">
      {flights.map((f) => {
        const selected = f.supplierOfferId === selectedFlightId;
        return (
          <button
            key={f.supplierOfferId}
            role="radio"
            aria-checked={selected}
            onClick={() => choose(f)}
            className={`w-full rounded-2xl border-2 bg-white p-4 text-left transition-all cursor-pointer ${
              selected ? 'border-brand-500 shadow-md' : 'border-ink-100 hover:border-brand-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                    selected ? 'bg-brand-700 text-white' : 'bg-brand-100 text-brand-700'
                  }`}
                >
                  {selected ? <Check size={18} /> : <Plane size={18} />}
                </span>
                <span>
                  <span className="flex flex-wrap items-center gap-1.5">
                    <span className="text-base font-bold text-ink-900">{f.airline}</span>
                    <span className="text-sm text-ink-500">{f.flightNumber}</span>
                    {f.totalPrice.amount === cheapest && <Badge tone="success">최저가</Badge>}
                    {selected && <Badge tone="brand">선택됨</Badge>}
                  </span>
                  <span className="mt-0.5 block text-sm text-ink-600">
                    {f.from} {f.departureTime} → {f.to} {f.arrivalTime}
                    <span className="text-ink-400"> · {formatDuration(f.durationMinutes)}</span>
                  </span>
                </span>
              </div>
              <span className="text-right">
                <PriceDisplay amount={f.totalPrice} status="retrieved" capturedAt={f.retrievedAt} />
                <span className="mt-0.5 block text-xs text-ink-400">전체 인원 · 세금 포함</span>
              </span>
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <SourceTag source="live_supplier_data" />
              <SupplierBadge name={f.supplierName} />
              <Badge tone={f.baggageIncluded ? 'success' : 'neutral'}>
                <Luggage size={10} /> 수하물 {f.baggageIncluded ? '포함' : '별도'}
              </Badge>
              <Badge tone={f.cancellationPolicy.refundable ? 'success' : 'warning'}>
                {f.cancellationPolicy.refundable ? '취소 가능' : '취소 수수료 있음'}
              </Badge>
              <span className="text-xs text-ink-400">{f.fareRules[0]}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
