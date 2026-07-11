import { useEffect, useRef, type ReactNode } from 'react';
import { X, AlertTriangle, CheckCircle2, Info, AlertCircle, Inbox } from 'lucide-react';
import { Button, IconButton } from './primitives';
import { useUIStore, type ToastItem } from '../../stores/useUIStore';

// ---------- LoadingSkeleton ----------

export function LoadingSkeleton({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="불러오는 중">
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton-shimmer h-4 rounded" style={{ width: `${100 - i * 15}%` }} />
      ))}
    </div>
  );
}

// ---------- EmptyState ----------

export function EmptyState({
  title,
  description,
  action,
  icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-ink-200 bg-white/60 px-6 py-10 text-center">
      <span className="text-ink-300">{icon ?? <Inbox size={32} />}</span>
      <p className="text-sm font-semibold text-ink-700">{title}</p>
      {description && <p className="max-w-sm text-xs text-ink-500">{description}</p>}
      {action}
    </div>
  );
}

// ---------- Modal ----------

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    ref.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink-900/50" onClick={onClose} aria-hidden />
      <div ref={ref} tabIndex={-1} className="relative z-10 w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 className="text-base font-semibold text-ink-800">{title}</h2>
          <IconButton label="닫기" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="max-h-[60vh] overflow-y-auto text-sm text-ink-600">{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

// ---------- Drawer ----------

export function Drawer({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-ink-900/40" onClick={onClose} aria-hidden />
      <div className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
          <h2 className="text-sm font-semibold text-ink-800">{title}</h2>
          <IconButton label="닫기" onClick={onClose}>
            <X size={16} />
          </IconButton>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

// ---------- ConfirmDialog ----------

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '확인',
  cancelLabel = '취소',
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message}
    </Modal>
  );
}

// ---------- Toast ----------

const TOAST_ICON: Record<ToastItem['kind'], ReactNode> = {
  info: <Info size={15} className="text-brand-600" />,
  success: <CheckCircle2 size={15} className="text-emerald-600" />,
  warning: <AlertTriangle size={15} className="text-amber-600" />,
  error: <AlertCircle size={15} className="text-red-600" />,
};

export function ToastHost() {
  const toasts = useUIStore((s) => s.toasts);
  const dismiss = useUIStore((s) => s.dismissToast);
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-20 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 md:bottom-6" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto flex items-center gap-2 rounded-lg border border-ink-100 bg-white px-3 py-2.5 shadow-lg">
          {TOAST_ICON[t.kind]}
          <p className="flex-1 text-xs text-ink-700">{t.message}</p>
          <IconButton label="알림 닫기" className="h-6 w-6" onClick={() => dismiss(t.id)}>
            <X size={12} />
          </IconButton>
        </div>
      ))}
    </div>
  );
}
