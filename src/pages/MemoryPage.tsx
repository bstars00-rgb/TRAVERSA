import { Trash2 } from 'lucide-react';
import { useUserMemoryStore } from '../stores/useUserMemoryStore';
import { Badge, Button, EmptyState, IconButton } from '../components/shared';

/** Persistent Travel Memory 관리 — 항목별 삭제/비활성화 가능 */
export function MemoryPage() {
  const { memoryEnabled, memories, setMemoryEnabled, toggleMemory, deleteMemory, resetDefaults } =
    useUserMemoryStore();

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">여행 기억 관리</h1>
            <p className="text-xs text-ink-500">
              사용자가 허용한 경우에만 AI가 취향을 기억합니다. 언제든 항목별로 끄거나 삭제할 수 있습니다.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={resetDefaults}>기본 데모 데이터 복원</Button>
        </div>

        <label className="flex items-center justify-between rounded-xl border border-ink-100 bg-white p-4">
          <span>
            <span className="block text-base font-semibold text-ink-800">여행 기억 사용</span>
            <span className="block text-xs text-ink-500">끄면 AI가 저장된 취향을 추천에 사용하지 않습니다.</span>
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={memoryEnabled}
            checked={memoryEnabled}
            onChange={(e) => setMemoryEnabled(e.target.checked)}
            className="h-5 w-9 accent-brand-700"
          />
        </label>

        {memories.length === 0 ? (
          <EmptyState title="저장된 여행 기억이 없습니다" description="여행을 계획하면 허용 범위 안에서 취향이 축적됩니다." />
        ) : (
          <ul className="space-y-2">
            {memories.map((m) => (
              <li
                key={m.id}
                className={`flex items-start gap-3 rounded-xl border border-ink-100 bg-white p-4 ${!memoryEnabled || !m.enabled ? 'opacity-50' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="text-xs font-semibold text-ink-800">{m.label}</h3>
                    <Badge tone={m.enabled ? 'success' : 'neutral'}>{m.enabled ? '활성' : '비활성'}</Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-ink-700">{m.value}</p>
                  <p className="mt-0.5 text-xs text-ink-400">출처: {m.learnedFrom}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <label className="flex items-center gap-1 text-xs text-ink-500">
                    <input
                      type="checkbox"
                      checked={m.enabled}
                      onChange={() => toggleMemory(m.id)}
                      disabled={!memoryEnabled}
                      className="accent-brand-700"
                      aria-label={`${m.label} 사용`}
                    />
                    사용
                  </label>
                  <IconButton label={`${m.label} 삭제`} onClick={() => deleteMemory(m.id)}>
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
