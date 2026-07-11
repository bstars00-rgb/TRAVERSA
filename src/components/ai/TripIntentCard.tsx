import { CheckCircle2, HelpCircle } from 'lucide-react';
import { useTripStore } from '../../stores/useTripStore';
import { ConfidenceIndicator, Badge } from '../shared';
import { findDestination } from '../../data/destinations';
import type { IntentField, TravelPace } from '../../types';

const FIELD_LABELS: Record<IntentField, string> = {
  dateRange: '여행 날짜/기간',
  origin: '출발지',
  travelers: '인원 구성',
  budget: '총예산',
  constraints: '필수 조건',
  interests: '취향',
  destination: '목적지',
};

const PACE_LABEL: Record<TravelPace, string> = { relaxed: '여유롭게', balanced: '균형', packed: '알차게' };

/** "내 여행조건" 패널 — AI가 이해한 내용과 확인 필요 항목을 구분, 직접 수정 가능 */
export function TripIntentCard() {
  const intent = useTripStore((s) => s.intent);
  const patchIntent = useTripStore((s) => s.patchIntent);

  const understood: { label: string; value: string }[] = [];
  if (intent.possibleDestinations.length > 0) {
    understood.push({
      label: '목적지 후보',
      value: intent.possibleDestinations.map((id) => findDestination(id)?.name ?? id).join(', '),
    });
  }
  if (intent.dateRange) understood.push({ label: '날짜', value: `${intent.dateRange.start} ~ ${intent.dateRange.end}${intent.dateRange.flexible ? ' (유동적)' : ''}` });
  if (intent.duration) understood.push({ label: '기간', value: `${intent.duration}박 ${intent.duration + 1}일` });
  if (intent.origin) understood.push({ label: '출발지', value: intent.origin });
  if (intent.travelers) understood.push({ label: '인원', value: `${intent.travelers}명 (${intent.travelerTypes.join(', ')})` });
  if (intent.interests.length > 0) understood.push({ label: '관심사', value: intent.interests.join(', ') });
  if (intent.accessibilityNeeds.length > 0) understood.push({ label: '접근성', value: intent.accessibilityNeeds.join(', ') });
  if (intent.constraints.length > 0) understood.push({ label: '조건', value: intent.constraints.join(' · ') });

  return (
    <section className="rounded-xl border border-ink-100 bg-white p-4" aria-label="내 여행조건">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-ink-500">내 여행조건</h3>
        <ConfidenceIndicator value={intent.confidenceScore} label="의도 파악 신뢰도" />
      </div>

      <div className="space-y-1.5">
        <p className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 size={12} /> AI가 이해한 내용
        </p>
        {understood.length === 0 && <p className="text-xs text-ink-400">아직 파악된 조건이 없습니다.</p>}
        <dl className="space-y-1">
          {understood.map((u) => (
            <div key={u.label} className="flex gap-2 text-xs">
              <dt className="w-16 shrink-0 text-ink-400">{u.label}</dt>
              <dd className="text-ink-700">{u.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {intent.missingInformation.length > 0 && (
        <div className="mt-3 space-y-1.5 border-t border-ink-100 pt-3">
          <p className="flex items-center gap-1 text-[11px] font-semibold text-amber-700">
            <HelpCircle size={12} /> 아직 확인이 필요한 내용
          </p>
          <div className="flex flex-wrap gap-1">
            {intent.missingInformation.map((f) => (
              <Badge key={f} tone="warning">{FIELD_LABELS[f]}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2 border-t border-ink-100 pt-3">
        <label className="text-[11px] text-ink-500">
          총예산 (만 원)
          <input
            type="number"
            min={0}
            value={intent.budget !== undefined ? intent.budget / 10_000 : ''}
            onChange={(e) =>
              patchIntent({ budget: e.target.value === '' ? undefined : Number(e.target.value) * 10_000 })
            }
            className="mt-1 w-full rounded-md border border-ink-200 px-2 py-1.5 text-xs text-ink-800 outline-none focus:border-brand-500"
          />
        </label>
        <label className="text-[11px] text-ink-500">
          여행 페이스
          <select
            value={intent.pace ?? 'balanced'}
            onChange={(e) => patchIntent({ pace: e.target.value as TravelPace })}
            className="mt-1 w-full rounded-md border border-ink-200 bg-white px-2 py-1.5 text-xs text-ink-800 outline-none focus:border-brand-500"
          >
            {(Object.keys(PACE_LABEL) as TravelPace[]).map((p) => (
              <option key={p} value={p}>{PACE_LABEL[p]}</option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-[10px] text-ink-400">신뢰도가 낮은 항목은 여기서 직접 수정할 수 있습니다.</p>
    </section>
  );
}
