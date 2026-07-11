import type { BookingStatus, Money, PriceSnapshot, CancellationPolicy } from './common';
import type { AnyOffer } from './supplier';

export type ItineraryItemType =
  | 'flight'
  | 'hotel'
  | 'transport'
  | 'activity'
  | 'meal'
  | 'rest'
  | 'sightseeing'
  | 'checkin'
  | 'checkout'
  | 'shopping';

export type PhysicalLoad = 'low' | 'medium' | 'high';

export interface ItineraryItem {
  id: string;
  type: ItineraryItemType;
  title: string;
  /** HH:mm */
  startTime: string;
  durationMinutes: number;
  location: string;
  travelMinutesFromPrevious: number;
  requiresBooking: boolean;
  bookingStatus: BookingStatus;
  price?: PriceSnapshot;
  cancellationPolicy?: CancellationPolicy;
  weatherSensitive: boolean;
  physicalLoad: PhysicalLoad;
  accessibilityNotes?: string;
  alternativeOf?: string;
  /** 연결된 공급사 상품 */
  offer?: AnyOffer;
  aiNote?: string;
}

export interface ItineraryDay {
  /** 1-based */
  dayNumber: number;
  /** ISO yyyy-MM-dd */
  date: string;
  title: string;
  items: ItineraryItem[];
}

export interface Itinerary {
  id: string;
  tripId: string;
  destinationName: string;
  days: ItineraryDay[];
  version: number;
  updatedAt: string;
}

export type ValidationIssueType =
  | 'arrival_before_checkin'
  | 'room_after_checkout'
  | 'flight_transport_conflict'
  | 'insufficient_travel_time'
  | 'overpacked_day'
  | 'insufficient_rest'
  | 'booking_time_overlap'
  | 'budget_exceeded'
  | 'child_age_restriction'
  | 'opening_hours_conflict';

export interface ValidationIssue {
  id: string;
  type: ValidationIssueType;
  severity: 'warning' | 'critical';
  message: string;
  dayNumber?: number;
  itemIds: string[];
}

/** 일정 변경 Diff — 사용자가 승인해야 반영 */
export interface ItineraryDiff {
  id: string;
  command: string;
  summary: string;
  changes: DiffChange[];
  costDelta: Money;
  travelTimeDeltaMinutes: number;
  proposedItinerary: Itinerary;
  createdAt: string;
}

export interface DiffChange {
  kind: 'add' | 'remove' | 'replace' | 'modify';
  label: string;
  before?: string;
  after?: string;
  impact?: string;
}
