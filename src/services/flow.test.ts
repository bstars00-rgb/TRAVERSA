import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';
import { travelGateway } from './mcp/gateway';
import { useConversationStore } from '../stores/useConversationStore';
import { useTripStore } from '../stores/useTripStore';
import { useSearchStore } from '../stores/useSearchStore';
import { useItineraryStore } from '../stores/useItineraryStore';
import { useBookingStore } from '../stores/useBookingStore';
import { clearAllPersistedState, persistStorage } from '../stores/storage';
import type { MCPToolResult, HotelOffer } from '../types';

/**
 * 주요 사용자 흐름 통합 테스트 (서비스+스토어 레벨)
 * 첫 질문 → 조건 확인 → 검색 → 비교 → 선택 → 일정 → 자연어 변경 →
 * 가격 재확인 → 여행자 정보 → 예약 준비 완료
 */

beforeEach(() => {
  clearAllPersistedState();
  travelGateway.setConfig({ mode: 'fixed', seed: 11, latencyScale: 0 });
  useConversationStore.getState().startNewTrip();
  useBookingStore.getState().clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('주요 사용자 흐름', () => {
  it('첫 질문부터 예약 준비 완료까지 전체 흐름이 동작한다', async () => {
    const conv = useConversationStore.getState();

    // 1~2. 첫 질문 입력 → 여행조건 확인
    await conv.sendUserMessage(
      '8월에 부모님과 일본에 5박 6일로 가고 싶어. 많이 걷지 않고 온천과 좋은 음식을 즐기고 싶어. 전체 예산은 항공 제외 300만 원 정도야.',
    );
    let intent = useTripStore.getState().intent;
    expect(intent.duration).toBe(5);
    expect(intent.budget).toBe(3_000_000);
    expect(useConversationStore.getState().messages.length).toBeGreaterThanOrEqual(2);

    await conv.sendUserMessage('서울 인천에서 출발해');
    intent = useTripStore.getState().intent;
    expect(intent.origin).toBe('ICN 인천');

    // 3. 검색 실행
    await conv.sendUserMessage('좋아, 검색 시작해줘');
    const outcome = useSearchStore.getState().outcome;
    expect(outcome).not.toBeNull();

    // 4. 호텔 비교 — 전략별 추천 (공급사 실패가 있어도 흐름은 유지)
    if (outcome!.allHotelSuppliersFailed) {
      expect(outcome!.recommendations).toHaveLength(0);
      return; // 오류 시나리오는 별도 테스트에서 다룬다
    }
    expect(outcome!.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(outcome!.hotelOffers.length).toBeGreaterThan(0);

    // 5~6. 호텔 선택 → 일정 생성
    conv.selectRecommendation(outcome!.recommendations[0]);
    const itinerary = useItineraryStore.getState().itinerary;
    expect(itinerary).not.toBeNull();
    expect(itinerary!.days).toHaveLength(6); // 5박 6일

    // 7. 자연어 일정 변경 → Diff 승인
    await conv.sendUserMessage('둘째 날 일정을 여유롭게 바꿔줘');
    expect(useItineraryStore.getState().pendingDiff).not.toBeNull();
    useItineraryStore.getState().applyPendingDiff();
    expect(useItineraryStore.getState().itinerary!.version).toBe(2);
    expect(useItineraryStore.getState().pendingDiff).toBeNull();

    // 8. 예약 준비 시작 → 가격 재확인
    useBookingStore.getState().startPreparation(useItineraryStore.getState().itinerary!, useTripStore.getState().intent);
    let prep = useBookingStore.getState().preparation!;
    expect(prep.items.length).toBeGreaterThan(0);
    await useBookingStore.getState().recheckAll();
    prep = useBookingStore.getState().preparation!;
    expect(prep.recheckResults.length).toBe(prep.items.length);

    // 가격 변경/품절 상품은 사용자가 직접 결정
    for (const item of prep.items) {
      if (item.status === 'failed') useBookingStore.getState().resolveRecheck(item.id, 'exclude');
      else if (item.status === 'needs_attention') useBookingStore.getState().resolveRecheck(item.id, 'accept');
    }

    // 9. 여행자 정보 입력 (사용자 직접 확정)
    prep = useBookingStore.getState().preparation!;
    for (const t of prep.travelers) {
      useBookingStore.getState().updateTraveler({
        ...t,
        englishGivenName: 'GILDONG',
        englishFamilyName: 'HONG',
        confirmedByUser: true,
      });
    }

    // 10. 확인 체크리스트 완료 → 예약 준비 완료
    for (const c of useBookingStore.getState().preparation!.confirmations) {
      useBookingStore.getState().toggleConfirmation(c.kind, '테스트 스냅샷');
    }
    const readiness = useBookingStore.getState().readiness();
    expect(readiness.confirmed).toBe(readiness.total);
    if (useBookingStore.getState().preparation!.items.length > 0) {
      expect(readiness.ready).toBe(true);
    }

    // 이벤트 로그 검증 (민감정보 마스킹 포함)
    const events = useTripStore.getState().events;
    expect(events.some((e) => e.type === 'TRIP_CREATED')).toBe(true);
    expect(events.some((e) => e.type === 'SEARCH_STARTED')).toBe(true);
    expect(events.some((e) => e.type === 'BOOKING_PREPARED')).toBe(true);
    expect(events.some((e) => e.type === 'USER_CONFIRMED')).toBe(true);
    expect(events.every((e) => !e.summary.includes('GILDONG'))).toBe(true);
  }, 20000);
});

describe('오류 시나리오', () => {
  const failedResult = (supplierId: string): MCPToolResult<HotelOffer[]> => ({
    callId: 'c1',
    toolName: 'search_hotels',
    supplierId,
    ok: false,
    status: 'error',
    latencyMs: 100,
    completedAt: new Date().toISOString(),
    errorMessage: 'mock failure',
  });

  it('모든 호텔 공급사 실패 시 실패 요약을 반환하고 크래시하지 않는다', async () => {
    vi.spyOn(travelGateway, 'searchHotels').mockResolvedValue([
      failedResult('globalbeds'),
      failedResult('sakuradirect'),
      failedResult('asiaroomshub'),
    ]);
    const conv = useConversationStore.getState();
    await conv.sendUserMessage('8월에 부모님과 일본 온천 5박, 예산 300만 원, 인천 출발. 검색 시작해줘');
    const outcome = useSearchStore.getState().outcome;
    expect(outcome!.allHotelSuppliersFailed).toBe(true);
    expect(outcome!.recommendations).toHaveLength(0);
    const lastMsg = useConversationStore.getState().messages.at(-1)!;
    expect(lastMsg.content).toContain('실패');
  }, 20000);

  it('항공 검색이 실패해도 호텔 추천은 유지된다', async () => {
    vi.spyOn(travelGateway, 'searchFlights').mockResolvedValue({
      callId: 'c2',
      toolName: 'search_flights',
      supplierId: 'airconnect',
      ok: false,
      status: 'timeout',
      latencyMs: 3000,
      completedAt: new Date().toISOString(),
      errorMessage: '응답 시간 초과',
    });
    const conv = useConversationStore.getState();
    await conv.sendUserMessage('8월에 부모님과 일본 온천 5박, 예산 300만 원, 인천 출발. 검색 시작해줘');
    const outcome = useSearchStore.getState().outcome!;
    expect(outcome.flightOffers).toHaveLength(0);
    expect(outcome.allHotelSuppliersFailed).toBe(false);
  }, 20000);
});

describe('localStorage 손상 복구', () => {
  it('손상된 JSON을 만나면 키를 제거하고 null을 반환한다', () => {
    localStorage.setItem('traversa-trip', '{"corrupted": ');
    const value = persistStorage!.getItem('traversa-trip');
    expect(value).toBeNull();
    expect(localStorage.getItem('traversa-trip')).toBeNull();
  });

  it('clearAllPersistedState는 모든 키를 제거한다', () => {
    localStorage.setItem('traversa-trip', '{}');
    localStorage.setItem('traversa-booking', '{}');
    clearAllPersistedState();
    expect(localStorage.getItem('traversa-trip')).toBeNull();
    expect(localStorage.getItem('traversa-booking')).toBeNull();
  });
});
