import type { CurrencyCode, DateRange } from './common';

export type TravelerType = 'adult' | 'senior' | 'child' | 'infant';

export interface Traveler {
  id: string;
  type: TravelerType;
  /** 한글 이름 (표시용) */
  displayName?: string;
  /** 여권 영문명 — 예약 준비 시 사용자가 직접 확정 */
  englishGivenName?: string;
  englishFamilyName?: string;
  age?: number;
  mobilityNotes?: string;
  confirmedByUser: boolean;
}

export type TravelPace = 'relaxed' | 'balanced' | 'packed';

export interface TripIntent {
  origin?: string;
  possibleDestinations: string[];
  dateRange?: DateRange;
  /** 박 수 (5박 6일이면 5) */
  duration?: number;
  travelers?: number;
  travelerTypes: TravelerType[];
  budget?: number;
  currency: CurrencyCode;
  pace?: TravelPace;
  interests: string[];
  accommodationPreferences: string[];
  transportationPreferences: string[];
  foodPreferences: string[];
  accessibilityNeeds: string[];
  constraints: string[];
  missingInformation: IntentField[];
  /** 0~1 — AI가 의도를 얼마나 확신하는지 */
  confidenceScore: number;
}

export type IntentField =
  | 'dateRange'
  | 'origin'
  | 'travelers'
  | 'budget'
  | 'constraints'
  | 'interests'
  | 'destination';

export interface Destination {
  id: string;
  name: string;
  nameLocal: string;
  country: string;
  region: string;
  tags: string[];
  bestFor: string[];
  averageDailyBudgetKRW: number;
  flightHoursFromICN: number;
  summary: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  homeAirport: string;
  locale: string;
  currency: CurrencyCode;
  memoryEnabled: boolean;
}

export type MemoryCategory =
  | 'hotel_grade'
  | 'room_size'
  | 'bed_config'
  | 'walking_tolerance'
  | 'food'
  | 'children'
  | 'parents_mobility'
  | 'airport'
  | 'flight_time'
  | 'satisfaction'
  | 'price_sensitivity';

export interface TravelMemory {
  id: string;
  category: MemoryCategory;
  label: string;
  value: string;
  learnedFrom: string;
  enabled: boolean;
  createdAt: string;
}

/** 여행 성향 디지털 트윈 축 (0~100) */
export interface TravelPersonaAxes {
  comfort: number;
  price: number;
  localExperience: number;
  scheduleDensity: number;
  food: number;
  luxury: number;
  familyFriendly: number;
  adventure: number;
  mobilityEase: number;
}
