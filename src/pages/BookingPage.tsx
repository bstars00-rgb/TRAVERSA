import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { useBookingStore, BOOKING_STEPS } from '../stores/useBookingStore';
import { useItineraryStore } from '../stores/useItineraryStore';
import { Badge, Button, EmptyState, Modal, ProgressSteps, SourceTag } from '../components/shared';
import { BookingItemCard } from '../components/booking/BookingItemCard';
import { TravelerForm } from '../components/booking/TravelerForm';
import { RecheckSection } from '../components/booking/RecheckSection';
import { PaymentMethodSection } from '../components/booking/PaymentMethodSection';
import { formatMoney } from '../utils/currency';
import { formatDate } from '../utils/format';

export function BookingPage() {
  const { preparation, goToStep, toggleConfirmation } = useBookingStore();
  const readiness = useBookingStore((s) => s.readiness)();
  const itinerary = useItineraryStore((s) => s.itinerary);
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  if (!preparation) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="예약 준비 중인 여행이 없습니다"
          description="워크스페이스에서 일정을 만들고 '예약 준비 시작'을 눌러주세요."
          action={
            <Link to="/trip">
              <Button variant="secondary">워크스페이스로 이동</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const stepIndex = BOOKING_STEPS.findIndex((s) => s.id === preparation.currentStep);
  const steps = BOOKING_STEPS.map((s, i) => ({
    id: s.id,
    label: s.label,
    state: !s.implemented
      ? ('disabled' as const)
      : i < stepIndex
        ? ('done' as const)
        : i === stepIndex
          ? ('current' as const)
          : ('upcoming' as const),
  }));

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">예약 준비</h1>
          <p className="text-xs text-ink-500">결제 직전까지의 준비 단계입니다. 모든 승인은 사용자가 직접 수행합니다.</p>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3" role="note">
          <ShieldCheck size={16} className="mt-0.5 shrink-0 text-emerald-700" />
          <p className="text-xs leading-relaxed text-emerald-900">
            <strong>안심하세요 — 이 단계에서는 아무것도 결제되지 않아요.</strong>
            <br />
            가격을 다시 확인하고, 여행자 정보를 입력하고, 조건에 동의하는 준비 과정이에요. 마지막 결제 버튼을
            누르기 전까지 언제든 수정하거나 그만둘 수 있어요.
          </p>
        </div>

        <ProgressSteps steps={steps} onStepClick={(id) => goToStep(id as typeof preparation.currentStep)} />

        <RecheckSection />

        {/* 여행 전체 요약 */}
        {itinerary && (
          <section className="rounded-xl border border-ink-100 bg-white p-4">
            <h3 className="text-base font-semibold text-ink-800">여행 전체 일정</h3>
            <p className="mt-1 text-xs text-ink-600">
              {itinerary.destinationName} · {formatDate(itinerary.days[0].date)} ~ {formatDate(itinerary.days[itinerary.days.length - 1].date)} · {itinerary.days.length}일
            </p>
          </section>
        )}

        {/* 상품 목록 */}
        <section className="space-y-3" aria-label="예약 상품">
          <h3 className="text-base font-semibold text-ink-800">예약 상품 {preparation.items.length}개</h3>
          {preparation.items.map((item) => (
            <BookingItemCard key={item.id} item={item} />
          ))}
        </section>

        {/* 여행자 정보 */}
        <section className="space-y-3" aria-label="여행자 정보">
          <h3 className="text-base font-semibold text-ink-800">여행자 정보</h3>
          {preparation.travelers.map((t, i) => (
            <TravelerForm key={t.id} traveler={t} index={i} />
          ))}
        </section>

        {/* Human-in-the-loop 확인 체크리스트 */}
        <section className="rounded-xl border border-ink-100 bg-white p-4" aria-label="사용자 확인 항목">
          <h3 className="flex items-center gap-1.5 text-base font-semibold text-ink-800">
            <ShieldCheck size={15} className="text-brand-700" /> 사용자 확인 항목
          </h3>
          <p className="mt-0.5 text-xs text-ink-500">
            아래 항목은 AI가 대신 승인할 수 없으며, 반드시 사용자가 직접 확인해야 합니다. 확인 시각이 승인 증적으로 기록됩니다.
          </p>
          <ul className="mt-3 space-y-2">
            {preparation.confirmations.map((c) => (
              <li key={c.id}>
                <label className="flex items-start gap-2 text-xs text-ink-700">
                  <input
                    type="checkbox"
                    checked={c.confirmed}
                    onChange={() => toggleConfirmation(c.kind, `${c.label} — 총액 ${formatMoney(preparation.totalDue)}`)}
                    className="mt-0.5 accent-brand-700"
                  />
                  <span>
                    {c.label}
                    {c.confirmed && c.confirmedAt && (
                      <span className="ml-1.5 text-xs text-emerald-700">
                        <SourceTag source="user_confirmed" /> {new Date(c.confirmedAt).toLocaleTimeString('ko-KR')}
                      </span>
                    )}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* 통합 결제 — 카드 한 장으로 모든 판매처 정산 */}
        <PaymentMethodSection preparation={preparation} />

        {/* 총액 + CTA */}
        <section className="rounded-xl border-2 border-brand-200 bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs text-ink-500">총 결제 예정금액 (세금·수수료 포함)</p>
              <p className="text-xl font-bold tabular-nums text-ink-900">{formatMoney(preparation.totalDue)}</p>
              <p className="mt-0.5 text-xs text-ink-400">
                확인 완료 {readiness.confirmed}/{readiness.total} ·{' '}
                {readiness.ready ? '모든 확인이 끝났습니다' : '남은 확인 항목을 완료해주세요'}
              </p>
            </div>
            <Button size="lg" disabled={!readiness.ready} onClick={() => setDemoModalOpen(true)}>
              예약 및 결제 단계로 이동 <ArrowRight size={15} />
            </Button>
          </div>
        </section>

        <Modal
          open={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
          title="프로토타입 안내"
          footer={<Button onClick={() => setDemoModalOpen(false)}>확인</Button>}
        >
          <p className="font-medium text-ink-800">프로토타입에서는 실제 예약과 결제가 실행되지 않습니다.</p>
          <p className="mt-3 text-xs text-ink-500">
            실제 서비스에서는 카드 한 장으로 1회만 승인하면, TRAVERSA가 대표 가맹점(Merchant of Record)으로서
            아래 구조를 통해 모든 판매처에 자동 정산합니다.
          </p>
          <ol className="mt-2 space-y-1 text-xs text-ink-600">
            {[
              'Payment Orchestrator',
              '결제수단 선택',
              '3DS 또는 인증',
              '공급사별 예약 실행',
              '부분 실패 처리 (Saga 보상 트랜잭션)',
              '최종 예약 확인',
            ].map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <Badge tone="brand">{i + 1}</Badge> {s}
              </li>
            ))}
          </ol>
        </Modal>
      </div>
    </div>
  );
}
