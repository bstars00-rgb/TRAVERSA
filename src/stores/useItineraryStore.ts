import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Itinerary, ItineraryDiff, RiskAlert, ValidationIssue } from '../types';
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
