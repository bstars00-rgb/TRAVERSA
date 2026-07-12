import { Accessibility, CloudRain, GripVertical } from 'lucide-react';
import type { ItineraryItem } from '../../types';
import { Badge, PriceDisplay, StatusBadge, SupplierBadge } from '../shared';
import { formatDuration } from '../../utils/format';

/** 타입별 썸네일 이모지 — 외부 이미지 없이 사진형 무드를 전달 */
const TYPE_EMOJI: Record<ItineraryItem['type'], string> = {
  flight: '✈️',
  hotel: '🏨',
  checkin: '🏨',
  checkout: '🧳',
  transport: '🚐',
  activity: '🎫',
  meal: '🍽️',
  rest: '♨️',
  sightseeing: '📷',
  shopping: '🛍️',
};

const LOAD_LABEL = { low: '낮음', medium: '보통', high: '높음' } as const;

/** 항목의 비주얼 톤 — 호텔 항목은 해당 호텔 고유 톤을 사용 */
function toneClass(item: ItineraryItem): string {
  if ((item.type === 'checkin' || item.type === 'hotel') && item.offer?.kind === 'hotel') {
    return `tone-${item.offer.hotel.imageTone}`;
  }
  const key = item.type === 'checkin' || item.type === 'checkout' ? 'hotel' : item.type;
  return `tone-item-${key}`;
}

export function ItineraryItemCard({ item }: { item: ItineraryItem }) {
  return (
    <div className="group flex gap-3 overflow-hidden rounded-xl border border-ink-100 bg-white p-2.5 shadow-sm transition-shadow hover:shadow">
      {/* 드래그 핸들 (시각적 표현) */}
      <span className="mt-1 cursor-grab self-start text-ink-200 group-hover:text-ink-400" aria-hidden>
        <GripVertical size={14} />
      </span>

      {/* 사진형 썸네일 */}
      <div
        className={`${toneClass(item)} flex h-16 w-16 shrink-0 items-center justify-center self-start rounded-xl text-2xl shadow-inner`}
        aria-hidden
      >
        <span className="drop-shadow">{TYPE_EMOJI[item.type]}</span>
      </div>

      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs font-semibold tabular-nums text-brand-700">{item.startTime}</span>
          <h5 className="text-[13px] font-semibold text-ink-800">{item.title}</h5>
          {item.requiresBooking && <StatusBadge status={item.bookingStatus} />}
        </div>
        <p className="mt-0.5 text-[11px] text-ink-500">
          {item.location} · {formatDuration(item.durationMinutes)}
          {item.travelMinutesFromPrevious > 0 && ` · 이동 ${formatDuration(item.travelMinutesFromPrevious)}`}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.price && (
            <PriceDisplay amount={item.price.amount} status={item.price.status} size="sm" />
          )}
          {item.offer && <SupplierBadge name={item.offer.supplierName} />}
          {item.physicalLoad !== 'low' && (
            <Badge tone={item.physicalLoad === 'high' ? 'warning' : 'neutral'}>체력 {LOAD_LABEL[item.physicalLoad]}</Badge>
          )}
          {item.weatherSensitive && (
            <Badge tone="warning"><CloudRain size={10} /> 날씨 영향</Badge>
          )}
          {item.accessibilityNotes && (
            <Badge tone="brand"><Accessibility size={10} /> {item.accessibilityNotes}</Badge>
          )}
        </div>
        {item.cancellationPolicy && (
          <p className="mt-1 text-[10px] text-ink-400">{item.cancellationPolicy.penaltyDescription}</p>
        )}
        {item.alternativeOf && (
          <p className="mt-1 rounded bg-ink-50 px-2 py-1 text-[10px] text-ink-500">☔ 대체 일정: {item.alternativeOf}</p>
        )}
        {item.aiNote && <p className="mt-1 text-[10px] italic text-ink-400">{item.aiNote}</p>}
      </div>
    </div>
  );
}
