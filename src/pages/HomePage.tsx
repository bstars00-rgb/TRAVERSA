import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BadgeCheck, MessageCircleHeart, ShieldCheck, Sparkles, Wallet } from 'lucide-react';
import { useConversationStore } from '../stores/useConversationStore';
import { DESTINATIONS } from '../data/destinations';

const EXAMPLE_PROMPTS = [
  '아이와 4박 정도 편하게 갈 수 있는 곳',
  '비가 적고 음식이 좋은 9월 여행지',
  '출장 후 이틀 정도 혼자 쉬기 좋은 도시',
  '부모님과 많이 걷지 않는 일본 온천여행',
  '예산 200만 원으로 가능한 유럽 여행',
];

const HOW_IT_WORKS = [
  { icon: MessageCircleHeart, title: '편하게 말해요', detail: '"부모님과 온천 가고 싶어" — 검색창도, 필터도 필요 없어요.' },
  { icon: Sparkles, title: 'AI가 찾고 비교해요', detail: '여러 판매처의 실시간 가격과 취소조건을 한 번에 비교해요.' },
  { icon: BadgeCheck, title: '결정은 항상 내가', detail: '예약과 결제는 내가 직접 확인한 뒤에만 진행돼요.' },
];

const TRUST_POINTS = [
  { icon: Wallet, text: '세금·수수료 포함 총액 표시' },
  { icon: ShieldCheck, text: '무료취소 상품 우선 추천' },
  { icon: BadgeCheck, text: 'AI가 몰래 결제하는 일 없음' },
];

const DESTINATION_EMOJI: Record<string, string> = {
  hakone: '♨️',
  yufuin: '🌿',
  kinosaki: '🏮',
  singapore: '🎡',
  bangkok: '🛶',
};

export function HomePage() {
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const sendUserMessage = useConversationStore((s) => s.sendUserMessage);
  const hasMessages = useConversationStore((s) => s.messages.length > 0);

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    navigate('/trip');
    void sendUserMessage(trimmed);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-4 pb-16 pt-10 md:pt-16">
        {/* 히어로 */}
        <div className="text-center">
          <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand-700">
            <Sparkles size={12} /> 나만의 AI 여행 컨설턴트
          </span>
          <h1 className="text-2xl font-bold leading-snug text-ink-900 md:text-4xl">
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
            <div className="mx-auto flex max-w-xl items-center gap-2 rounded-2xl border border-ink-200 bg-white p-2 shadow-sm focus-within:border-brand-500 focus-within:shadow-md">
              <input
                autoFocus
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="예: 8월에 부모님과 일본 온천 5박 6일, 예산 300만 원"
                aria-label="여행 요청 입력"
                className="flex-1 bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-ink-400"
              />
              <button
                type="submit"
                aria-label="여행 설계 시작"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white transition-colors hover:bg-brand-600 cursor-pointer"
              >
                <ArrowRight size={18} />
              </button>
            </div>
          </form>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => submit(p)}
                className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 cursor-pointer"
              >
                {p}
              </button>
            ))}
          </div>

          {hasMessages && (
            <button
              onClick={() => navigate('/trip')}
              className="mt-6 inline-flex items-center gap-1 rounded-full bg-brand-700 px-4 py-2 text-xs font-semibold text-white hover:bg-brand-600 cursor-pointer"
            >
              계획 중인 여행 이어서 하기 <ArrowRight size={13} />
            </button>
          )}
        </div>

        {/* 신뢰 포인트 */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {TRUST_POINTS.map(({ icon: Icon, text }) => (
            <span key={text} className="flex items-center gap-1.5 text-[11px] font-medium text-ink-500">
              <Icon size={13} className="text-brand-600" /> {text}
            </span>
          ))}
        </div>

        {/* 이렇게 진행돼요 */}
        <section className="mt-12" aria-label="이용 방법">
          <h2 className="text-center text-sm font-bold text-ink-800">이렇게 진행돼요</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {HOW_IT_WORKS.map(({ icon: Icon, title, detail }, i) => (
              <div key={title} className="rounded-2xl border border-ink-100 bg-white p-4">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                    <Icon size={15} />
                  </span>
                  <span className="text-[10px] font-bold text-ink-300">STEP {i + 1}</span>
                </div>
                <h3 className="mt-2 text-sm font-semibold text-ink-800">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink-500">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 여행 영감 */}
        <section className="mt-12" aria-label="추천 여행지">
          <h2 className="text-center text-sm font-bold text-ink-800">지금 인기 있는 여행지</h2>
          <p className="mt-1 text-center text-xs text-ink-500">눌러서 바로 이 여행지로 대화를 시작해보세요</p>
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
            {DESTINATIONS.map((d) => (
              <button
                key={d.id}
                onClick={() => submit(`${d.name}(으)로 여행 가고 싶어`)}
                className="group overflow-hidden rounded-2xl border border-ink-100 bg-white text-left transition-shadow hover:shadow-md cursor-pointer"
              >
                <div className="tone-destination flex h-20 items-center justify-center text-3xl">
                  <span className="transition-transform group-hover:scale-110">{DESTINATION_EMOJI[d.id] ?? '✈️'}</span>
                </div>
                <div className="p-2.5">
                  <p className="text-xs font-bold text-ink-800">{d.name}</p>
                  <p className="text-[10px] text-ink-400">{d.country} · 비행 {d.flightHoursFromICN}시간</p>
                  <p className="mt-1 line-clamp-2 text-[10px] leading-relaxed text-ink-500">{d.summary}</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
