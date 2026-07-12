import type {
  CancellationPolicy,
  CurrencyCode,
  DateRange,
  Money,
} from './common';
import type { TravelerType } from './trip';

export type SupplierCategory =
  | 'hotel'
  | 'flight'
  | 'activity'
  | 'transport'
  | 'destination';

export type SupplierStatus =
  | 'connected'
  | 'slow'
  | 'degraded'
  | 'rate_limited'
  | 'auth_failed'
  | 'unavailable';

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  description: string;
  /** 원본 API 형태 — 어댑터가 표준 MCP 도구로 변환한다 */
  apiProtocol: 'REST' | 'XML' | 'SOAP' | 'GraphQL';
  /** 0~1 데이터 품질/신뢰도 */
  reliability: number;
  avgLatencyMs: number;
  supportLevel: 'basic' | 'standard' | 'premium';
}

export interface SupplierHealth {
  supplierId: string;
  status: SupplierStatus;
  latencyMs: number;
  successRate: number;
  lastCheckedAt: string;
  recentCalls: number;
  recentFailures: number;
}

/** 모든 검색 요청의 공통 정보 */
export interface MCPSearchRequest {
  requestId: string;
  sessionId: string;
  locale: string;
  currency: CurrencyCode;
  travelers: TravelerType[];
  destination?: string;
  dateRange?: DateRange;
  userPreferences?: string[];
  accessibilityNeeds?: string[];
  timeoutMs: number;
}

export type AvailabilityStatus =
  | 'available'
  | 'limited'
  | 'last_room'
  | 'sold_out'
  | 'unknown';

/** 모든 공급사 검색 결과의 공통 정보 (정규화 후) */
export interface SupplierOfferBase {
  supplierId: string;
  supplierName: string;
  supplierOfferId: string;
  retrievedAt: string;
  expiresAt: string;
  price: Money;
  taxes: Money;
  fees: Money;
  totalPrice: Money;
  currency: CurrencyCode;
  availabilityStatus: AvailabilityStatus;
  cancellationPolicy: CancellationPolicy;
  sourceType: 'live_supplier_data';
  /** 0~1 정규화/매핑 신뢰도 */
  confidence: number;
  warnings: string[];
  rawDataReference: string;
}

export interface Hotel {
  id: string;
  canonicalId: string;
  name: string;
  nameLocal?: string;
  destinationId: string;
  starRating: number;
  reviewScore: number;
  location: string;
  distanceToStationM: number;
  amenities: string[];
  imageTone: string;
  suitableForSeniors: boolean;
  suitableForChildren: boolean;
}

export interface Room {
  id: string;
  canonicalRoomId: string;
  name: string;
  sizeSqm: number;
  bedConfiguration: string;
  maxOccupancy: number;
  breakfastIncluded: boolean;
}

export interface RatePlan {
  id: string;
  roomId: string;
  name: string;
  mealPlan: 'none' | 'breakfast' | 'half_board';
  paymentTiming: 'pay_now' | 'pay_at_hotel';
}

export interface HotelOffer extends SupplierOfferBase {
  kind: 'hotel';
  hotel: Hotel;
  room: Room;
  ratePlan: RatePlan;
  nights: number;
  /** 객실명 매핑 신뢰도 (공급사별 객실명이 달라 발생) */
  roomMappingConfidence: number;
  taxesIncludedInPrice: boolean | 'unclear';
}

export interface FlightOffer extends SupplierOfferBase {
  kind: 'flight';
  /** 가는 편 / 오는 편 */
  direction: 'outbound' | 'return';
  airline: string;
  flightNumber: string;
  from: string;
  to: string;
  departureTime: string;
  arrivalTime: string;
  durationMinutes: number;
  cabinClass: 'economy' | 'premium_economy' | 'business';
  fareRules: string[];
  baggageIncluded: boolean;
}

export interface ActivityOffer extends SupplierOfferBase {
  kind: 'activity';
  title: string;
  category: string;
  durationMinutes: number;
  physicalIntensity: 'low' | 'medium' | 'high';
  minAge?: number;
  meetingPoint: string;
  languages: string[];
}

export interface TransportOffer extends SupplierOfferBase {
  kind: 'transport';
  mode: 'private_transfer' | 'shared_shuttle' | 'train' | 'taxi';
  from: string;
  to: string;
  durationMinutes: number;
  vehicleType: string;
  maxPassengers: number;
}

export type AnyOffer = HotelOffer | FlightOffer | ActivityOffer | TransportOffer;

/** MCP 도구 호출 감사 기록 */
export interface MCPToolCall {
  id: string;
  toolName: string;
  supplierId?: string;
  requestId: string;
  startedAt: string;
  /** 민감정보 제거된 입력 요약 */
  inputSummary: string;
}

export interface MCPToolResult<T = unknown> {
  callId: string;
  toolName: string;
  supplierId?: string;
  ok: boolean;
  status: 'success' | 'timeout' | 'error' | 'degraded';
  latencyMs: number;
  completedAt: string;
  data?: T;
  errorMessage?: string;
}
