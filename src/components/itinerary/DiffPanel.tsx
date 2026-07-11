import { ArrowRight, Clock, Wallet } from 'lucide-react';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { Badge, Button } from '../shared';
import { formatMoney } from '../../utils/currency';
import { useUIStore } from '../../stores/useUIStore';

const KIND_TONE = { add: 'success', remove: 'danger', replace: 'warning', modify: 'brand' } as const;
const KIND_LABEL = { add: '추가', remove: '제거', replace: '교체', modify: '변경' } as const;

/** 일정 변경 Diff — 사용자가 "변경 적용"을 눌러야 반영된다 */
export function DiffPanel() {
  const diff = useItineraryStore((s) => s.pendingDiff);
  const applyPendingDiff = useItineraryStore((s) => s.applyPendingDiff);
  const rejectPendingDiff = useItineraryStore((s) => s.rejectPendingDiff);
  const pushToast = useUIStore((s) => s.pushToast);

  if (!diff) return null;

  return (
    <section className="rounded-xl border-2 border-brand-300 bg-brand-50 p-4" aria-label="일정 변경 제안">
      <h4 className="text-sm font-bold text-brand-800">일정 변경 제안</h4>
      <p className="mt-0.5 text-[11px] text-ink-500">요청: “{diff.command}”</p>
      <p className="mt-1.5 text-xs text-ink-700">{diff.summary}</p>

      <ul className="mt-3 space-y-1.5">
        {diff.changes.map((c, i) => (
          <li key={i} className="flex flex-wrap items-center gap-1.5 rounded-lg bg-white px-2.5 py-1.5 text-[11px]">
            <Badge tone={KIND_TONE[c.kind]}>{KIND_LABEL[c.kind]}</Badge>
            <span className="font-medium text-ink-700">{c.label}</span>
            {c.before && c.after && (
              <span className="flex items-center gap-1 text-ink-500">
                {c.before} <ArrowRight size={10} /> {c.after}
              </span>
            )}
            {c.impact && <span className="text-ink-400">({c.impact})</span>}
          </li>
        ))}
      </ul>

      <div className="mt-3 flex flex-wrap gap-3 text-xs">
        <span className="flex items-center gap-1 font-medium">
          <Wallet size={13} className="text-ink-400" />
          총비용 {diff.costDelta.amount === 0 ? '변동 없음' : (
            <span className={diff.costDelta.amount < 0 ? 'text-emerald-700' : 'text-red-700'}>
              {diff.costDelta.amount > 0 ? '+' : ''}{formatMoney(diff.costDelta)}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1 font-medium">
          <Clock size={13} className="text-ink-400" />
          이동시간 {diff.travelTimeDeltaMinutes === 0 ? '변동 없음' : `${diff.travelTimeDeltaMinutes > 0 ? '+' : ''}${diff.travelTimeDeltaMinutes}분`}
        </span>
      </div>

      <div className="mt-3 flex justify-end gap-2">
        <Button variant="ghost" onClick={rejectPendingDiff}>취소</Button>
        <Button
          onClick={() => {
            applyPendingDiff();
            pushToast('success', '변경이 일정에 적용되었습니다');
          }}
        >
          변경 적용
        </Button>
      </div>
    </section>
  );
}
