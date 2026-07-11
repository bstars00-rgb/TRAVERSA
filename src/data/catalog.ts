/** 항공 / 액티비티 / 교통 시드 데이터 — 어댑터가 공급사 오퍼로 변환한다 */

export interface FlightSeed {
  destinationId: string;
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string; // HH:mm
  arrivalTime: string; // HH:mm
  durationMinutes: number;
  basePriceKRW: number;
  cabinClass: 'economy' | 'premium_economy' | 'business';
}

export const FLIGHT_SEEDS: FlightSeed[] = [
  { destinationId: 'hakone', airline: '대한항공', flightNumber: 'KE705', from: 'ICN', to: 'NRT', departureTime: '09:20', arrivalTime: '11:50', durationMinutes: 150, basePriceKRW: 420000, cabinClass: 'economy' },
  { destinationId: 'hakone', airline: '아시아나항공', flightNumber: 'OZ102', from: 'ICN', to: 'HND', departureTime: '08:00', arrivalTime: '10:15', durationMinutes: 135, basePriceKRW: 460000, cabinClass: 'economy' },
  { destinationId: 'singapore', airline: '싱가포르항공', flightNumber: 'SQ607', from: 'ICN', to: 'SIN', departureTime: '10:30', arrivalTime: '16:05', durationMinutes: 395, basePriceKRW: 780000, cabinClass: 'economy' },
  { destinationId: 'singapore', airline: '스쿠트', flightNumber: 'TR899', from: 'ICN', to: 'SIN', departureTime: '01:10', arrivalTime: '06:35', durationMinutes: 385, basePriceKRW: 430000, cabinClass: 'economy' },
  { destinationId: 'bangkok', airline: '베트남항공', flightNumber: 'VN601', from: 'SGN', to: 'BKK', departureTime: '11:40', arrivalTime: '13:05', durationMinutes: 85, basePriceKRW: 180000, cabinClass: 'economy' },
];

export interface ActivitySeed {
  destinationId: string;
  title: string;
  category: string;
  durationMinutes: number;
  basePriceKRW: number;
  physicalIntensity: 'low' | 'medium' | 'high';
  minAge?: number;
  meetingPoint: string;
}

export const ACTIVITY_SEEDS: ActivitySeed[] = [
  { destinationId: 'hakone', title: '하코네 해적선 + 로프웨이 프라이빗 가이드', category: '관광', durationMinutes: 240, basePriceKRW: 180000, physicalIntensity: 'low', meetingPoint: '모토하코네항' },
  { destinationId: 'hakone', title: '오와쿠다니 소풍 (차량 이동)', category: '자연', durationMinutes: 150, basePriceKRW: 120000, physicalIntensity: 'low', meetingPoint: '호텔 로비' },
  { destinationId: 'hakone', title: '가이세키 저녁 + 프라이빗 온천 체험', category: '미식', durationMinutes: 180, basePriceKRW: 260000, physicalIntensity: 'low', meetingPoint: '료칸' },
  { destinationId: 'singapore', title: '유니버설 스튜디오 싱가포르 1일권', category: '테마파크', durationMinutes: 480, basePriceKRW: 110000, physicalIntensity: 'medium', minAge: 4, meetingPoint: '센토사' },
  { destinationId: 'singapore', title: '가든스바이더베이 + 클라우드포레스트', category: '관광', durationMinutes: 180, basePriceKRW: 45000, physicalIntensity: 'low', meetingPoint: '베이프론트역' },
  { destinationId: 'singapore', title: '나이트 사파리 패밀리 투어', category: '체험', durationMinutes: 210, basePriceKRW: 75000, physicalIntensity: 'low', minAge: 3, meetingPoint: '만다이' },
  { destinationId: 'bangkok', title: '차오프라야 선셋 디너 크루즈', category: '미식', durationMinutes: 150, basePriceKRW: 95000, physicalIntensity: 'low', meetingPoint: '아이콘시암 선착장' },
  { destinationId: 'bangkok', title: '전통 타이 마사지 & 스파 2시간', category: '휴식', durationMinutes: 120, basePriceKRW: 80000, physicalIntensity: 'low', meetingPoint: '호텔 픽업' },
];

export interface TransportSeed {
  destinationId: string;
  mode: 'private_transfer' | 'shared_shuttle' | 'train' | 'taxi';
  from: string;
  to: string;
  durationMinutes: number;
  basePriceKRW: number;
  vehicleType: string;
  maxPassengers: number;
}

export const TRANSPORT_SEEDS: TransportSeed[] = [
  { destinationId: 'hakone', mode: 'private_transfer', from: '하네다공항', to: '하코네 호텔', durationMinutes: 100, basePriceKRW: 220000, vehicleType: '알파드 (밴)', maxPassengers: 5 },
  { destinationId: 'hakone', mode: 'train', from: '신주쿠', to: '하코네유모토', durationMinutes: 85, basePriceKRW: 25000, vehicleType: '로망스카 지정석', maxPassengers: 4 },
  { destinationId: 'singapore', mode: 'private_transfer', from: '창이공항', to: '시내 호텔', durationMinutes: 30, basePriceKRW: 55000, vehicleType: '미니밴', maxPassengers: 5 },
  { destinationId: 'bangkok', mode: 'private_transfer', from: '수완나품공항', to: '강변 호텔', durationMinutes: 45, basePriceKRW: 40000, vehicleType: '세단', maxPassengers: 3 },
];
