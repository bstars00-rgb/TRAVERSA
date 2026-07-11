import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlayCircle, RotateCcw } from 'lucide-react';
import { Button, ConfirmDialog } from '../components/shared';
import { clearAllPersistedState } from '../stores/storage';
import { useConversationStore } from '../stores/useConversationStore';
import { useUIStore } from '../stores/useUIStore';

const DEMOS = [
  { key: 'onsen' as const, title: '일본 부모님 온천여행', detail: '시나리오 A — 하코네 5박 6일, 도보 최소화, 예산 300만 원' },
  { key: 'singapore' as const, title: '싱가포르 가족여행', detail: '시나리오 B — 6세 아이 동반 4박, 수영장·테마파크' },
  { key: 'bangkok' as const, title: '방콕 출장 연계 여행', detail: '시나리오 C — 호찌민 출장 후 2박 휴식, 스파·미식' },
];

export function SettingsPage() {
  const [confirmReset, setConfirmReset] = useState(false);
  const [runningDemo, setRunningDemo] = useState<string | null>(null);
  const loadDemoScenario = useConversationStore((s) => s.loadDemoScenario);
  const pushToast = useUIStore((s) => s.pushToast);
  const navigate = useNavigate();

  const runDemo = async (key: 'onsen' | 'singapore' | 'bangkok') => {
    setRunningDemo(key);
    navigate('/trip');
    try {
      await loadDemoScenario(key);
    } finally {
      setRunningDemo(null);
    }
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl space-y-4 p-4 md:p-6">
        <div>
          <h1 className="text-lg font-bold text-ink-900">설정</h1>
          <p className="text-xs text-ink-500">데모 시연과 데이터 초기화</p>
        </div>

        <section className="rounded-xl border border-ink-100 bg-white p-4">
          <h2 className="text-sm font-semibold text-ink-800">데모 시나리오</h2>
          <p className="mt-0.5 text-[11px] text-ink-500">
            버튼을 누르면 대화가 자동으로 재생되어 검색까지 진행됩니다. 재시연 시 먼저 초기화하세요.
          </p>
          <ul className="mt-3 space-y-2">
            {DEMOS.map((d) => (
              <li key={d.key} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-ink-50 p-3">
                <div>
                  <h3 className="text-xs font-semibold text-ink-800">{d.title}</h3>
                  <p className="text-[11px] text-ink-500">{d.detail}</p>
                </div>
                <Button size="sm" variant="secondary" disabled={runningDemo !== null} onClick={() => void runDemo(d.key)}>
                  <PlayCircle size={13} /> {runningDemo === d.key ? '재생 중…' : '데모 실행'}
                </Button>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-red-100 bg-white p-4">
          <h2 className="text-sm font-semibold text-red-800">Demo Reset</h2>
          <p className="mt-0.5 text-[11px] text-ink-500">
            대화, 여행조건, 검색 결과, 일정, 예약 준비, 여행 기억, 이벤트 로그를 모두 초기화합니다.
          </p>
          <Button variant="danger" size="sm" className="mt-3" onClick={() => setConfirmReset(true)}>
            <RotateCcw size={13} /> 모든 테스트 데이터 초기화
          </Button>
        </section>

        <section className="rounded-xl border border-ink-100 bg-white p-4 text-[11px] leading-relaxed text-ink-500">
          <h2 className="mb-1 text-sm font-semibold text-ink-800">프로토타입 안내</h2>
          <p>
            이 프로토타입은 Mock AI와 Mock MCP Gateway만 사용합니다. 실제 Anthropic API나 공급사 API를 호출하지
            않으며, API 키가 프런트엔드에 존재하지 않습니다. 결제는 준비 단계까지만 구현되어 있습니다.
          </p>
        </section>

        <ConfirmDialog
          open={confirmReset}
          title="모든 데이터 초기화"
          message="localStorage에 저장된 모든 데모 데이터가 삭제되고 페이지가 새로고침됩니다. 계속할까요?"
          confirmLabel="초기화"
          danger
          onConfirm={() => {
            clearAllPersistedState();
            pushToast('success', '초기화되었습니다');
            window.location.reload();
          }}
          onCancel={() => setConfirmReset(false)}
        />
      </div>
    </div>
  );
}
