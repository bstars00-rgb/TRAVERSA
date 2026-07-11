import { createJSONStorage, type StateStorage } from 'zustand/middleware';

/**
 * localStorage 손상/접근불가에 안전한 스토리지.
 * 손상된 JSON을 만나면 해당 키를 지우고 초기 상태로 시작한다.
 */
const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (raw === null) return null;
      JSON.parse(raw); // 손상 감지
      return raw;
    } catch {
      try {
        localStorage.removeItem(name);
      } catch {
        // 접근 자체가 불가한 환경 (프라이빗 모드 등)
      }
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      // 저장 실패는 조용히 무시 — 프로토타입은 메모리 상태로 계속 동작
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      // ignore
    }
  },
};

export const persistStorage = createJSONStorage(() => safeStorage);

export const STORAGE_KEYS = [
  'traversa-trip',
  'traversa-conversation',
  'traversa-search',
  'traversa-itinerary',
  'traversa-booking',
  'traversa-memory',
  'traversa-ui',
] as const;

/** Demo Reset — 모든 저장 상태 제거 */
export function clearAllPersistedState(): void {
  for (const key of STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }
}
