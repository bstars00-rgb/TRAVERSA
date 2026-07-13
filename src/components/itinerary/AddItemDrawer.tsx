import { useState } from 'react';
import { Plus, Ticket } from 'lucide-react';
import type { ItineraryItem } from '../../types';
import { Badge, Button, Drawer, PriceDisplay, SupplierBadge } from '../shared';
import { activityItem, estimatedItem } from '../../services/itinerary/generator';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { useSearchStore } from '../../stores/useSearchStore';
import { useUIStore } from '../../stores/useUIStore';
import { formatDuration } from '../../utils/format';

const CUSTOM_TYPES: { value: ItineraryItem['type']; label: string }[] = [
  { value: 'meal', label: '식사' },
  { value: 'sightseeing', label: '관광' },
  { value: 'shopping', label: '쇼핑' },
  { value: 'rest', label: '휴식' },
];

/**
 * 날짜별 일정 추가 — ① 검색된 미포함 어트랙션/티켓 담기 ② 자유 일정 직접 입력.
 * 추가 즉시 검증 엔진이 충돌·예산을 재검사한다.
 */
export function AddItemDrawer({ dayNumber, onClose }: { dayNumber: number | null; onClose: () => void }) {
  const itinerary = useItineraryStore((s) => s.itinerary);
  const addItem = useItineraryStore((s) => s.addItem);
  const outcome = useSearchStore((s) => s.outcome);
  const pushToast = useUIStore((s) => s.pushToast);

  const [title, setTitle] = useState('');
  const [type, setType] = useState<ItineraryItem['type']>('meal');
  const [startTime, setStartTime] = useState('12:00');
  const [duration, setDuration] = useState(90);
  const [cost, setCost] = useState(0);

  if (dayNumber === null) return null;

  // 이미 일정에 담긴 상품은 제외한 미포함 어트랙션/티켓
  const usedOfferIds = new Set(
    (itinerary?.days ?? []).flatMap((d) => d.items).map((i) => i.offer?.supplierOfferId).filter(Boolean),
  );
  const available = (outcome?.activityOffers ?? []).filter((a) => !usedOfferIds.has(a.supplierOfferId));

  const addOffer = (offerId: string) => {
    const offer = available.find((a) => a.supplierOfferId === offerId);
    if (!offer) return;
    addItem(dayNumber, activityItem(offer, '10:00'));
    pushToast('success', `Day ${dayNumber}에 "${offer.title}"을(를) 담았어요`);
    onClose();
  };

  const addCustom = () => {
    if (!title.trim()) return;
    addItem(dayNumber, estimatedItem(type, title.trim(), startTime, duration, '직접 추가', cost, false));
    pushToast('success', `Day ${dayNumber}에 "${title.trim()}"을(를) 추가했어요`);
    setTitle('');
    onClose();
  };

  return (
    <Drawer open onClose={onClose} title={`Day ${dayNumber}에 일정 추가`}>
      <div className="space-y-5">
        <section aria-label="검색된 상품 추가">
          <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-700">
            <Ticket size={14} /> 검색된 티켓·어트랙션 담기
          </h3>
          {available.length === 0 ? (
            <p className="mt-2 rounded-lg bg-ink-50 p-3 text-xs text-ink-500">
              담을 수 있는 상품이 모두 일정에 들어있어요. 새 상품은 대화에서 재검색을 요청해주세요.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {available.map((a) => (
                <li key={a.supplierOfferId} className="rounded-xl border border-ink-100 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-ink-800">{a.title}</p>
                      <p className="mt-0.5 text-xs text-ink-500">
                        {a.meetingPoint} · {formatDuration(a.durationMinutes)}
                        {a.minAge !== undefined && ` · ${a.minAge}세 이상`}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        <SupplierBadge name={a.supplierName} />
                        <Badge tone="neutral">{a.category}</Badge>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <PriceDisplay amount={a.totalPrice} status="retrieved" size="sm" />
                      <Button size="sm" variant="secondary" onClick={() => addOffer(a.supplierOfferId)}>
                        <Plus size={13} /> 담기
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-label="자유 일정 추가" className="border-t border-ink-100 pt-4">
          <h3 className="text-sm font-semibold text-ink-700">자유 일정 직접 추가</h3>
          <p className="mt-0.5 text-xs text-ink-400">예약이 필요 없는 나만의 일정 (예상 비용은 예산에 합산돼요)</p>
          <div className="mt-3 space-y-2.5">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="예: 긴자 산책, 라멘 맛집"
              aria-label="일정 이름"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-ink-500">
                유형
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as ItineraryItem['type'])}
                  className="mt-1 w-full rounded-lg border border-ink-200 bg-white px-2.5 py-2 text-sm outline-none focus:border-brand-500"
                >
                  {CUSTOM_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-ink-500">
                시작 시각
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </label>
              <label className="text-xs text-ink-500">
                소요 (분)
                <input
                  type="number"
                  min={15}
                  step={15}
                  value={duration}
                  onChange={(e) => setDuration(Math.max(15, Number(e.target.value)))}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </label>
              <label className="text-xs text-ink-500">
                예상 비용 (원)
                <input
                  type="number"
                  min={0}
                  step={10000}
                  value={cost}
                  onChange={(e) => setCost(Math.max(0, Number(e.target.value)))}
                  className="mt-1 w-full rounded-lg border border-ink-200 px-2.5 py-2 text-sm outline-none focus:border-brand-500"
                />
              </label>
            </div>
            <Button className="w-full" disabled={!title.trim()} onClick={addCustom}>
              <Plus size={15} /> Day {dayNumber}에 추가
            </Button>
          </div>
        </section>
      </div>
    </Drawer>
  );
}
