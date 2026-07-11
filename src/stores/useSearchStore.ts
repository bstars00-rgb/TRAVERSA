import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { SearchOutcome } from '../services/ai/searchOrchestrator';
import { persistStorage } from './storage';

interface SearchState {
  outcome: SearchOutcome | null;
  isSearching: boolean;
  lastSearchAt: string | null;
  setSearching: (v: boolean) => void;
  setOutcome: (o: SearchOutcome) => void;
  clear: () => void;
}

export const useSearchStore = create<SearchState>()(
  persist(
    (set) => ({
      outcome: null,
      isSearching: false,
      lastSearchAt: null,
      setSearching: (isSearching) => set({ isSearching }),
      setOutcome: (outcome) =>
        set({ outcome, isSearching: false, lastSearchAt: new Date().toISOString() }),
      clear: () => set({ outcome: null, isSearching: false, lastSearchAt: null }),
    }),
    {
      name: 'traversa-search',
      storage: persistStorage,
      partialize: (s) => ({ outcome: s.outcome, lastSearchAt: s.lastSearchAt, isSearching: false }),
    },
  ),
);
