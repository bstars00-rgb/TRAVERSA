import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchOutcome } from '../services/ai/searchOrchestrator';
import { persistStorage } from './storage';

export type FlightDirection = 'outbound' | 'return';

interface SearchState {
  outcome: SearchOutcome | null;
  isSearching: boolean;
  lastSearchAt: string | null;
  /** 고객이 1단계에서 선택한 왕복 항공편 — 일정 생성 시 사용 */
  selectedOutboundId: string | null;
  selectedReturnId: string | null;
  setSearching: (v: boolean) => void;
  setOutcome: (o: SearchOutcome) => void;
  setSelectedFlight: (direction: FlightDirection, offerId: string) => void;
  clear: () => void;
}

function cheapestOfferId(outcome: SearchOutcome, direction: FlightDirection): string | null {
  return (
    outcome.flightOffers
      .filter((f) => f.direction === direction)
      .sort((a, b) => a.totalPrice.amount - b.totalPrice.amount)[0]?.supplierOfferId ?? null
  );
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      outcome: null,
      isSearching: false,
      lastSearchAt: null,
      selectedOutboundId: null,
      selectedReturnId: null,
      setSearching: (isSearching) => set({ isSearching }),
      setOutcome: (outcome) =>
        set({
          outcome,
          isSearching: false,
          lastSearchAt: new Date().toISOString(),
          // 검색 직후 방향별 최저가 항공편을 기본 선택 — 사용자가 언제든 바꿀 수 있다
          selectedOutboundId: cheapestOfferId(outcome, 'outbound'),
          selectedReturnId: cheapestOfferId(outcome, 'return'),
        }),
      setSelectedFlight: (direction, offerId) =>
        set(direction === 'outbound' ? { selectedOutboundId: offerId } : { selectedReturnId: offerId }),
      clear: () =>
        set({
          outcome: null,
          isSearching: false,
          lastSearchAt: null,
          selectedOutboundId: null,
          selectedReturnId: null,
        }),
    }),
    {
      name: 'traversa-search',
      storage: persistStorage,
      partialize: (s) => ({
        outcome: s.outcome,
        lastSearchAt: s.lastSearchAt,
        selectedOutboundId: s.selectedOutboundId,
        selectedReturnId: s.selectedReturnId,
        isSearching: false,
      }),
    },
  ),
);
