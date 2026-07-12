import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchOutcome } from '../services/ai/searchOrchestrator';
import { persistStorage } from './storage';

interface SearchState {
  outcome: SearchOutcome | null;
  isSearching: boolean;
  lastSearchAt: string | null;
  /** 고객이 1단계에서 선택한 항공편 — 일정 생성 시 사용 */
  selectedFlightId: string | null;
  setSearching: (v: boolean) => void;
  setOutcome: (o: SearchOutcome) => void;
  setSelectedFlight: (offerId: string) => void;
  clear: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      outcome: null,
      isSearching: false,
      lastSearchAt: null,
      selectedFlightId: null,
      setSearching: (isSearching) => set({ isSearching }),
      setOutcome: (outcome) =>
        set({
          outcome,
          isSearching: false,
          lastSearchAt: new Date().toISOString(),
          // 검색 직후 최저가 항공편을 기본 선택 — 사용자가 언제든 바꿀 수 있다
          selectedFlightId:
            [...outcome.flightOffers].sort((a, b) => a.totalPrice.amount - b.totalPrice.amount)[0]
              ?.supplierOfferId ?? null,
        }),
      setSelectedFlight: (selectedFlightId) => set({ selectedFlightId }),
      clear: () =>
        set({ outcome: null, isSearching: false, lastSearchAt: null, selectedFlightId: null }),
    }),
    {
      name: 'traversa-search',
      storage: persistStorage,
      partialize: (s) => ({
        outcome: s.outcome,
        lastSearchAt: s.lastSearchAt,
        selectedFlightId: s.selectedFlightId,
        isSearching: false,
      }),
    },
  ),
);
