import type { ButtonHTMLAttributes, ReactNode } from 'react';
import type { BookingStatus, DataSourceType, Money, PriceStatus, SupplierStatus } from '../../types';
import { formatMoney } from '../../utils/currency';
import { formatTimeAgo } from '../../utils/format';

// ---------- Button / IconButton ----------

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASS: Record<ButtonVariant, string> = {
  primary: 'bg-brand-700 text-white hover:bg-brand-600 disabled:bg-ink-200 disabled:text-ink-400',
  secondary:
    'bg-white text-brand-700 border border-brand-300 hover:bg-brand-50 disabled:text-ink-400 disabled:border-ink-200',
  ghost: 'bg-transparent text-ink-600 hover:bg-ink-100 disabled:text-ink-400',
  danger: 'bg-red-700 text-white hover:bg-red-600 disabled:bg-ink-200 disabled:text-ink-400',
};

const SIZE_CLASS: Record<ButtonSize, string> = {
  sm: 'text-sm px-3 py-2 rounded-lg',
  md: 'text-base px-5 py-2.5 rounded-xl',
  lg: 'text-lg px-6 py-3.5 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({ variant = 'primary', size = 'md', className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`inline-flex items-center justify-center gap-1.5 font-medium transition-colors cursor-pointer disabled:cursor-not-allowed ${VARIANT_CLASS[variant]} ${SIZE_CLASS[size]} ${className}`}
      {...rest}
    />
  );
}

export function IconButton({
  label,
  children,
  className = '',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      aria-label={label}
      title={label}
      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-ink-300 ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

// ---------- Badge ----------

type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'gold';

const BADGE_TONE: Record<BadgeTone, string> = {
  neutral: 'bg-ink-100 text-ink-600',
  brand: 'bg-brand-100 text-brand-800',
  success: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  danger: 'bg-red-100 text-red-800',
  gold: 'bg-gold-100 text-gold-500',
};

export function Badge({ tone = 'neutral', children, className = '' }: { tone?: BadgeTone; children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}

// ---------- StatusBadge (예약 상태) ----------

/** B2C 사용자에게는 한글 상태를 보여준다 (내부 상태 코드는 그대로 유지) */
const BOOKING_STATUS_META: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  idea: { label: '자유 일정', tone: 'neutral' },
  searching: { label: '찾는 중', tone: 'brand' },
  compared: { label: '비교 완료', tone: 'brand' },
  selected: { label: '일정에 담김', tone: 'brand' },
  rechecking: { label: '재확인 중', tone: 'warning' },
  ready_to_book: { label: '예약 준비 완료', tone: 'success' },
  on_hold: { label: '가격 홀드 중', tone: 'gold' },
  confirmed: { label: '예약 확정', tone: 'success' },
  failed: { label: '예약 불가', tone: 'danger' },
  needs_attention: { label: '확인 필요', tone: 'danger' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

// ---------- PriceDisplay (가격 + 가격 상태) ----------

export const PRICE_STATUS_META: Record<PriceStatus, { label: string; tone: BadgeTone; description: string }> = {
  estimated: { label: '예상 금액', tone: 'neutral', description: 'AI가 예상한 금액 — 실제 가격은 검색 후 확정돼요' },
  retrieved: { label: '실시간 가격', tone: 'brand', description: '판매처에서 방금 확인한 금액' },
  rechecked: { label: '재확인 완료', tone: 'success', description: '예약 직전 최신 가격으로 다시 확인했어요' },
  locked: { label: '가격 보장', tone: 'gold', description: '일정 시간 동안 이 가격이 보장돼요' },
  changed: { label: '가격 변동', tone: 'danger', description: '가격이 바뀌었어요 — 진행 여부를 선택해주세요' },
};

export function PriceDisplay({
  amount,
  status,
  capturedAt,
  size = 'md',
}: {
  amount: Money;
  status: PriceStatus;
  capturedAt?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const meta = PRICE_STATUS_META[status];
  const amountClass = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm';
  return (
    <span className="inline-flex flex-wrap items-baseline gap-1.5">
      <span className={`font-semibold tabular-nums ${amountClass} ${status === 'estimated' ? 'text-ink-500' : 'text-ink-800'}`}>
        {status === 'estimated' ? '약 ' : ''}
        {formatMoney(amount)}
      </span>
      <Badge tone={meta.tone}>{meta.label}</Badge>
      {capturedAt && <span className="text-xs text-ink-400">{formatTimeAgo(capturedAt)} 확인</span>}
    </span>
  );
}

// ---------- SupplierBadge ----------

const SUPPLIER_STATUS_META: Record<SupplierStatus, { label: string; dot: string }> = {
  connected: { label: 'Connected', dot: 'bg-emerald-500' },
  slow: { label: 'Slow', dot: 'bg-amber-500' },
  degraded: { label: 'Degraded', dot: 'bg-orange-500' },
  rate_limited: { label: 'Rate limited', dot: 'bg-amber-600' },
  auth_failed: { label: 'Auth failed', dot: 'bg-red-500' },
  unavailable: { label: 'Unavailable', dot: 'bg-red-600' },
};

export function SupplierBadge({ name, status }: { name: string; status?: SupplierStatus }) {
  const meta = status ? SUPPLIER_STATUS_META[status] : null;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2 py-0.5 text-xs font-medium text-ink-600">
      {meta && <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} aria-hidden />}
      {name}
      {meta && <span className="text-ink-400">{meta.label}</span>}
    </span>
  );
}

// ---------- ConfidenceIndicator ----------

export function ConfidenceIndicator({ value, label }: { value: number; label?: string }) {
  const pct = Math.round(value * 100);
  const tone = pct >= 85 ? 'bg-emerald-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <span
      className="inline-flex items-center gap-2"
      role="meter"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? '신뢰도'}
    >
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-ink-100">
        <span className={`block h-full rounded-full ${tone}`} style={{ width: `${pct}%` }} />
      </span>
      <span className="text-xs tabular-nums text-ink-500">{pct}%</span>
    </span>
  );
}

// ---------- SourceTag (정보 출처 구분 — 핵심 UX 원칙) ----------

const SOURCE_META: Record<DataSourceType, { label: string; title: string; className: string }> = {
  ai_recommendation: {
    label: 'AI 추천',
    title: 'AI가 제안한 내용이에요. 예약 전 실시간 가격으로 다시 확인해요.',
    className: 'bg-ink-100 text-ink-600 border-ink-200',
  },
  live_supplier_data: {
    label: '실시간 확인',
    title: '판매처에서 실시간으로 받아온 확정 정보예요.',
    className: 'bg-brand-100 text-brand-800 border-brand-200',
  },
  user_confirmed: {
    label: '내가 확인함',
    title: '사용자가 직접 확인·승인한 항목이에요.',
    className: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  },
  booking_confirmation: {
    label: '예약 확정',
    title: '판매처가 발급한 예약 확정 정보예요.',
    className: 'bg-gold-100 text-gold-500 border-amber-200',
  },
};

export function SourceTag({ source }: { source: DataSourceType }) {
  const meta = SOURCE_META[source];
  return (
    <span
      title={meta.title}
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-xs font-semibold tracking-wide ${meta.className}`}
    >
      {meta.label}
    </span>
  );
}
