import type { Traveler } from '../../types';
import { Badge } from '../shared';
import { useBookingStore } from '../../stores/useBookingStore';

const TYPE_LABEL = { adult: '성인', senior: '시니어', child: '아동', infant: '유아' } as const;

/** 여행자 영문명 입력 — 반드시 사용자가 직접 확정한다 (Human-in-the-loop) */
export function TravelerForm({ traveler, index }: { traveler: Traveler; index: number }) {
  const updateTraveler = useBookingStore((s) => s.updateTraveler);
  const patch = (p: Partial<Traveler>) => updateTraveler({ ...traveler, ...p, confirmedByUser: false });

  const canConfirm = Boolean(traveler.englishGivenName?.trim() && traveler.englishFamilyName?.trim());

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <h4 className="text-xs font-semibold text-ink-700">여행자 {index + 1}</h4>
        <Badge tone="neutral">{TYPE_LABEL[traveler.type]}</Badge>
        {traveler.confirmedByUser ? (
          <Badge tone="success">사용자 확정</Badge>
        ) : (
          <Badge tone="warning">확정 필요</Badge>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-[11px] text-ink-500">
          영문 이름 (Given name)
          <input
            value={traveler.englishGivenName ?? ''}
            onChange={(e) => patch({ englishGivenName: e.target.value.toUpperCase() })}
            placeholder="GILDONG"
            className="mt-1 w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-xs uppercase outline-none focus:border-brand-500"
          />
        </label>
        <label className="text-[11px] text-ink-500">
          영문 성 (Family name)
          <input
            value={traveler.englishFamilyName ?? ''}
            onChange={(e) => patch({ englishFamilyName: e.target.value.toUpperCase() })}
            placeholder="HONG"
            className="mt-1 w-full rounded-md border border-ink-200 px-2.5 py-1.5 text-xs uppercase outline-none focus:border-brand-500"
          />
        </label>
      </div>
      <label className="mt-2 flex items-start gap-2 text-[11px] text-ink-600">
        <input
          type="checkbox"
          checked={traveler.confirmedByUser}
          disabled={!canConfirm}
          onChange={(e) => updateTraveler({ ...traveler, confirmedByUser: e.target.checked })}
          className="mt-0.5 accent-brand-700"
        />
        여권 표기와 정확히 일치함을 직접 확인했습니다. (AI가 대신 확정할 수 없습니다)
      </label>
    </div>
  );
}
