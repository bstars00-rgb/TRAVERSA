import { useTripStore } from '../stores/useTripStore';
import { Badge, EmptyState } from '../components/shared';
import { formatDateTime } from '../utils/format';
import type { TripEventType } from '../types';

const EVENT_TONE: Record<TripEventType, 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'gold'> = {
  TRIP_CREATED: 'brand',
  INTENT_UPDATED: 'neutral',
  SEARCH_STARTED: 'brand',
  SUPPLIER_RESPONDED: 'brand',
  OFFER_SELECTED: 'success',
  ITINERARY_UPDATED: 'success',
  PRICE_RECHECKED: 'warning',
  USER_CONFIRMED: 'gold',
  BOOKING_PREPARED: 'success',
  ERROR_OCCURRED: 'danger',
};

/** /activity-log — TripEvent 뷰어. 민감정보는 마스킹되어 기록된다. */
export function ActivityLogPage() {
  const events = useTripStore((s) => s.events);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">이벤트 로그</h1>
          <p className="text-xs text-ink-500">
            모든 주요 작업이 TripEvent로 기록됩니다. 여행자 실명 등 민감정보는 원문으로 저장되지 않습니다.
          </p>
        </div>

        {events.length === 0 ? (
          <EmptyState title="기록된 이벤트가 없습니다" description="여행을 시작하면 이벤트가 쌓입니다." />
        ) : (
          <ol className="space-y-1.5">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2 text-xs">
                <Badge tone={EVENT_TONE[e.type]}>{e.type}</Badge>
                <span className="flex-1 text-ink-700">{e.summary}</span>
                <time className="text-xs tabular-nums text-ink-400">{formatDateTime(e.createdAt)}</time>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
