import { useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, parseISO } from 'date-fns';
import { CalendarDays, Map } from 'lucide-react';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { useSearchStore } from '../../stores/useSearchStore';
import { useBookingStore } from '../../stores/useBookingStore';
import { useTripStore } from '../../stores/useTripStore';
import { Button, EmptyState, LoadingSkeleton } from '../shared';
import { TripIntentCard } from '../ai/TripIntentCard';
import { RecommendationCard } from '../search/RecommendationCard';
import { ItineraryItemCard } from './ItineraryItemCard';
import { DiffPanel } from './DiffPanel';
import { formatDate } from '../../utils/format';
import { useUIStore } from '../../stores/useUIStore';

function dDayLabel(startIso: string): string {
  const days = differenceInCalendarDays(parseISO(startIso), new Date());
  if (days > 0) return `D-${days}`;
  if (days === 0) return 'D-DAY';
  return '여행 중/완료';
}

export function JourneyCanvas() {
  const itinerary = useItineraryStore((s) => s.itinerary);
  const outcome = useSearchStore((s) => s.outcome);
  const isSearching = useSearchStore((s) => s.isSearching);
  const intent = useTripStore((s) => s.intent);
  const startPreparation = useBookingStore((s) => s.startPreparation);
  const setMobileTab = useUIStore((s) => s.setMobileTab);
  const navigate = useNavigate();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2.5">
        <h2 className="text-xs font-semibold text-ink-700">여행 계획</h2>
        {itinerary && (
          <Button
            size="sm"
            onClick={() => {
              startPreparation(itinerary, intent);
              navigate('/booking');
              setMobileTab('booking');
            }}
          >
            예약 준비 시작
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <TripIntentCard />

        {isSearching && (
          <div className="rounded-xl border border-ink-100 bg-white p-4">
            <p className="mb-3 text-xs font-semibold text-ink-500">공급사 검색 중…</p>
            <LoadingSkeleton lines={5} />
          </div>
        )}

        {/* 검색 결과 비교 (일정 생성 전) */}
        {!itinerary && !isSearching && outcome && (
          <section aria-label="추천 후보 비교" className="space-y-3">
            <h3 className="text-sm font-bold text-ink-800">AI 추천 후보 {outcome.recommendations.length}개</h3>
            {outcome.recommendations.length === 0 ? (
              <EmptyState
                title="추천할 호텔을 찾지 못했습니다"
                description="공급사 응답이 실패했을 수 있습니다. 대화에서 다시 검색을 요청해보세요."
              />
            ) : (
              outcome.recommendations.map((rec) => (
                <RecommendationCard key={rec.scored.offer.supplierOfferId} rec={rec} />
              ))
            )}
          </section>
        )}

        {!itinerary && !isSearching && !outcome && (
          <EmptyState
            icon={<CalendarDays size={32} />}
            title="아직 여행계획이 없습니다"
            description="왼쪽 대화에서 여행조건을 알려주시면 AI가 검색하고 이곳에 계획을 그려드립니다."
          />
        )}

        {/* 일정 타임라인 */}
        {itinerary && (
          <section aria-label="여행 일정" className="space-y-4">
            <DiffPanel />

            {/* 여행 히어로 배너 */}
            <div className="tone-destination overflow-hidden rounded-2xl p-4 text-white">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-medium text-white/70">나의 여행</p>
                  <h3 className="text-lg font-bold drop-shadow">
                    {itinerary.destinationName} {itinerary.days.length - 1}박 {itinerary.days.length}일
                  </h3>
                  <p className="mt-0.5 text-[11px] text-white/80">
                    {formatDate(itinerary.days[0].date)} 출발 · {intent.travelers ?? '?'}명
                    {intent.pace === 'relaxed' && ' · 여유로운 일정'}
                  </p>
                </div>
                <div className="rounded-xl bg-white/15 px-3 py-2 text-center backdrop-blur-sm">
                  <p className="text-[10px] text-white/70">출발까지</p>
                  <p className="text-lg font-bold tabular-nums">
                    {dDayLabel(itinerary.days[0].date)}
                  </p>
                </div>
              </div>
              <p className="mt-3 text-[10px] text-white/60">
                일정 v{itinerary.version} · "둘째 날 좀 더 여유롭게" 처럼 대화로 언제든 수정할 수 있어요
              </p>
            </div>

            {/* 지도 미리보기 (mock) */}
            <div className="flex items-center gap-3 rounded-xl border border-ink-100 bg-white p-3">
              <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-lg bg-brand-100" aria-label="지도 미리보기">
                <svg viewBox="0 0 128 80" className="h-full w-full" aria-hidden>
                  <path d="M0 55 Q30 40 55 50 T128 42 V80 H0 Z" fill="var(--color-brand-200)" />
                  <path d="M0 62 Q40 52 70 58 T128 55 V80 H0 Z" fill="var(--color-brand-300)" opacity="0.6" />
                  <circle cx="45" cy="38" r="4" fill="var(--color-brand-700)" />
                  <circle cx="85" cy="30" r="3" fill="var(--color-gold-500)" />
                  <path d="M45 38 Q65 25 85 30" stroke="var(--color-brand-700)" strokeWidth="1.5" strokeDasharray="3 2" fill="none" />
                </svg>
                <span className="absolute bottom-1 right-1.5 flex items-center gap-0.5 text-[9px] text-brand-800"><Map size={9} /> 미리보기</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-ink-900">동선 미리보기</h3>
                <p className="text-[11px] text-ink-500">공항 → 숙소 → 주요 일정 동선이 무리 없는지 함께 확인해드려요.</p>
              </div>
            </div>

            {itinerary.days.map((day) => (
              <div key={day.dayNumber}>
                <div className="mb-2 flex items-baseline gap-2">
                  <h4 className="text-sm font-bold text-brand-800">Day {day.dayNumber}</h4>
                  <span className="text-[11px] text-ink-500">{formatDate(day.date)} · {day.title}</span>
                </div>
                <div className="space-y-2 border-l-2 border-brand-100 pl-3">
                  {day.items.map((item) => (
                    <ItineraryItemCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
