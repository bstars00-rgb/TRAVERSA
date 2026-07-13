import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Itinerary, ItineraryDiff, ItineraryItem, RiskAlert, ValidationIssue } from '../types';
import { validateItinerary } from '../services/itinerary/validator';
import { assessItineraryRisk } from '../services/itinerary/risk';
import { useTripStore } from './useTripStore';
import { persistStorage } from './storage';

interface ItineraryState {
  itinerary: Itinerary | null;
  pendingDiff: ItineraryDiff | null;
  validationIssues: ValidationIssue[];
  riskAlerts: RiskAlert[];
  setItinerary: (itinerary: Itinerary) => void;
  proposeDiff: (diff: ItineraryDiff) => void;
  /** 사용자가 "변경 적용"을 눌렀을 때만 반영 */
  applyPendingDiff: () => void;
  rejectPendingDiff: () => void;
  /** 사용자가 카드에서 직접 항목 삭제 (확인 다이얼로그 통과 후 호출) */
  removeItem: (itemId: string) => void;
  /** 사용자가 특정 날짜에 항목 직접 추가 */
  addItem: (dayNumber: number, item: ItineraryItem) => void;
  revalidate: () => void;
  clear: () => void;
}

export const useItineraryStore = create<ItineraryState>()(
  persist(
    (set, get) => ({
      itinerary: null,
      pendingDiff: null,
      validationIssues: [],
      riskAlerts: [],

      setItinerary: (itinerary) => {
        const budget = useTripStore.getState().intent.budget;
        set({
          itinerary,
          validationIssues: validateItinerary(itinerary, budget),
          riskAlerts: assessItineraryRisk(itinerary),
        });
        useTripStore.getState().logEvent('ITINERARY_UPDATED', `일정 v${itinerary.version} 생성/갱신`);
      },

      proposeDiff: (diff) => set({ pendingDiff: diff }),

      applyPendingDiff: () => {
        const diff = get().pendingDiff;
        if (!diff) return;
        get().setItinerary(diff.proposedItinerary);
        set({ pendingDiff: null });
        useTripStore
          .getState()
          .logEvent('USER_CONFIRMED', `일정 변경 승인: ${diff.summary}`);
      },

      rejectPendingDiff: () => set({ pendingDiff: null }),

      removeItem: (itemId) => {
        const itinerary = get().itinerary;
        if (!itinerary) return;
        const removed = itinerary.days.flatMap((d) => d.items).find((i) => i.id === itemId);
        const clone = structuredClone(itinerary);
        for (const day of clone.days) {
          day.items = day.items.filter((i) => i.id !== itemId);
        }
        clone.version += 1;
        clone.updatedAt = new Date().toISOString();
        get().setItinerary(clone);
        useTripStore
          .getState()
          .logEvent('USER_CONFIRMED', `일정 항목 삭제: ${removed?.title ?? itemId}`);
      },

      addItem: (dayNumber, item) => {
        const itinerary = get().itinerary;
        if (!itinerary) return;
        const clone = structuredClone(itinerary);
        const day = clone.days.find((d) => d.dayNumber === dayNumber);
        if (!day) return;
        day.items.push(item);
        // 시간순 정렬 유지
        day.items.sort((a, b) => a.startTime.localeCompare(b.startTime));
        clone.version += 1;
        clone.updatedAt = new Date().toISOString();
        get().setItinerary(clone);
        useTripStore
          .getState()
          .logEvent('USER_CONFIRMED', `Day ${dayNumber}에 일정 추가: ${item.title}`);
      },

      revalidate: () => {
        const itinerary = get().itinerary;
        if (!itinerary) return;
        const budget = useTripStore.getState().intent.budget;
        set({
          validationIssues: validateItinerary(itinerary, budget),
          riskAlerts: assessItineraryRisk(itinerary),
        });
      },

      clear: () => set({ itinerary: null, pendingDiff: null, validationIssues: [], riskAlerts: [] }),
    }),
    {
      name: 'traversa-itinerary',
      storage: persistStorage,
      partialize: (s) => ({
        itinerary: s.itinerary,
        validationIssues: s.validationIssues,
        riskAlerts: s.riskAlerts,
        pendingDiff: null,
      }),
    },
  ),
);
