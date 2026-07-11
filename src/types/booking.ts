import type { BookingStatus, Money, PriceSnapshot, RiskAlert, CancellationPolicy } from './common';
import type { AnyOffer } from './supplier';
import type { Traveler } from './trip';

export type BookingStepId =
  | 'select'
  | 'recheck'
  | 'availability'
  | 'travelers'
  | 'cancellation'
  | 'terms'
  | 'payment_prep'
  | 'execute';

export interface BookingItem {
  id: string;
  offer: AnyOffer;
  status: BookingStatus;
  latestPrice: PriceSnapshot;
  specialRequests?: string;
  /** 예약 주체 공급사 */
  bookedVia: string;
  refundableAmount: Money;
  cancellationDeadline?: string;
}

export type RecheckOutcome =
  | 'price_same'
  | 'price_decreased'
  | 'price_increased'
  | 'sold_out'
  | 'room_changed'
  | 'policy_changed'
  | 'alternative_supplier_available';

export interface RecheckResult {
  bookingItemId: string;
  outcome: RecheckOutcome;
  previousPrice: Money;
  currentPrice: Money;
  message: string;
  newCancellationPolicy?: CancellationPolicy;
  alternativeSupplierName?: string;
  recheckedAt: string;
}

/** 사용자가 직접 확인해야 하는 항목 — AI 대리승인 상태는 존재하지 않는다 */
export type ConfirmationKind =
  | 'traveler_names'
  | 'dates'
  | 'room_and_beds'
  | 'fare_rules'
  | 'cancellation_terms'
  | 'price_change'
  | 'booking_execution'
  | 'payment';

export interface UserConfirmation {
  id: string;
  kind: ConfirmationKind;
  label: string;
  confirmed: boolean;
  confirmedAt?: string;
  /** 확인 당시 화면에 표시된 요약 (승인 증적) */
  snapshotSummary?: string;
}

export interface BookingPreparation {
  id: string;
  tripId: string;
  currentStep: BookingStepId;
  items: BookingItem[];
  travelers: Traveler[];
  confirmations: UserConfirmation[];
  recheckResults: RecheckResult[];
  riskAlerts: RiskAlert[];
  totalDue: Money;
  updatedAt: string;
}
