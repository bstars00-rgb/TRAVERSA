import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentActivity, AgentRole, AIMessage, AITask } from '../types';
import { mockAI, summarizeUnderstanding } from '../services/ai/mockAIProvider';
import { runTravelSearch } from '../services/ai/searchOrchestrator';
import { interpretItineraryCommand } from '../services/itinerary/commands';
import { generateItinerary } from '../services/itinerary/generator';
import type { HotelRecommendation } from '../services/ai/scoring';
import { uid } from '../utils/id';
import { useTripStore } from './useTripStore';
import { useSearchStore } from './useSearchStore';
import { useItineraryStore } from './useItineraryStore';
import { useUIStore } from './useUIStore';
import { persistStorage } from './storage';
import { DEMO_SCRIPTS, type DemoScenarioKey } from '../mocks/demoScripts';

const AGENT_ROLES: { role: AgentRole; label: string }[] = [
  { role: 'trip_planner', label: 'Trip Planner' },
  { role: 'hotel_specialist', label: 'Hotel Specialist' },
  { role: 'flight_specialist', label: 'Flight Specialist' },
  { role: 'local_experience', label: 'Local Experience' },
  { role: 'budget_controller', label: 'Budget Controller' },
  { role: 'risk_monitor', label: 'Risk Monitor' },
  { role: 'accessibility_planner', label: 'Accessibility Planner' },
  { role: 'booking_controller', label: 'Booking Controller' },
];

function idleAgents(): AgentActivity[] {
  return AGENT_ROLES.map((a) => ({
    id: uid('agent'),
    role: a.role,
    label: a.label,
    state: 'pending',
    message: '대기 중',
    updatedAt: new Date().toISOString(),
  }));
}

interface ConversationState {
  messages: AIMessage[];
  agentActivities: AgentActivity[];
  busy: boolean;
  sendUserMessage: (input: string) => Promise<void>;
  runSearch: () => Promise<void>;
  selectRecommendation: (rec: HotelRecommendation) => void;
  startNewTrip: () => void;
  loadDemoScenario: (scenario: DemoScenarioKey) => Promise<void>;
}

function assistantMessage(content: string, extras?: Partial<AIMessage>): AIMessage {
  return {
    id: uid('msg'),
    role: 'assistant',
    content,
    createdAt: new Date().toISOString(),
    sourceType: 'ai_recommendation',
    ...extras,
  };
}

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      messages: [],
      agentActivities: idleAgents(),
      busy: false,

      sendUserMessage: async (input) => {
        if (get().busy || input.trim().length === 0) return;
        const trip = useTripStore.getState();
        if (!trip.tripId) {
          trip.createTrip(input.slice(0, 40));
        }

        const userMsg: AIMessage = {
          id: uid('msg'),
          role: 'user',
          content: input,
          createdAt: new Date().toISOString(),
          sourceType: 'user_confirmed',
        };
        set((s) => ({ messages: [...s.messages, userMsg], busy: true }));

        try {
          // 1) 일정이 이미 있으면 자연어 수정 명령 먼저 시도
          const itinerary = useItineraryStore.getState().itinerary;
          if (itinerary) {
            const diff = interpretItineraryCommand(input, itinerary);
            if (diff) {
              useItineraryStore.getState().proposeDiff(diff);
              set((s) => ({
                messages: [
                  ...s.messages,
                  assistantMessage(
                    `${diff.summary}\n\n변경 전후 비교를 Journey Canvas에서 확인하고 "변경 적용"을 눌러야 실제 일정에 반영됩니다.`,
                  ),
                ],
              }));
              return;
            }
          }

          // 2) 의도 파싱 및 갱신
          const currentIntent = useTripStore.getState().intent;
          const intent = mockAI.parseIntent(input, currentIntent);
          useTripStore.getState().setIntent(intent);

          // 3) 검색 조건이 충분한가
          if (mockAI.readyToSearch(intent)) {
            const hasOutcome = useSearchStore.getState().outcome !== null;
            const wantsSearch = /검색|찾아|시작|추천|보여줘|네|좋아/.test(input);
            if (!hasOutcome && wantsSearch) {
              await get().runSearch();
              return;
            }
            if (!hasOutcome) {
              set((s) => ({
                messages: [
                  ...s.messages,
                  assistantMessage(
                    `${summarizeUnderstanding(intent)}\n\n조건이 충분히 모였어요. 호텔 공급사 3곳과 항공, 액티비티를 검색할까요?`,
                    { quickReplies: ['좋아, 검색 시작해줘', '조건을 먼저 수정할래'], intentSnapshot: intent },
                  ),
                ],
              }));
              return;
            }
            set((s) => ({
              messages: [
                ...s.messages,
                assistantMessage(
                  '조건을 반영했어요. 중앙 패널에서 추천 후보를 비교하고 호텔을 선택하면 일정을 만들어 드릴게요.',
                  { intentSnapshot: intent },
                ),
              ],
            }));
            return;
          }

          // 4) 부족한 정보 질문 (우선순위 상위 최대 2개)
          const question = mockAI.nextQuestion(intent);
          set((s) => ({
            messages: [
              ...s.messages,
              assistantMessage(question?.content ?? '조금 더 자세히 알려주시겠어요?', {
                quickReplies: question?.quickReplies,
                intentSnapshot: intent,
              }),
            ],
          }));
        } catch (err) {
          useTripStore.getState().logEvent('ERROR_OCCURRED', `대화 처리 오류: ${String(err)}`);
          set((s) => ({
            messages: [...s.messages, assistantMessage('처리 중 문제가 발생했어요. 다시 시도해주세요.')],
          }));
        } finally {
          set({ busy: false });
        }
      },

      runSearch: async () => {
        const trip = useTripStore.getState();
        const intent = trip.intent;
        useSearchStore.getState().setSearching(true);
        trip.logEvent('SEARCH_STARTED', `검색 시작 — 목적지 ${intent.possibleDestinations[0] ?? '?'}`);

        // 멀티에이전트 협업 상태 (Mock)
        set({
          agentActivities: get().agentActivities.map((a) => ({
            ...a,
            state: a.role === 'booking_controller' ? 'pending' : 'running',
            message: agentWorkingMessage(a.role),
            updatedAt: new Date().toISOString(),
          })),
        });

        const searchMsgId = uid('msg');
        const baseMsg = assistantMessage('여행 조건에 맞는 상품을 찾고 있어요. 각 작업의 진행 상태를 아래에서 확인하세요.', { tasks: [] });
        set((s) => ({ messages: [...s.messages, { ...baseMsg, id: searchMsgId }] }));

        const onTasks = (tasks: AITask[]) => {
          set((s) => ({
            messages: s.messages.map((m) => (m.id === searchMsgId ? { ...m, tasks } : m)),
          }));
        };

        try {
          const outcome = await runTravelSearch(intent, trip.tripId ?? 'session', onTasks);
          useSearchStore.getState().setOutcome(outcome);
          trip.logEvent(
            'SUPPLIER_RESPONDED',
            `호텔 오퍼 ${outcome.hotelOffers.length}건 · 실패 공급사 ${outcome.failedSuppliers.length}곳`,
          );

          set({
            agentActivities: get().agentActivities.map((a) => ({
              ...a,
              state: a.role === 'booking_controller' ? 'pending' : 'success',
              message: agentDoneMessage(a.role, outcome.hotelOffers.length),
              updatedAt: new Date().toISOString(),
            })),
          });

          const summary = outcome.allHotelSuppliersFailed
            ? '죄송해요. 모든 호텔 공급사 응답에 실패했습니다. 잠시 후 다시 검색하거나 조건을 바꿔보세요.'
            : `검색이 끝났어요. 먼저 항공편 ${outcome.flightOffers.length}개 중 하나를 고르시고(최저가가 기본 선택되어 있어요), 이어서 숙소 추천 ${outcome.recommendations.length}개(Best Match / Best Value / Premium)를 비교해 선택하시면 일정이 완성됩니다.${
                outcome.failedSuppliers.length > 0
                  ? `\n\n참고: ${outcome.failedSuppliers.join(', ')} 공급사는 응답하지 않아 결과에서 제외되었습니다.`
                  : ''
              }`;
          set((s) => ({ messages: [...s.messages, assistantMessage(summary)] }));
          if (window.innerWidth < 768) useUIStore.getState().setMobileTab('plan');
        } catch (err) {
          trip.logEvent('ERROR_OCCURRED', `검색 오류: ${String(err)}`);
          set((s) => ({
            messages: [...s.messages, assistantMessage('검색 중 오류가 발생했습니다. 다시 시도해주세요.')],
          }));
        } finally {
          useSearchStore.getState().setSearching(false);
        }
      },

      selectRecommendation: (rec) => {
        const trip = useTripStore.getState();
        const outcome = useSearchStore.getState().outcome;
        const intent = trip.intent;
        trip.logEvent(
          'OFFER_SELECTED',
          `호텔 선택: ${rec.scored.offer.hotel.name} (${rec.scored.offer.supplierName})`,
        );

        const hasChild = intent.travelerTypes.includes('child');
        const activities = (outcome?.activityOffers ?? [])
          .filter((a) => !hasChild || a.minAge === undefined || a.minAge <= 6)
          .slice(0, Math.max(1, (intent.duration ?? 3) - 1));

        // 1단계에서 고객이 선택한 항공편을 일정에 반영
        const selectedFlightId = useSearchStore.getState().selectedFlightId;
        const flight =
          outcome?.flightOffers.find((f) => f.supplierOfferId === selectedFlightId) ??
          outcome?.flightOffers[0];

        const itinerary = generateItinerary(trip.tripId ?? uid('trip'), intent, {
          hotel: rec.scored.offer,
          flight,
          transport: outcome?.transportOffers[0],
          activities,
        });
        useItineraryStore.getState().setItinerary(itinerary);

        set((s) => ({
          messages: [
            ...s.messages,
            assistantMessage(
              `${rec.scored.offer.hotel.name}을(를) 중심으로 ${intent.duration ?? itinerary.days.length - 1}박 일정을 구성했어요. Journey Canvas에서 날짜별 일정을 확인하고, 자연어로 수정을 요청할 수 있어요.\n\n예: "둘째 날 일정을 여유롭게 바꿔줘", "전체 비용을 20만 원 낮춰줘"`,
            ),
          ],
        }));
        useUIStore.getState().pushToast('success', '일정이 생성되었습니다');
      },

      startNewTrip: () => {
        useTripStore.getState().resetTrip();
        useSearchStore.getState().clear();
        useItineraryStore.getState().clear();
        set({ messages: [], agentActivities: idleAgents(), busy: false });
      },

      loadDemoScenario: async (scenario) => {
        get().startNewTrip();
        for (const line of DEMO_SCRIPTS[scenario]) {
          await get().sendUserMessage(line);
        }
      },
    }),
    {
      name: 'traversa-conversation',
      storage: persistStorage,
      partialize: (s) => ({ messages: s.messages, agentActivities: s.agentActivities, busy: false }),
    },
  ),
);

function agentWorkingMessage(role: AgentRole): string {
  switch (role) {
    case 'trip_planner': return '전체 검색계획 수립 중';
    case 'hotel_specialist': return '호텔 공급사 3곳 비교 중';
    case 'flight_specialist': return '항공 운임 확인 중';
    case 'local_experience': return '현지 액티비티 큐레이션 중';
    case 'budget_controller': return '예산 배분 검토 중';
    case 'risk_monitor': return '가격 만료·매핑 리스크 감시 중';
    case 'accessibility_planner': return '이동 부담 평가 중';
    case 'booking_controller': return '예약 실행 대기 (사용자 승인 필요)';
  }
}

function agentDoneMessage(role: AgentRole, offerCount: number): string {
  switch (role) {
    case 'trip_planner': return '추천 전략 3종 도출 완료';
    case 'hotel_specialist': return `${offerCount}개 객실 오퍼 정규화 완료`;
    case 'flight_specialist': return '운임 규정 요약 완료';
    case 'local_experience': return '액티비티 후보 선별 완료';
    case 'budget_controller': return '예산 범위 검증 완료';
    case 'risk_monitor': return '위험 항목 순위 하향 처리';
    case 'accessibility_planner': return '도보 최소화 조건 반영';
    case 'booking_controller': return '예약 실행 대기 (사용자 승인 필요)';
  }
}
