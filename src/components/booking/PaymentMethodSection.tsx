import { CreditCard, Lock, Split } from 'lucide-react';
import type { BookingPreparation } from '../../types';
import { Badge, SupplierBadge } from '../shared';
import { formatMoney } from '../../utils/currency';

/**
 * 통합 결제 — 카드 한 장이면 충분한 구조.
 * TRAVERSA가 Merchant of Record로 1회만 승인받고,
 * Payment Orchestrator가 공급사별로 자동 정산(분배)한다.
 * 프로토타입에서는 카드 정보를 입력받지 않는다.
 */
export function PaymentMethodSection({ preparation }: { preparation: BookingPreparation }) {
  // 공급사별 정산 분배 계산
  const bySupplier = new Map<string, number>();
  for (const item of preparation.items) {
    if (item.status === 'failed') continue;
    bySupplier.set(item.bookedVia, (bySupplier.get(item.bookedVia) ?? 0) + item.latestPrice.amount.amount);
  }
  const rows = [...bySupplier.entries()].sort((a, b) => b[1] - a[1]);
  const currency = preparation.totalDue.currency;

  return (
    <section className="rounded-xl border border-ink-100 bg-white p-4" aria-label="결제 수단">
      <h3 className="flex items-center gap-1.5 text-base font-semibold text-ink-800">
        <CreditCard size={16} className="text-brand-700" /> 결제 수단 — 카드 한 장이면 충분해요
      </h3>
      <p className="mt-0.5 text-xs text-ink-500">
        항공·호텔·픽업·티켓의 판매처가 달라도 결제는 <strong>한 번</strong>입니다. TRAVERSA가 대표 가맹점으로
        1회만 승인받고, 각 판매처에는 자동으로 정산됩니다.
      </p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {/* 카드 목업 — 프로토타입은 입력받지 않음 */}
        <div>
          <div className="tone-destination relative aspect-[8/5] max-w-xs rounded-2xl p-4 text-white shadow-md">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold tracking-wide">TRAVERSA PAY</span>
              <CreditCard size={20} className="text-white/80" />
            </div>
            <p className="mt-7 font-mono text-lg tracking-[0.2em]">•••• •••• •••• ••••</p>
            <div className="mt-4 flex items-center justify-between text-xs text-white/70">
              <span>CARD HOLDER</span>
              <span>MM / YY</span>
            </div>
          </div>
          <div className="mt-2.5 space-y-2 max-w-xs">
            <input
              disabled
              placeholder="카드번호 — 프로토타입에서는 입력받지 않아요"
              aria-label="카드번호 (비활성화)"
              className="w-full rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-400"
            />
            <div className="flex gap-2">
              <input disabled placeholder="MM/YY" aria-label="유효기간 (비활성화)" className="w-1/2 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-400" />
              <input disabled placeholder="CVC" aria-label="CVC (비활성화)" className="w-1/2 rounded-lg border border-dashed border-ink-200 bg-ink-50 px-3 py-2 text-xs text-ink-400" />
            </div>
            <p className="flex items-center gap-1 text-xs text-ink-400">
              <Lock size={11} /> 실제 서비스에서는 PG 토큰화로 카드 정보를 저장하지 않습니다.
            </p>
          </div>
        </div>

        {/* 공급사별 정산 분배 미리보기 */}
        <div>
          <h4 className="flex items-center gap-1.5 text-sm font-semibold text-ink-700">
            <Split size={14} /> 결제 1회 → 판매처 {rows.length}곳 자동 정산
          </h4>
          <ul className="mt-2 space-y-1.5">
            {rows.map(([supplier, amount]) => (
              <li key={supplier} className="flex items-center justify-between gap-2 rounded-lg bg-ink-50 px-3 py-2">
                <SupplierBadge name={supplier} />
                <span className="text-sm font-medium tabular-nums text-ink-700">
                  {formatMoney({ amount, currency })}
                </span>
              </li>
            ))}
            <li className="flex items-center justify-between gap-2 rounded-lg border-2 border-brand-200 bg-brand-50 px-3 py-2">
              <span className="flex items-center gap-1.5 text-sm font-bold text-brand-800">
                내 카드 승인 <Badge tone="brand">1회</Badge>
              </span>
              <span className="text-base font-bold tabular-nums text-brand-800">
                {formatMoney(preparation.totalDue)}
              </span>
            </li>
          </ul>
          <p className="mt-2 text-xs leading-relaxed text-ink-400">
            일부 판매처 예약이 실패하면 해당 금액만 자동 부분환불됩니다 (Saga 보상 트랜잭션). 판매처별로
            따로 결제할 필요가 없어요.
          </p>
        </div>
      </div>
    </section>
  );
}
