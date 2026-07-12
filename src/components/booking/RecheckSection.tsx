import { RefreshCw, TrendingDown, TrendingUp, XCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useBookingStore } from '../../stores/useBookingStore';
import { Button } from '../shared';
import { formatMoney } from '../../utils/currency';
import type { RecheckResult } from '../../types';

const OUTCOME_ICON: Record<RecheckResult['outcome'], React.ReactNode> = {
  price_same: <CheckCircle2 size={14} className="text-emerald-600" />,
  price_decreased: <TrendingDown size={14} className="text-emerald-600" />,
  price_increased: <TrendingUp size={14} className="text-red-600" />,
  sold_out: <XCircle size={14} className="text-red-600" />,
  room_changed: <AlertCircle size={14} className="text-amber-600" />,
  policy_changed: <AlertCircle size={14} className="text-amber-600" />,
  alternative_supplier_available: <AlertCircle size={14} className="text-brand-600" />,
};

/** 가격 재확인 — 변경 시 AI가 자동 결정하지 않고 사용자에게 선택지를 준다 */
export function RecheckSection() {
  const { preparation, isRechecking, recheckAll, resolveRecheck } = useBookingStore();
  if (!preparation) return null;

  const needsAttention = preparation.items.filter((i) => i.status === 'needs_attention' || i.status === 'failed');

  return (
    <section className="rounded-xl border border-ink-100 bg-white p-4" aria-label="가격 재확인">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-semibold text-ink-800">최신 가격 재조회</h3>
          <p className="text-xs text-ink-500">예약 직전, 모든 상품의 가격과 재고를 공급사에 다시 확인합니다.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => void recheckAll()} disabled={isRechecking}>
          <RefreshCw size={13} className={isRechecking ? 'animate-spin' : ''} />
          {isRechecking ? '재조회 중…' : '전체 재조회'}
        </Button>
      </div>

      {preparation.recheckResults.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {preparation.recheckResults.map((r) => {
            const item = preparation.items.find((i) => i.id === r.bookingItemId);
            return (
              <li key={`${r.bookingItemId}-${r.recheckedAt}`} className="flex flex-wrap items-center gap-2 rounded-lg bg-ink-50 px-2.5 py-2 text-xs">
                {OUTCOME_ICON[r.outcome]}
                <span className="flex-1 text-ink-700">{r.message}</span>
                {r.previousPrice.amount !== r.currentPrice.amount && (
                  <span className="tabular-nums text-ink-500">
                    {formatMoney(r.previousPrice)} → <strong className="text-ink-800">{formatMoney(r.currentPrice)}</strong>
                  </span>
                )}
                {item && (item.status === 'needs_attention' || item.status === 'failed') && (
                  <span className="flex gap-1.5">
                    {item.status !== 'failed' && (
                      <Button size="sm" variant="secondary" onClick={() => resolveRecheck(r.bookingItemId, 'accept')}>
                        변경된 가격으로 계속
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => resolveRecheck(r.bookingItemId, 'exclude')}>
                      상품 제외
                    </Button>
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {needsAttention.length > 0 && (
        <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-2 text-xs text-amber-800" role="alert">
          가격/재고가 변경된 상품이 {needsAttention.length}개 있습니다. 위 선택지에서 진행 방법을 직접 결정해주세요.
          대체 상품 확인이나 전체 여행 재최적화는 대화 패널에서 요청할 수 있습니다.
        </p>
      )}
    </section>
  );
}
