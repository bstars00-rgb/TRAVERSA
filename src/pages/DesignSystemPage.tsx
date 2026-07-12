import { useState } from 'react';
import { Mic, Paperclip } from 'lucide-react';
import {
  Badge,
  Button,
  ConfidenceIndicator,
  ConfirmDialog,
  Drawer,
  EmptyState,
  IconButton,
  LoadingSkeleton,
  Modal,
  PriceDisplay,
  PRICE_STATUS_META,
  ProgressSteps,
  SegmentedControl,
  SourceTag,
  StatusBadge,
  SupplierBadge,
} from '../components/shared';
import type { BookingStatus, DataSourceType, PriceStatus } from '../types';
import { useUIStore } from '../stores/useUIStore';

const BOOKING_STATUSES: BookingStatus[] = [
  'idea', 'searching', 'compared', 'selected', 'rechecking',
  'ready_to_book', 'on_hold', 'confirmed', 'failed', 'needs_attention',
];
const PRICE_STATUSES: PriceStatus[] = ['estimated', 'retrieved', 'rechecked', 'locked', 'changed'];
const SOURCES: DataSourceType[] = ['ai_recommendation', 'live_supplier_data', 'user_confirmed', 'booking_confirmation'];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-ink-100 bg-white p-5">
      <h2 className="mb-4 text-base font-semibold text-ink-800">{title}</h2>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </section>
  );
}

export function DesignSystemPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [segment, setSegment] = useState<'chat' | 'plan' | 'booking'>('chat');
  const pushToast = useUIStore((s) => s.pushToast);

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">디자인 시스템</h1>
          <p className="text-xs text-ink-500">TRAVERSA AI 공통 컴포넌트 카탈로그 (Storybook 대체)</p>
        </div>

        <Section title="Button">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </Section>

        <Section title="IconButton">
          <IconButton label="음성 입력"><Mic size={16} /></IconButton>
          <IconButton label="파일 첨부"><Paperclip size={16} /></IconButton>
        </Section>

        <Section title="Badge">
          <Badge>Neutral</Badge>
          <Badge tone="brand">Brand</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
          <Badge tone="gold">Gold</Badge>
        </Section>

        <Section title="StatusBadge — 예약 상태 10종">
          {BOOKING_STATUSES.map((s) => <StatusBadge key={s} status={s} />)}
        </Section>

        <Section title="PriceDisplay — 가격 상태 5종">
          <div className="flex flex-col gap-2">
            {PRICE_STATUSES.map((s) => (
              <div key={s} className="flex items-center gap-4">
                <PriceDisplay amount={{ amount: 1240000, currency: 'KRW' }} status={s} capturedAt={new Date().toISOString()} />
                <span className="text-xs text-ink-400">{PRICE_STATUS_META[s].description}</span>
              </div>
            ))}
          </div>
        </Section>

        <Section title="SupplierBadge — 공급사 상태">
          <SupplierBadge name="SakuraDirect" status="connected" />
          <SupplierBadge name="GlobalBeds" status="slow" />
          <SupplierBadge name="AsiaRoomsHub" status="degraded" />
          <SupplierBadge name="AirConnect" status="rate_limited" />
          <SupplierBadge name="TransferLink" status="auth_failed" />
          <SupplierBadge name="LocalXperience" status="unavailable" />
        </Section>

        <Section title="ConfidenceIndicator">
          <ConfidenceIndicator value={0.95} label="높음" />
          <ConfidenceIndicator value={0.78} label="중간" />
          <ConfidenceIndicator value={0.55} label="낮음" />
        </Section>

        <Section title="SourceTag — 정보 출처 구분">
          {SOURCES.map((s) => <SourceTag key={s} source={s} />)}
        </Section>

        <Section title="LoadingSkeleton / EmptyState">
          <div className="w-56"><LoadingSkeleton /></div>
          <div className="w-72">
            <EmptyState title="검색 결과가 없습니다" description="조건을 바꿔 다시 검색해보세요." />
          </div>
        </Section>

        <Section title="SegmentedControl / ProgressSteps">
          <SegmentedControl
            ariaLabel="모바일 탭 예시"
            value={segment}
            onChange={setSegment}
            options={[
              { value: 'chat', label: '대화' },
              { value: 'plan', label: '여행계획' },
              { value: 'booking', label: '예약·예산' },
            ]}
          />
          <ProgressSteps
            steps={[
              { id: '1', label: '상품 선택', state: 'done' },
              { id: '2', label: '가격 재조회', state: 'done' },
              { id: '3', label: '여행자 정보', state: 'current' },
              { id: '4', label: '결제 준비', state: 'upcoming' },
              { id: '5', label: '예약 실행', state: 'disabled' },
            ]}
          />
        </Section>

        <Section title="Modal / Drawer / ConfirmDialog / Toast">
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Modal 열기</Button>
          <Button variant="secondary" onClick={() => setDrawerOpen(true)}>Drawer 열기</Button>
          <Button variant="secondary" onClick={() => setConfirmOpen(true)}>ConfirmDialog 열기</Button>
          <Button variant="secondary" onClick={() => pushToast('success', '토스트 메시지 예시입니다')}>Toast 표시</Button>
        </Section>

        <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="모달 예시" footer={<Button onClick={() => setModalOpen(false)}>확인</Button>}>
          <p>모달 컴포넌트입니다. ESC 키 또는 배경 클릭으로 닫을 수 있습니다.</p>
        </Modal>
        <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="드로어 예시">
          <p className="text-sm text-ink-600">오른쪽에서 열리는 패널입니다. 상세 정보 표시에 사용합니다.</p>
        </Drawer>
        <ConfirmDialog
          open={confirmOpen}
          title="변경 확인"
          message="이 작업은 사용자 확인이 필요합니다. 계속할까요?"
          onConfirm={() => setConfirmOpen(false)}
          onCancel={() => setConfirmOpen(false)}
        />
      </div>
    </div>
  );
}
