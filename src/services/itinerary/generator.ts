import { addDays, format, parseISO } from 'date-fns';
import type {
  ActivityOffer,
  FlightOffer,
  HotelOffer,
  Itinerary,
  ItineraryDay,
  ItineraryItem,
  TransportOffer,
  TripIntent,
} from '../../types';
import { findDestination } from '../../data/destinations';
import { uid } from '../../utils/id';

/**
 * 선택된 상품(호텔/항공/교통/액티비티)을 날짜별 타임라인으로 조합한다.
 * 가격 상태: 공급사 오퍼가 연결된 항목은 retrieved, AI 추정 항목은 estimated.
 */

export interface ItinerarySelections {
  hotel?: HotelOffer;
  /** 가는 편 */
  flight?: FlightOffer;
  /** 오는 편 (귀국) */
  returnFlight?: FlightOffer;
  transport?: TransportOffer;
  activities: ActivityOffer[];
}

export function generateItinerary(
  tripId: string,
  intent: TripIntent,
  selections: ItinerarySelections,
): Itinerary {
  const destination = findDestination(intent.possibleDestinations[0] ?? '');
  const startIso = intent.dateRange?.start ?? '2026-08-14';
  const nights = intent.duration ?? 4;
  const relaxed = intent.pace === 'relaxed';
  const days: ItineraryDay[] = [];

  for (let d = 0; d <= nights; d++) {
    const date = format(addDays(parseISO(startIso), d), 'yyyy-MM-dd');
    const items: ItineraryItem[] = [];

    if (d === 0) {
      if (selections.flight) items.push(flightItem(selections.flight));
      if (selections.transport) items.push(transportItem(selections.transport, selections.flight));
      if (selections.hotel) items.push(checkinItem(selections.hotel));
      items.push(estimatedItem('meal', '호텔 근처 저녁식사', '19:00', 90, '도보 5분 거리', 60000, false));
    } else if (d === nights) {
      if (selections.hotel) items.push(checkoutItem(selections.hotel));
      items.push(estimatedItem('shopping', '기념품 쇼핑', '11:30', 90, destination?.name ?? '시내', 100000, false));
      if (selections.returnFlight) {
        // 귀국편 출발 3시간 전 공항 도착 기준으로 이동 시각을 잡는다
        const transferStart = addMinutesToTime(selections.returnFlight.departureTime, -210);
        items.push(estimatedItem('transport', '공항 이동', transferStart, 90, `${selections.returnFlight.from} 공항`, 30000, false));
        items.push(flightItem(selections.returnFlight));
      } else {
        items.push(estimatedItem('transport', '공항 이동', '14:00', 90, '공항', 30000, false));
      }
    } else {
      items.push(estimatedItem('meal', '조식', '08:30', 60, selections.hotel?.hotel.name ?? '호텔', 0, false));
      const activity = selections.activities[d - 1];
      if (activity) {
        items.push(activityItem(activity, '10:30'));
      } else {
        items.push(estimatedItem('sightseeing', `${destination?.name ?? '현지'} 산책과 관광`, '10:30', relaxed ? 120 : 180, destination?.name ?? '시내', 30000, true));
      }
      items.push(restItem(relaxed ? '15:00' : '16:30', relaxed ? 150 : 90));
      items.push(
        estimatedItem(
          'meal',
          d === 1 && intent.interests.includes('온천') ? '가이세키 저녁' : '현지 맛집 저녁',
          '18:30',
          120,
          selections.hotel?.hotel.name ?? '시내',
          intent.interests.includes('미식') ? 120000 : 80000,
          false,
        ),
      );
    }

    days.push({
      dayNumber: d + 1,
      date,
      title: dayTitle(d, nights, destination?.name),
      items,
    });
  }

  return {
    id: uid('itin'),
    tripId,
    destinationName: destination?.name ?? '여행지',
    days,
    version: 1,
    updatedAt: new Date().toISOString(),
  };
}

function dayTitle(d: number, nights: number, destName?: string): string {
  if (d === 0) return `${destName ?? '목적지'} 도착`;
  if (d === nights) return '귀국';
  return `${destName ?? '현지'} ${d}일차`;
}

function flightItem(offer: FlightOffer): ItineraryItem {
  return {
    id: uid('item'),
    type: 'flight',
    title: `${offer.airline} ${offer.flightNumber} (${offer.from}→${offer.to})`,
    startTime: offer.departureTime,
    durationMinutes: offer.durationMinutes,
    location: `${offer.from} 공항`,
    travelMinutesFromPrevious: 0,
    requiresBooking: true,
    bookingStatus: 'selected',
    price: { amount: offer.totalPrice, status: 'retrieved', capturedAt: offer.retrievedAt, expiresAt: offer.expiresAt, supplierId: offer.supplierId },
    cancellationPolicy: offer.cancellationPolicy,
    weatherSensitive: false,
    physicalLoad: 'low',
    offer,
  };
}

function transportItem(offer: TransportOffer, flight?: FlightOffer): ItineraryItem {
  const start = flight ? addMinutesToTime(flight.arrivalTime, 60) : '12:00';
  return {
    id: uid('item'),
    type: 'transport',
    title: `공항 픽업 — ${offer.vehicleType}`,
    startTime: start,
    durationMinutes: offer.durationMinutes,
    location: offer.from,
    travelMinutesFromPrevious: 0,
    requiresBooking: true,
    bookingStatus: 'selected',
    price: { amount: offer.totalPrice, status: 'retrieved', capturedAt: offer.retrievedAt, expiresAt: offer.expiresAt, supplierId: offer.supplierId },
    cancellationPolicy: offer.cancellationPolicy,
    weatherSensitive: false,
    physicalLoad: 'low',
    accessibilityNotes: '차량 이동 — 도보 부담 없음',
    offer,
  };
}

function checkinItem(offer: HotelOffer): ItineraryItem {
  return {
    id: uid('item'),
    type: 'checkin',
    title: `${offer.hotel.name} 체크인`,
    startTime: '15:00',
    durationMinutes: 30,
    location: offer.hotel.location,
    travelMinutesFromPrevious: 20,
    requiresBooking: true,
    bookingStatus: 'selected',
    price: { amount: offer.totalPrice, status: 'retrieved', capturedAt: offer.retrievedAt, expiresAt: offer.expiresAt, supplierId: offer.supplierId },
    cancellationPolicy: offer.cancellationPolicy,
    weatherSensitive: false,
    physicalLoad: 'low',
    offer,
  };
}

function checkoutItem(offer: HotelOffer): ItineraryItem {
  return {
    id: uid('item'),
    type: 'checkout',
    title: `${offer.hotel.name} 체크아웃`,
    startTime: '10:30',
    durationMinutes: 30,
    location: offer.hotel.location,
    travelMinutesFromPrevious: 0,
    requiresBooking: false,
    bookingStatus: 'idea',
    weatherSensitive: false,
    physicalLoad: 'low',
  };
}

function activityItem(offer: ActivityOffer, startTime: string): ItineraryItem {
  return {
    id: uid('item'),
    type: 'activity',
    title: offer.title,
    startTime,
    durationMinutes: offer.durationMinutes,
    location: offer.meetingPoint,
    travelMinutesFromPrevious: 25,
    requiresBooking: true,
    bookingStatus: 'selected',
    price: { amount: offer.totalPrice, status: 'retrieved', capturedAt: offer.retrievedAt, expiresAt: offer.expiresAt, supplierId: offer.supplierId },
    cancellationPolicy: offer.cancellationPolicy,
    weatherSensitive: offer.category === '자연' || offer.category === '관광',
    physicalLoad: offer.physicalIntensity,
    offer,
  };
}

function restItem(startTime: string, durationMinutes: number): ItineraryItem {
  return {
    id: uid('item'),
    type: 'rest',
    title: '휴식 (온천/객실)',
    startTime,
    durationMinutes,
    location: '숙소',
    travelMinutesFromPrevious: 15,
    requiresBooking: false,
    bookingStatus: 'idea',
    weatherSensitive: false,
    physicalLoad: 'low',
    aiNote: '체력 안배를 위해 AI가 배치한 휴식 구간입니다.',
  };
}

function estimatedItem(
  type: ItineraryItem['type'],
  title: string,
  startTime: string,
  durationMinutes: number,
  location: string,
  estimatedCost: number,
  weatherSensitive: boolean,
): ItineraryItem {
  return {
    id: uid('item'),
    type,
    title,
    startTime,
    durationMinutes,
    location,
    travelMinutesFromPrevious: 15,
    requiresBooking: false,
    bookingStatus: 'idea',
    price:
      estimatedCost > 0
        ? { amount: { amount: estimatedCost, currency: 'KRW' }, status: 'estimated', capturedAt: new Date().toISOString() }
        : undefined,
    weatherSensitive,
    physicalLoad: type === 'sightseeing' ? 'medium' : 'low',
    aiNote: 'AI 추정 항목 — 예약이 필요하지 않습니다.',
  };
}

export function addMinutesToTime(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number);
  const day = 24 * 60;
  const total = (((h * 60 + m + minutes) % day) + day) % day; // 음수(전날 방향)도 안전하게 순환
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
