import { useState } from 'react';
import { Bot, ChevronDown, ChevronUp } from 'lucide-react';
import { useConversationStore } from '../../stores/useConversationStore';
import type { AITask } from '../../types';

const STATE_DOT: Record<AITask['state'], string> = {
  pending: 'bg-ink-300',
  running: 'bg-brand-500 animate-pulse',
  success: 'bg-emerald-500',
  slow: 'bg-amber-500',
  failed: 'bg-red-500',
};

/** 멀티에이전트 협업 상태 (Mock) — 대화 패널 하단 접이식 스트립 */
export function AgentActivityStrip() {
  const agents = useConversationStore((s) => s.agentActivities);
  const [open, setOpen] = useState(false);
  const activeCount = agents.filter((a) => a.state === 'running').length;

  return (
    <div className="border-t border-ink-100 bg-ink-50">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-2 text-[11px] font-medium text-ink-500 hover:text-ink-700 cursor-pointer"
      >
        <Bot size={13} />
        전문 에이전트 8명
        {activeCount > 0 && <span className="rounded-full bg-brand-100 px-1.5 text-brand-700">{activeCount} 작업 중</span>}
        <span className="ml-auto">{open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}</span>
      </button>
      {open && (
        <ul className="grid grid-cols-2 gap-1 px-3 pb-3">
          {agents.map((a) => (
            <li key={a.id} className="flex items-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-[10px]">
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATE_DOT[a.state]}`} aria-hidden />
              <span className="min-w-0">
                <span className="block font-semibold text-ink-700">{a.label}</span>
                <span className="block truncate text-ink-400">{a.message}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
