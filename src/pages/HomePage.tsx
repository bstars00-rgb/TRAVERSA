import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useConversationStore } from '../stores/useConversationStore';

const EXAMPLE_PROMPTS = [
  '아이와 4박 정도 편하게 갈 수 있는 곳',
  '비가 적고 음식이 좋은 9월 여행지',
  '출장 후 이틀 정도 혼자 쉬기 좋은 도시',
  '부모님과 많이 걷지 않는 일본 온천여행',
  '예산 200만 원으로 가능한 유럽 여행',
];

export function HomePage() {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const sendUserMessage = useConversationStore((s) => s.sendUserMessage);
  const hasMessages = useConversationStore((s) => s.messages.length > 0);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    navigate('/trip');
    // 네비게이션 후 비동기로 대화 시작
    void sendUserMessage(trimmed);
  };

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto p-4">
      <div className="w-full max-w-xl text-center">
        <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand-700">
          <Sparkles size={12} /> 대화형 여행 설계 프로토타입
        </span>
        <h1 className="text-2xl font-bold leading-snug text-ink-900 md:text-3xl">
          어디로 갈지 몰라도 괜찮습니다.
          <br />
          당신에게 맞는 여행부터 함께 설계할게요.
        </h1>

        <form
          className="mt-8"
          onSubmit={(e) => {
            e.preventDefault();
            submit(input);
          }}
        >
          <div className="flex items-center gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-sm focus-within:border-brand-500">
            <input
              autoFocus
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="예: 8월에 부모님과 일본 온천 5박 6일, 예산 300만 원"
              aria-label="여행 요청 입력"
              className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink-400"
            />
            <button
              type="submit"
              aria-label="여행 설계 시작"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white transition-colors hover:bg-brand-600 cursor-pointer"
            >
              <ArrowRight size={17} />
            </button>
          </div>
        </form>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {EXAMPLE_PROMPTS.map((p) => (
            <button
              key={p}
              onClick={() => submit(p)}
              className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-brand-300 hover:text-brand-700 cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>

        {hasMessages && (
          <button
            onClick={() => navigate('/trip')}
            className="mt-8 text-xs font-medium text-brand-700 underline-offset-2 hover:underline cursor-pointer"
          >
            이전 여행 이어서 계속하기 →
          </button>
        )}
      </div>
    </div>
  );
}
