import { CalendarRange, MessageSquareText, Wallet } from 'lucide-react';
import { ConversationPanel } from '../components/ai/ConversationPanel';
import { JourneyCanvas } from '../components/itinerary/JourneyCanvas';
import { TripIntelligencePanel } from '../components/itinerary/TripIntelligencePanel';
import { useItineraryStore } from '../stores/useItineraryStore';
import { useSearchStore } from '../stores/useSearchStore';
import { useUIStore, type MobileTab } from '../stores/useUIStore';

const MOBILE_TABS: { id: MobileTab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: '대화', icon: <MessageSquareText size={16} /> },
  { id: 'plan', label: '여행계획', icon: <CalendarRange size={16} /> },
  { id: 'booking', label: '예약·예산', icon: <Wallet size={16} /> },
];

/** 데스크톱 3단 구조 / 모바일 하단 탭 전환 */
export function WorkspacePage() {
  const mobileTab = useUIStore((s) => s.mobileTab);
  const setMobileTab = useUIStore((s) => s.setMobileTab);
  const hasItinerary = useItineraryStore((s) => s.itinerary !== null);
  const hasOutcome = useSearchStore((s) => s.outcome !== null);
  // 여행계획 탭에 새 콘텐츠가 있음을 알리는 점 표시
  const tabDot: Record<MobileTab, boolean> = {
    chat: false,
    plan: hasItinerary || hasOutcome,
    booking: hasItinerary,
  };

  return (
    <div className="flex h-full flex-col">
      <div className="grid min-h-0 flex-1 md:grid-cols-[340px_1fr_300px] xl:grid-cols-[380px_1fr_340px]">
        <div className={`min-h-0 border-r border-ink-100 bg-white ${mobileTab === 'chat' ? 'block' : 'hidden'} md:block`}>
          <ConversationPanel />
        </div>
        <div className={`min-h-0 ${mobileTab === 'plan' ? 'block' : 'hidden'} md:block`}>
          <JourneyCanvas />
        </div>
        <div className={`min-h-0 border-l border-ink-100 bg-white ${mobileTab === 'booking' ? 'block' : 'hidden'} md:block`}>
          <TripIntelligencePanel />
        </div>
      </div>

      {/* 모바일 하단 탭 */}
      <nav className="flex border-t border-ink-100 bg-white md:hidden" aria-label="모바일 화면 전환">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            aria-current={mobileTab === tab.id ? 'page' : undefined}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium cursor-pointer ${
              mobileTab === tab.id ? 'text-brand-700' : 'text-ink-400'
            }`}
          >
            {tabDot[tab.id] && mobileTab !== tab.id && (
              <span className="absolute right-[calc(50%-14px)] top-2 h-1.5 w-1.5 rounded-full bg-brand-500" aria-hidden />
            )}
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
