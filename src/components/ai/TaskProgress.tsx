import { Check, CircleDashed, Loader2, TriangleAlert, X } from 'lucide-react';
import type { AITask } from '../../types';

/** 검색 작업 진행 표시 — 단순 스피너가 아니라 작업별 성공/실패/지연 상태 */
export function TaskProgress({ tasks }: { tasks: AITask[] }) {
  if (tasks.length === 0) return null;
  return (
    <ul className="mt-2 space-y-1 rounded-lg border border-ink-100 bg-ink-50 p-2.5" aria-label="AI 작업 상태">
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-2 text-xs">
          <TaskIcon state={task.state} />
          <span
            className={
              task.state === 'failed'
                ? 'text-red-700'
                : task.state === 'pending'
                  ? 'text-ink-400'
                  : 'text-ink-700'
            }
          >
            {task.label}
          </span>
          {task.detail && <span className="truncate text-[11px] text-ink-400">— {task.detail}</span>}
        </li>
      ))}
    </ul>
  );
}

function TaskIcon({ state }: { state: AITask['state'] }) {
  switch (state) {
    case 'pending':
      return <CircleDashed size={13} className="shrink-0 text-ink-300" aria-label="대기" />;
    case 'running':
      return <Loader2 size={13} className="shrink-0 animate-spin text-brand-600" aria-label="진행 중" />;
    case 'success':
      return <Check size={13} className="shrink-0 text-emerald-600" aria-label="성공" />;
    case 'slow':
      return <TriangleAlert size={13} className="shrink-0 text-amber-600" aria-label="지연" />;
    case 'failed':
      return <X size={13} className="shrink-0 text-red-600" aria-label="실패" />;
  }
}
