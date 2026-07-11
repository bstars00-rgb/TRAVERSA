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
  sm: 'text-xs px-2.5 py-1.5 rounded-md',
  md: 'text-sm px-4 py-2 rounded-lg',
  lg: 'text-base px-5 py-3 rounded-lg',
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
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-500 hover:bg-ink-100 hover:text-ink-700 transition-colors cursor-pointer disabled:cursor-not-allowed disabled:text-ink-300 ${className}`}
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
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${BADGE_TONE[tone]} ${className}`}>
      {children}
    </span>
  );
}

// ---------- StatusBadge (예약 상태) ----------

const BOOKING_STATUS_META: Record<BookingStatus, { label: string; tone: BadgeTone }> = {
  idea: { label: 'Idea', tone: 'neutral' },
  searching: { label: 'Searching', tone: 'brand' },
  compared: { label: 'Compared', tone: 'brand' },
  selected: { label: 'Selected', tone: 'brand' },
  rechecking: { label: 'Rechecking', tone: 'warning' },
  ready_to_book: { label: 'Ready to book', tone: 'success' },
  on_hold: { label: 'On hold', tone: 'gold' },
  confirmed: { label: 'Confirmed', tone: 'success' },
  failed: { label: 'Failed', tone: 'danger' },
  needs_attention: { label: 'Needs attention', tone: 'danger' },
};

export function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = BOOKING_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

// ---------- PriceDisplay (가격 + 가격 상태) ----------

export const PRICE_STATUS_META: Record<PriceStatus, { label: string; tone: BadgeTone; description: string }> = {
  estimated: { label: 'Estimated', tone: 'neutral', description: 'AI가 예상한 금액' },
  retrieved: { label: 'Retrieved', tone: 'brand', description: '공급사에서 검색된 금액' },
  rechecked: { label: 'Rechecked', tone: 'success', description: '최신 가격으로 재확인한 금액' },
  locked: { label: 'Locked', tone: 'gold', description: '일정 시간 보장된 금액' },
  changed: { label: 'Changed', tone: 'danger', description: '가격이 변경된 상태' },
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
      {capturedAt && <span className="text-[11px] text-ink-400">{formatTimeAgo(capturedAt)} 확인</span>}
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
    <span className="inline-flex items-center gap-1.5 rounded-md border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-medium text-ink-600">
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
      <span className="text-[11px] tabular-nums text-ink-500">{pct}%</span>
    </span>
  );
}

// ---------- SourceTag (정보 출처 구분 — 핵심 UX 원칙) ----------

const SOURCE_META: Record<DataSourceType, { label: string; className: string }> = {
  ai_recommendation: { label: 'AI Recommendation', className: 'bg-ink-100 text-ink-600 border-ink-200' },
  live_supplier_data: { label: 'Live Supplier Data', className: 'bg-brand-100 text-brand-800 border-brand-200' },
  user_confirmed: { label: 'User-confirmed', className: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  booking_confirmation: { label: 'Booking Confirmation', className: 'bg-gold-100 text-gold-500 border-amber-200' },
};

export function SourceTag({ source }: { source: DataSourceType }) {
  const meta = SOURCE_META[source];
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.className}`}>
      {meta.label}
    </span>
  );
}
