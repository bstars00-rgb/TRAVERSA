import type { Destination } from '../types';

export const DESTINATIONS: Destination[] = [
  {
    id: 'hakone',
    name: '하코네',
    nameLocal: '箱根',
    country: '일본',
    region: '가나가와',
    tags: ['온천', '료칸', '자연', '시니어 친화', '미식'],
    bestFor: ['부모님 동반', '온천 휴양', '느린 여행'],
    averageDailyBudgetKRW: 280000,
    flightHoursFromICN: 2.5,
    summary: '도쿄에서 로망스카로 85분. 이동이 적고 온천 료칸이 밀집해 시니어 동반 여행에 적합합니다.',
  },
  {
    id: 'yufuin',
    name: '유후인',
    nameLocal: '由布院',
    country: '일본',
    region: '오이타',
    tags: ['온천', '료칸', '소도시', '미식'],
    bestFor: ['부모님 동반', '온천 휴양'],
    averageDailyBudgetKRW: 250000,
    flightHoursFromICN: 1.5,
    summary: '후쿠오카 공항에서 버스 100분. 평탄한 마을 구조로 걷기 부담이 적습니다.',
  },
  {
    id: 'singapore',
    name: '싱가포르',
    nameLocal: 'Singapore',
    country: '싱가포르',
    region: '싱가포르',
    tags: ['가족', '도시', '안전', '음식', '테마파크'],
    bestFor: ['아이 동반', '첫 해외여행', '미식'],
    averageDailyBudgetKRW: 350000,
    flightHoursFromICN: 6.5,
    summary: '치안이 좋고 대중교통이 편리해 6세 아이 동반 가족여행의 대표 목적지입니다.',
  },
  {
    id: 'bangkok',
    name: '방콕',
    nameLocal: 'กรุงเทพฯ',
    country: '태국',
    region: '방콕',
    tags: ['도시', '휴식', '스파', '음식', '가성비'],
    bestFor: ['출장 연계 휴식', '혼자 여행', '미식'],
    averageDailyBudgetKRW: 180000,
    flightHoursFromICN: 5.5,
    summary: '호찌민에서 1시간 25분. 강변 호텔과 스파로 짧은 휴식 여행에 적합합니다.',
  },
  {
    id: 'kinosaki',
    name: '기노사키',
    nameLocal: '城崎温泉',
    country: '일본',
    region: '효고',
    tags: ['온천', '료칸', '소도시'],
    bestFor: ['온천 순례', '부모님 동반'],
    averageDailyBudgetKRW: 240000,
    flightHoursFromICN: 2,
    summary: '7개 외탕을 도보로 순례하는 온천 마을. 마을 전체가 평지입니다.',
  },
];

export function findDestination(id: string): Destination | undefined {
  return DESTINATIONS.find((d) => d.id === id);
}
