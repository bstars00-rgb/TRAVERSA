/** 공통 기본 타입 — 가격/출처/상태 구분은 TRAVERSA UX의 핵심이다. */

export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export type CurrencyCode = 'KRW' | 'USD' | 'JPY' | 'SGD' | 'THB' | 'VND' | 'EUR';

/** 가격 상태 — AI 예상치와 공급사 확정치를 절대 섞지 않는다. */
export type PriceStatus =
  | 'estimated' // AI가 예상한 금액
  | 'retrieved' // 공급사에서 검색된 금액
  | 'rechecked' // 최신 가격으로 재확인한 금액
  | 'locked' // 일정 시간 보장된 금액
  | 'changed'; // 가격이 변경된 상태

/** 예약 상태 라이프사이클 */
export type BookingStatus =
  | 'idea'
  | 'searching'
  | 'compared'
  | 'selected'
  | 'rechecking'
  | 'ready_to_book'
  | 'on_hold'
  | 'confirmed'
  | 'failed'
  | 'needs_attention';

/** 정보 출처 — UI에서 항상 시각적으로 구분한다. */
export type DataSourceType =
  | 'ai_recommendation'
  | 'live_supplier_data'
  | 'user_confirmed'
  | 'booking_confirmation';

export interface DateRange {
  /** ISO yyyy-MM-dd */
  start: string;
  /** ISO yyyy-MM-dd */
  end: string;
  /** 사용자가 대략적으로만 말한 경우 (예: "8월쯤") */
  flexible?: boolean;
}

export interface PriceSnapshot {
  amount: Money;
  status: PriceStatus;
  /** ISO datetime 가격 확인 시점 */
  capturedAt: string;
  /** ISO datetime 가격 만료 시점 */
  expiresAt?: string;
  supplierId?: string;
  previousAmount?: Money;
}

export interface CancellationPolicy {
  refundable: boolean;
  /** ISO datetime — 이 시점까지 무료취소 */
  freeCancellationUntil?: string;
  penaltyDescription: string;
  /** 구조화 데이터와 원문 텍스트 불일치 여부 */
  structuredTextMismatch?: boolean;
}

export type RiskSeverity = 'info' | 'warning' | 'critical';

export interface RiskAlert {
  id: string;
  severity: RiskSeverity;
  category:
    | 'room_mapping'
    | 'bed_mismatch'
    | 'tax_unclear'
    | 'policy_mismatch'
    | 'price_expiring'
    | 'supplier_slow'
    | 'last_room'
    | 'schedule'
    | 'budget'
    | 'weather'
    | 'external';
  message: string;
  relatedItemId?: string;
  createdAt: string;
}
