import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MonitoringAlert, TravelMemory, TravelPersonaAxes } from '../types';
import { uid } from '../utils/id';
import { persistStorage } from './storage';

const DEFAULT_MEMORIES: Omit<TravelMemory, 'id' | 'createdAt'>[] = [
  { category: 'hotel_grade', label: '선호 호텔 등급', value: '4성급 이상', learnedFrom: '2025년 오사카 여행', enabled: true },
  { category: 'room_size', label: '선호 객실 크기', value: '35㎡ 이상', learnedFrom: '과거 예약 3건', enabled: true },
  { category: 'bed_config', label: '침대 구성', value: '트윈 선호 (부모님 동반 시)', learnedFrom: '2025년 교토 여행', enabled: true },
  { category: 'walking_tolerance', label: '이동거리 허용범위', value: '1일 도보 5,000보 이하 (부모님 동반)', learnedFrom: '사용자 입력', enabled: true },
  { category: 'food', label: '음식 취향', value: '현지식 선호, 매운 음식 가능', learnedFrom: '대화 기록', enabled: true },
  { category: 'children', label: '아이 정보', value: '6세, 테마파크와 수영장 선호', learnedFrom: '2026년 계획 대화', enabled: true },
  { category: 'parents_mobility', label: '부모님 이동 제약', value: '계단 오르기 어려움, 엘리베이터 필수', learnedFrom: '사용자 입력', enabled: true },
  { category: 'airport', label: '자주 사용하는 공항', value: 'ICN 인천 T2', learnedFrom: '과거 예약', enabled: true },
  { category: 'flight_time', label: '선호 항공시간', value: '오전 출발 · 오후 귀국', learnedFrom: '과거 예약 5건', enabled: true },
  { category: 'satisfaction', label: '과거 여행 만족도', value: '온천 료칸 9.2/10 · 대형 리조트 7.5/10', learnedFrom: '여행 후 설문', enabled: true },
  { category: 'price_sensitivity', label: '가격 민감도', value: '숙소는 투자, 교통은 절약', learnedFrom: '예약 패턴 분석', enabled: true },
];

export const BASE_PERSONA: TravelPersonaAxes = {
  comfort: 82,
  price: 55,
  localExperience: 68,
  scheduleDensity: 35,
  food: 88,
  luxury: 60,
  familyFriendly: 75,
  adventure: 30,
  mobilityEase: 85,
};

const DEFAULT_ALERTS: Omit<MonitoringAlert, 'id' | 'detectedAt'>[] = [
  {
    category: 'price_drop',
    title: '호텔 가격 인하 감지',
    description: '선택하신 호텔의 동일 객실이 GlobalBeds에서 7% 인하되었습니다.',
    proposedAction: '동일 취소조건으로 재예약하여 84,000원 절약',
    impact: '-84,000원 · 취소조건 동일',
    status: 'pending_user',
  },
  {
    category: 'weather',
    title: '여행 2일차 강수 확률 상승',
    description: '기상 예보가 강수 확률 70%로 변경되었습니다. 야외 일정 2건이 영향을 받습니다.',
    proposedAction: '실내 대체 일정으로 교체안 생성',
    impact: '일정 변경 · 추가 비용 없음',
    status: 'pending_user',
  },
  {
    category: 'flight_change',
    title: '항공 출발시간 변경 안내',
    description: '항공사가 출발시간을 20분 앞당겼습니다 (09:20 → 09:00).',
    proposedAction: '공항 픽업 시간을 20분 앞당김',
    impact: '이동 일정 자동 조정 필요',
    status: 'pending_user',
  },
];

interface UserMemoryState {
  memoryEnabled: boolean;
  memories: TravelMemory[];
  monitoringAlerts: MonitoringAlert[];
  persona: TravelPersonaAxes;
  setMemoryEnabled: (v: boolean) => void;
  toggleMemory: (id: string) => void;
  deleteMemory: (id: string) => void;
  resolveAlert: (id: string, status: 'approved' | 'dismissed') => void;
  resetDefaults: () => void;
}

function seedMemories(): TravelMemory[] {
  return DEFAULT_MEMORIES.map((m) => ({ ...m, id: uid('mem'), createdAt: new Date().toISOString() }));
}

function seedAlerts(): MonitoringAlert[] {
  return DEFAULT_ALERTS.map((a) => ({ ...a, id: uid('alert'), detectedAt: new Date().toISOString() }));
}

export const useUserMemoryStore = create<UserMemoryState>()(
  persist(
    (set) => ({
      memoryEnabled: true,
      memories: seedMemories(),
      monitoringAlerts: seedAlerts(),
      persona: BASE_PERSONA,
      setMemoryEnabled: (memoryEnabled) => set({ memoryEnabled }),
      toggleMemory: (id) =>
        set((s) => ({
          memories: s.memories.map((m) => (m.id === id ? { ...m, enabled: !m.enabled } : m)),
        })),
      deleteMemory: (id) => set((s) => ({ memories: s.memories.filter((m) => m.id !== id) })),
      resolveAlert: (id, status) =>
        set((s) => ({
          monitoringAlerts: s.monitoringAlerts.map((a) => (a.id === id ? { ...a, status } : a)),
        })),
      resetDefaults: () =>
        set({ memoryEnabled: true, memories: seedMemories(), monitoringAlerts: seedAlerts(), persona: BASE_PERSONA }),
    }),
    { name: 'traversa-memory', storage: persistStorage },
  ),
);
