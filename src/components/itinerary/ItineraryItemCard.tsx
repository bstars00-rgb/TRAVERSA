import {
  Accessibility,
  Bed,
  Bus,
  Camera,
  CloudRain,
  GripVertical,
  Plane,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  Waves,
} from 'lucide-react';
import type { ItineraryItem } from '../../types';
import { Badge, PriceDisplay, StatusBadge, SupplierBadge } from '../shared';
import { formatDuration } from '../../utils/format';

const TYPE_ICON: Record<ItineraryItem['type'], React.ReactNode> = {
  flight: <Plane size={14} />,
  hotel: <Bed size={14} />,
  checkin: <Bed size={14} />,
  checkout: <Bed size={14} />,
  transport: <Bus size={14} />,
  activity: <Sparkles size={14} />,
  meal: <UtensilsCrossed size={14} />,
  rest: <Waves size={14} />,
  sightseeing: <Camera size={14} />,
  shopping: <ShoppingBag size={14} />,
};

const LOAD_LABEL = { low: '낮음', medium: '보통', high: '높음' } as const;

export function ItineraryItemCard({ item }: { item: ItineraryItem }) {
  return (
    <div className="group flex gap-2.5 rounded-lg border border-ink-100 bg-white p-3 shadow-sm transition-shadow hover:shadow">
      {/* 드래그 핸들 (시각적 표현) */}
      <span className="mt-0.5 cursor-grab text-ink-200 group-hover:text-ink-400" aria-hidden>
        <GripVertical size={14} />
      </span>
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
        {TYPE_ICON[item.type]}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-xs font-semibold tabular-nums text-ink-500">{item.startTime}</span>
          <h5 className="text-[13px] font-semibold text-ink-800">{item.title}</h5>
          {item.requiresBooking && <StatusBadge status={item.bookingStatus} />}
        </div>
        <p className="mt-0.5 text-[11px] text-ink-500">
          {item.location} · 소요 {formatDuration(item.durationMinutes)}
          {item.travelMinutesFromPrevious > 0 && ` · 이동 ${formatDuration(item.travelMinutesFromPrevious)}`}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {item.price && (
            <PriceDisplay amount={item.price.amount} status={item.price.status} size="sm" />
          )}
          {item.offer && <SupplierBadge name={item.offer.supplierName} />}
          <Badge tone={item.physicalLoad === 'high' ? 'warning' : 'neutral'}>체력 {LOAD_LABEL[item.physicalLoad]}</Badge>
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
          <p className="mt-1 rounded bg-ink-50 px-2 py-1 text-[10px] text-ink-500">대체 일정: {item.alternativeOf}</p>
        )}
        {item.aiNote && <p className="mt-1 text-[10px] italic text-ink-400">{item.aiNote}</p>}
      </div>
    </div>
  );
}
