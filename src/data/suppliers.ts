import type { Supplier } from '../types';

/** Mock 공급사 — 서로 다른 가격대, 취소조건, 응답속도, 신뢰도, 데이터 품질 */
export const SUPPLIERS: Supplier[] = [
  {
    id: 'globalbeds',
    name: 'GlobalBeds',
    category: 'hotel',
    description: '글로벌 호텔 도매 공급사. 재고가 넓지만 객실 매핑 품질이 들쭉날쭉하다.',
    apiProtocol: 'REST',
    reliability: 0.92,
    avgLatencyMs: 900,
    supportLevel: 'standard',
  },
  {
    id: 'sakuradirect',
    name: 'SakuraDirect',
    category: 'hotel',
    description: '일본 호텔/료칸 다이렉트 공급사. 데이터 품질이 높고 취소조건이 명확하다.',
    apiProtocol: 'GraphQL',
    reliability: 0.97,
    avgLatencyMs: 600,
    supportLevel: 'premium',
  },
  {
    id: 'asiaroomshub',
    name: 'AsiaRoomsHub',
    category: 'hotel',
    description: '아시아 지역 B2B 공급사. 가격이 저렴하지만 응답이 느리고 세금 표기가 불명확할 때가 있다.',
    apiProtocol: 'XML',
    reliability: 0.83,
    avgLatencyMs: 1800,
    supportLevel: 'basic',
  },
  {
    id: 'airconnect',
    name: 'AirConnect',
    category: 'flight',
    description: '항공 통합 공급사 (GDS 게이트웨이).',
    apiProtocol: 'SOAP',
    reliability: 0.94,
    avgLatencyMs: 1200,
    supportLevel: 'standard',
  },
  {
    id: 'localxperience',
    name: 'LocalXperience',
    category: 'activity',
    description: '현지 액티비티/투어 공급사.',
    apiProtocol: 'REST',
    reliability: 0.9,
    avgLatencyMs: 800,
    supportLevel: 'standard',
  },
  {
    id: 'transferlink',
    name: 'TransferLink',
    category: 'transport',
    description: '공항 픽업/교통 공급사.',
    apiProtocol: 'REST',
    reliability: 0.95,
    avgLatencyMs: 500,
    supportLevel: 'standard',
  },
];

export const HOTEL_SUPPLIER_IDS = ['globalbeds', 'sakuradirect', 'asiaroomshub'] as const;

export function getSupplier(id: string): Supplier {
  const found = SUPPLIERS.find((s) => s.id === id);
  if (!found) throw new Error(`알 수 없는 공급사: ${id}`);
  return found;
}
