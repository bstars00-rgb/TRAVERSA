import type { BookingItem } from '../../types';
import { PriceDisplay, SourceTag, StatusBadge, SupplierBadge } from '../shared';
import { formatMoney } from '../../utils/currency';
import { formatDateTime } from '../../utils/format';
import { useBookingStore } from '../../stores/useBookingStore';

function offerTitle(item: BookingItem): string {
  const o = item.offer;
  switch (o.kind) {
    case 'hotel': return `${o.hotel.name} — ${o.room.name} (${o.nights}박)`;
    case 'flight': return `${o.airline} ${o.flightNumber} (${o.from}→${o.to})`;
    case 'activity': return o.title;
    case 'transport': return `${o.from} → ${o.to} (${o.vehicleType})`;
  }
}

const KIND_LABEL = { hotel: '호텔', flight: '항공', activity: '액티비티', transport: '교통' } as const;

export function BookingItemCard({ item }: { item: BookingItem }) {
  const setSpecialRequest = useBookingStore((s) => s.setSpecialRequest);

  return (
    <article className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{KIND_LABEL[item.offer.kind]}</p>
          <h4 className="text-base font-semibold text-ink-800">{offerTitle(item)}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <StatusBadge status={item.status} />
            <SourceTag source="live_supplier_data" />
            <SupplierBadge name={item.bookedVia} />
            <span className="text-xs text-ink-400">예약 주체: {item.bookedVia}</span>
          </div>
        </div>
        <div className="text-right">
          <PriceDisplay
            amount={item.latestPrice.amount}
            status={item.latestPrice.status}
            capturedAt={item.latestPrice.capturedAt}
          />
          {item.latestPrice.previousAmount && item.latestPrice.previousAmount.amount !== item.latestPrice.amount.amount && (
            <p className="text-xs text-ink-400 line-through">{formatMoney(item.latestPrice.previousAmount)}</p>
          )}
        </div>
      </div>

      <dl className="mt-3 grid grid-cols-1 gap-1 text-xs text-ink-600 md:grid-cols-2">
        <div className="flex gap-1.5">
          <dt className="text-ink-400">취소 마감</dt>
          <dd>{item.cancellationDeadline ? formatDateTime(item.cancellationDeadline) : '해당 없음 (환불 불가)'}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-ink-400">환불 가능 금액</dt>
          <dd className={item.refundableAmount.amount > 0 ? 'text-emerald-700' : 'text-red-700'}>
            {formatMoney(item.refundableAmount)}
          </dd>
        </div>
        <div className="col-span-full flex gap-1.5">
          <dt className="shrink-0 text-ink-400">취소조건</dt>
          <dd>{item.offer.cancellationPolicy.penaltyDescription}</dd>
        </div>
      </dl>

      {item.offer.warnings.length > 0 && (
        <ul className="mt-2 space-y-1" role="alert">
          {item.offer.warnings.map((w) => (
            <li key={w} className="rounded bg-amber-50 px-2 py-1 text-xs text-amber-800">⚠ {w}</li>
          ))}
        </ul>
      )}

      <label className="mt-3 block text-xs text-ink-500">
        특별요청 (공급사 전달용)
        <input
          value={item.specialRequests ?? ''}
          onChange={(e) => setSpecialRequest(item.id, e.target.value)}
          placeholder="예: 고층, 조용한 객실, 유아용 침대"
          className="mt-1 w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-xs outline-none focus:border-brand-500"
        />
      </label>
    </article>
  );
}
