import { Check } from 'lucide-react';

// ---------- SegmentedControl ----------

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  ariaLabel: string;
}) {
  return (
    <div role="tablist" aria-label={ariaLabel} className="inline-flex rounded-lg border border-ink-200 bg-ink-100 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          onClick={() => onChange(opt.value)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
            value === opt.value ? 'bg-white text-ink-800 shadow-sm' : 'text-ink-500 hover:text-ink-700'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

// ---------- ProgressSteps ----------

export interface ProgressStep {
  id: string;
  label: string;
  state: 'done' | 'current' | 'upcoming' | 'disabled';
}

export function ProgressSteps({ steps, onStepClick }: { steps: ProgressStep[]; onStepClick?: (id: string) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5" aria-label="진행 단계">
      {steps.map((step, i) => (
        <li key={step.id} className="flex items-center gap-1.5">
          <button
            disabled={step.state === 'disabled' || !onStepClick}
            onClick={() => onStepClick?.(step.id)}
            aria-current={step.state === 'current' ? 'step' : undefined}
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              step.state === 'done'
                ? 'bg-emerald-100 text-emerald-800'
                : step.state === 'current'
                  ? 'bg-brand-700 text-white'
                  : step.state === 'disabled'
                    ? 'bg-ink-100 text-ink-300'
                    : 'bg-ink-100 text-ink-500'
            } ${onStepClick && step.state !== 'disabled' ? 'cursor-pointer' : 'cursor-default'}`}
          >
            {step.state === 'done' ? <Check size={11} /> : <span className="tabular-nums">{i + 1}</span>}
            {step.label}
          </button>
          {i < steps.length - 1 && <span className="h-px w-3 bg-ink-200" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
