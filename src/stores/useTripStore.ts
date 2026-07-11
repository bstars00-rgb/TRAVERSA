import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TripEvent, TripEventType, TripIntent } from '../types';
import { emptyIntent } from '../services/ai/intentParser';
import { uid } from '../utils/id';
import { persistStorage } from './storage';

interface TripState {
  tripId: string | null;
  tripTitle: string;
  intent: TripIntent;
  events: TripEvent[];
  createTrip: (title: string) => string;
  setIntent: (intent: TripIntent) => void;
  /** 사용자가 "내 여행조건" 패널에서 직접 수정 */
  patchIntent: (patch: Partial<TripIntent>) => void;
  logEvent: (type: TripEventType, summary: string, meta?: TripEvent['meta']) => void;
  resetTrip: () => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set, get) => ({
      tripId: null,
      tripTitle: '',
      intent: emptyIntent(),
      events: [],

      createTrip: (title) => {
        const tripId = uid('trip');
        set({ tripId, tripTitle: title, intent: emptyIntent() });
        get().logEvent('TRIP_CREATED', `새 여행 시작: ${title}`);
        return tripId;
      },

      setIntent: (intent) => {
        set({ intent });
        get().logEvent('INTENT_UPDATED', `여행조건 갱신 (신뢰도 ${Math.round(intent.confidenceScore * 100)}%)`);
      },

      patchIntent: (patch) => {
        const intent = { ...get().intent, ...patch };
        set({ intent });
        get().logEvent('INTENT_UPDATED', '사용자가 여행조건을 직접 수정');
      },

      logEvent: (type, summary, meta) => {
        const event: TripEvent = {
          id: uid('evt'),
          type,
          summary,
          tripId: get().tripId ?? undefined,
          createdAt: new Date().toISOString(),
          meta,
        };
        set((s) => ({ events: [event, ...s.events].slice(0, 300) }));
      },

      resetTrip: () => set({ tripId: null, tripTitle: '', intent: emptyIntent() }),
    }),
    { name: 'traversa-trip', storage: persistStorage },
  ),
);
