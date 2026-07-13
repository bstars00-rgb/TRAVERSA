import { useState } from 'react';
import { Accessibility, CloudRain, GripVertical, Trash2 } from 'lucide-react';
import type { ItineraryItem } from '../../types';
import { Badge, ConfirmDialog, IconButton, PriceDisplay, StatusBadge, SupplierBadge } from '../shared';
import { formatDuration } from '../../utils/format';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { useUIStore } from '../../stores/useUIStore';

/** 항공·숙소(체크인/아웃)는 검색 단계에서 변경 — 카드 삭제 대상에서 제외 */
const NON_REMOVABLE: ItineraryItem['type'][] = ['flight', 'checkin', 'checkout', 'hotel'];

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
  const [confirmRemove, setConfirmRemove] = useState(false);
  const removeItem = useItineraryStore((s) => s.removeItem);
  const pushToast = useUIStore((s) => s.pushToast);
  const removable = !NON_REMOVABLE.includes(item.type);

  return (
    <div className="group relative flex gap-3 overflow-hidden rounded-xl border border-ink-100 bg-white p-2.5 shadow-sm transition-shadow hover:shadow">
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
          <h5 className="text-base font-semibold text-ink-800">{item.title}</h5>
          {item.requiresBooking && <StatusBadge status={item.bookingStatus} />}
        </div>
        <p className="mt-0.5 text-xs text-ink-500">
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
          <p className="mt-1 text-xs text-ink-400">{item.cancellationPolicy.penaltyDescription}</p>
        )}
        {item.alternativeOf && (
          <p className="mt-1 rounded bg-ink-50 px-2 py-1 text-xs text-ink-500">☔ 대체 일정: {item.alternativeOf}</p>
        )}
        {item.aiNote && <p className="mt-1 text-xs italic text-ink-400">{item.aiNote}</p>}
      </div>

      {removable && (
        <IconButton
          label={`"${item.title}" 일정에서 빼기`}
          className="absolute right-1.5 top-1.5 h-8 w-8 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
          onClick={() => setConfirmRemove(true)}
        >
          <Trash2 size={14} />
        </IconButton>
      )}

      <ConfirmDialog
        open={confirmRemove}
        title="일정에서 빼기"
        message={
          <>
            <strong>{item.title}</strong> 항목을 일정에서 뺄까요?
            {item.requiresBooking && ' 예약 대상 상품이라면 예약 준비 목록에서도 제외됩니다.'}
          </>
        }
        confirmLabel="빼기"
        danger
        onConfirm={() => {
          removeItem(item.id);
          setConfirmRemove(false);
          pushToast('success', `"${item.title}" 항목을 뺐어요`);
        }}
        onCancel={() => setConfirmRemove(false)}
      />
    </div>
  );
}
