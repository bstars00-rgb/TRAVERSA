import { AlertTriangle, ShieldAlert, Wallet } from 'lucide-react';
import { useItineraryStore } from '../../stores/useItineraryStore';
import { useTripStore } from '../../stores/useTripStore';
import { useSupplierStore } from '../../stores/useSupplierStore';
import { useBookingStore } from '../../stores/useBookingStore';
import { breakdownBudget } from '../../services/itinerary/budget';
import { formatMoney } from '../../utils/currency';
import { Badge, SupplierBadge } from '../shared';
import { SUPPLIERS } from '../../data/suppliers';

/** 오른쪽 패널: 예산 · 충돌 · 리스크 · 공급사 상태 · 예약 준비도 */
export function TripIntelligencePanel() {
  const itinerary = useItineraryStore((s) => s.itinerary);
  const issues = useItineraryStore((s) => s.validationIssues);
  const risks = useItineraryStore((s) => s.riskAlerts);
  const intent = useTripStore((s) => s.intent);
  const health = useSupplierStore((s) => s.health);
  const readiness = useBookingStore((s) => s.readiness)();

  const budget = itinerary ? breakdownBudget(itinerary, intent.currency, intent.budget) : null;

  const totalTravelMinutes = itinerary
    ? itinerary.days.reduce((sum, d) => sum + d.items.reduce((s, i) => s + i.travelMinutesFromPrevious, 0), 0)
    : 0;
  const highLoadCount = itinerary
    ? itinerary.days.reduce((sum, d) => sum + d.items.filter((i) => i.physicalLoad === 'high').length, 0)
    : 0;
  const refundableAll = itinerary
    ? itinerary.days.every((d) =>
        d.items.every((i) => !i.cancellationPolicy || i.cancellationPolicy.refundable),
      )
    : true;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-100 px-4 py-2.5">
        <h2 className="text-xs font-semibold text-ink-700">한눈에 보기</h2>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3">
        {/* 예산 */}
        <section className="rounded-xl border border-ink-100 bg-white p-3.5" aria-label="예산">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <Wallet size={13} /> 예산
          </h3>
          {budget ? (
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between"><dt className="text-ink-500">확정 가격 (공급사)</dt><dd className="font-semibold tabular-nums">{formatMoney(budget.confirmed)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-500">예상 가격 (AI 추정)</dt><dd className="tabular-nums text-ink-500">약 {formatMoney(budget.estimated)}</dd></div>
              <div className="flex justify-between border-t border-ink-100 pt-1.5"><dt className="font-semibold">합계</dt><dd className="font-bold tabular-nums">{formatMoney(budget.total)}</dd></div>
              {budget.remaining && (
                <div className="flex justify-between">
                  <dt className="text-ink-500">남은 예산</dt>
                  <dd className={`font-semibold tabular-nums ${budget.overBudget ? 'text-red-700' : 'text-emerald-700'}`}>
                    {formatMoney(budget.remaining)}
                  </dd>
                </div>
              )}
              {intent.budget !== undefined && (
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-ink-100" role="meter" aria-label="예산 사용률" aria-valuenow={Math.min(100, Math.round((budget.total.amount / intent.budget) * 100))} aria-valuemin={0} aria-valuemax={100}>
                  <div
                    className={`h-full rounded-full ${budget.overBudget ? 'bg-red-500' : 'bg-brand-500'}`}
                    style={{ width: `${Math.min(100, (budget.total.amount / intent.budget) * 100)}%` }}
                  />
                </div>
              )}
            </dl>
          ) : (
            <p className="text-xs text-ink-400">일정이 생성되면 예산이 집계됩니다.</p>
          )}
        </section>

        {/* 일정 충돌 */}
        <section className="rounded-xl border border-ink-100 bg-white p-3.5" aria-label="일정 충돌">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <AlertTriangle size={13} /> 일정 검증 {issues.length > 0 && <Badge tone="warning">{issues.length}</Badge>}
          </h3>
          {issues.length === 0 ? (
            <p className="text-xs text-emerald-700">감지된 충돌이 없습니다.</p>
          ) : (
            <ul className="space-y-1.5">
              {issues.map((issue) => (
                <li key={issue.id} className={`rounded-md px-2 py-1.5 text-[11px] ${issue.severity === 'critical' ? 'bg-red-50 text-red-800' : 'bg-amber-50 text-amber-800'}`}>
                  {issue.message}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* 이동 난이도 / 취소 가능성 */}
        {itinerary && (
          <section className="rounded-xl border border-ink-100 bg-white p-3.5">
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between"><dt className="text-ink-500">총 이동시간</dt><dd className="font-medium">{Math.round(totalTravelMinutes / 60 * 10) / 10}시간</dd></div>
              <div className="flex justify-between">
                <dt className="text-ink-500">이동 난이도</dt>
                <dd><Badge tone={highLoadCount > 2 ? 'warning' : 'success'}>{highLoadCount > 2 ? '높음' : highLoadCount > 0 ? '보통' : '낮음'}</Badge></dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">전체 취소 가능</dt>
                <dd><Badge tone={refundableAll ? 'success' : 'warning'}>{refundableAll ? '가능' : '일부 불가'}</Badge></dd>
              </div>
            </dl>
          </section>
        )}

        {/* 여행 리스크 */}
        <section className="rounded-xl border border-ink-100 bg-white p-3.5" aria-label="여행 리스크">
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <ShieldAlert size={13} /> 여행 리스크 {risks.length > 0 && <Badge tone="warning">{risks.length}</Badge>}
          </h3>
          {risks.length === 0 ? (
            <p className="text-xs text-ink-400">감지된 리스크가 없습니다.</p>
          ) : (
            <ul className="space-y-1.5">
              {risks.slice(0, 6).map((r) => (
                <li key={r.id} className="rounded-md bg-ink-50 px-2 py-1.5 text-[11px] text-ink-600">{r.message}</li>
              ))}
            </ul>
          )}
        </section>

        {/* 공급사 연결 상태 */}
        <section className="rounded-xl border border-ink-100 bg-white p-3.5" aria-label="공급사 연결 상태">
          <h3 className="mb-2 text-xs font-semibold text-ink-700">공급사 연결</h3>
          <div className="flex flex-wrap gap-1.5">
            {SUPPLIERS.map((s) => {
              const h = health.find((x) => x.supplierId === s.id);
              return <SupplierBadge key={s.id} name={s.name} status={h?.status ?? 'connected'} />;
            })}
          </div>
        </section>

        {/* 예약 준비도 */}
        <section className="rounded-xl border border-ink-100 bg-white p-3.5" aria-label="예약 준비도">
          <h3 className="mb-2 text-xs font-semibold text-ink-700">예약 준비도</h3>
          <div className="flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{ width: `${readiness.total === 0 ? 0 : (readiness.confirmed / readiness.total) * 100}%` }}
              />
            </div>
            <span className="text-[11px] tabular-nums text-ink-500">{readiness.confirmed}/{readiness.total} 확인</span>
          </div>
          <p className="mt-1.5 text-[10px] text-ink-400">
            {readiness.ready ? '결제 준비 단계로 이동할 수 있습니다.' : '예약 준비 화면에서 사용자 확인 항목을 완료하세요.'}
          </p>
        </section>
      </div>
    </div>
  );
}
