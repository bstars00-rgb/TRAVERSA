import type {
  ActivityOffer,
  FlightOffer,
  HotelOffer,
  MCPSearchRequest,
  TransportOffer,
} from '../../types';
import { getSupplier } from '../../data/suppliers';
import { hotelSeedsForDestination } from '../../data/hotels';
import { ACTIVITY_SEEDS, FLIGHT_SEEDS, TRANSPORT_SEEDS } from '../../data/catalog';
import { normalizeQuote, type RawSupplierQuote } from './normalize';
import type { RandomSource } from '../../utils/seededRandom';

/**
 * Supplier Adapter — 공급사별 원본 API(REST/XML/SOAP/GraphQL)를 흉내내고
 * 표준 오퍼로 정규화한다. 공급사별 가격/취소조건/데이터 품질 특성이 다르다.
 */

interface HotelSupplierProfile {
  priceFactor: number;
  taxRate: number;
  feeRate: number;
  freeCancelDaysBefore: number;
  refundableChance: number;
  roomMappingConfidence: number;
  taxesIncluded: boolean | 'unclear';
  offerTtlMinutes: number;
}

const HOTEL_PROFILES: Record<string, HotelSupplierProfile> = {
  // 다이렉트 공급사: 비싸지만 데이터가 깨끗하고 취소조건이 관대함
  sakuradirect: {
    priceFactor: 1.0,
    taxRate: 0.1,
    feeRate: 0,
    freeCancelDaysBefore: 1,
    refundableChance: 0.95,
    roomMappingConfidence: 0.98,
    taxesIncluded: true,
    offerTtlMinutes: 45,
  },
  // 글로벌 도매: 중간 가격, 객실 매핑이 가끔 애매함
  globalbeds: {
    priceFactor: 0.93,
    taxRate: 0.1,
    feeRate: 0.03,
    freeCancelDaysBefore: 3,
    refundableChance: 0.75,
    roomMappingConfidence: 0.82,
    taxesIncluded: true,
    offerTtlMinutes: 30,
  },
  // B2B 저가: 가장 싸지만 세금 표기 불명확 + 매핑 신뢰도 낮음
  asiaroomshub: {
    priceFactor: 0.86,
    taxRate: 0.1,
    feeRate: 0.05,
    freeCancelDaysBefore: 7,
    refundableChance: 0.5,
    roomMappingConfidence: 0.68,
    taxesIncluded: 'unclear',
    offerTtlMinutes: 20,
  },
};

export function searchHotelsFromSupplier(
  supplierId: string,
  req: MCPSearchRequest,
  rng: RandomSource,
  now: Date,
): HotelOffer[] {
  const supplier = getSupplier(supplierId);
  const profile = HOTEL_PROFILES[supplierId];
  const seeds = hotelSeedsForDestination(req.destination ?? '');
  const nights = req.dateRange ? nightsBetween(req.dateRange.start, req.dateRange.end) : 3;

  const offers: HotelOffer[] = [];
  for (const seed of seeds) {
    if (!seed.supplierIds.includes(supplierId)) continue;
    for (const room of seed.rooms) {
      const jitter = rng.between(0.97, 1.06);
      const nightly = seed.baseNightlyKRW * profile.priceFactor * jitter;
      const availability = rng.chance(0.08)
        ? 'last_room'
        : rng.chance(0.06)
          ? 'limited'
          : 'available';
      const raw: RawSupplierQuote = {
        grossPrice: nightly * nights,
        taxRate: profile.taxRate,
        feeRate: profile.feeRate,
        currency: 'KRW',
        availability,
        refundable: rng.chance(profile.refundableChance),
        freeCancelDaysBefore: profile.freeCancelDaysBefore,
        checkInDate: req.dateRange?.start,
        offerTtlMinutes: profile.offerTtlMinutes,
      };
      const base = normalizeQuote(supplier, raw, now);
      const warnings = [...base.warnings];
      if (profile.roomMappingConfidence < 0.75) {
        warnings.push('객실명 매핑 신뢰도가 낮습니다. 침대 구성이 실제와 다를 수 있습니다.');
      }
      if (profile.taxesIncluded === 'unclear') {
        warnings.push('세금 포함 여부가 공급사 응답에서 불명확합니다.');
      }
      offers.push({
        ...base,
        warnings,
        kind: 'hotel',
        hotel: seed.hotel,
        room,
        ratePlan: {
          id: `${room.id}_${supplierId}`,
          roomId: room.id,
          name: room.breakfastIncluded ? '조식 포함' : '객실만',
          mealPlan: room.breakfastIncluded ? 'breakfast' : 'none',
          paymentTiming: supplierId === 'sakuradirect' ? 'pay_at_hotel' : 'pay_now',
        },
        nights,
        roomMappingConfidence: profile.roomMappingConfidence,
        taxesIncludedInPrice: profile.taxesIncluded,
      });
    }
  }
  return offers;
}

export function searchFlightsFromSupplier(
  req: MCPSearchRequest,
  rng: RandomSource,
  now: Date,
): FlightOffer[] {
  const supplier = getSupplier('airconnect');
  return FLIGHT_SEEDS.filter((f) => f.destinationId === req.destination).map((f) => {
    const raw: RawSupplierQuote = {
      grossPrice: f.basePriceKRW * rng.between(0.95, 1.15) * Math.max(1, req.travelers.length),
      taxRate: 0.08,
      feeRate: 0.02,
      currency: 'KRW',
      availability: rng.chance(0.05) ? 'limited' : 'available',
      refundable: rng.chance(0.4),
      freeCancelDaysBefore: 14,
      checkInDate: req.dateRange?.start,
      offerTtlMinutes: 15,
    };
    const base = normalizeQuote(supplier, raw, now);
    return {
      ...base,
      kind: 'flight' as const,
      direction: f.direction,
      airline: f.airline,
      flightNumber: f.flightNumber,
      from: f.from,
      to: f.to,
      departureTime: f.departureTime,
      arrivalTime: f.arrivalTime,
      durationMinutes: f.durationMinutes,
      cabinClass: f.cabinClass,
      fareRules: [
        '출발 14일 전까지 취소 시 수수료 50,000원',
        '출발 후 노쇼 시 환불 불가',
        '날짜 변경 시 차액 및 수수료 30,000원 발생',
      ],
      baggageIncluded: f.basePriceKRW > 300000,
    };
  });
}

export function searchActivitiesFromSupplier(
  req: MCPSearchRequest,
  rng: RandomSource,
  now: Date,
): ActivityOffer[] {
  const supplier = getSupplier('localxperience');
  return ACTIVITY_SEEDS.filter((a) => a.destinationId === req.destination).map((a) => {
    const raw: RawSupplierQuote = {
      grossPrice: a.basePriceKRW * rng.between(0.98, 1.05) * Math.max(1, req.travelers.length),
      taxRate: 0,
      feeRate: 0.03,
      currency: 'KRW',
      availability: 'available',
      refundable: true,
      freeCancelDaysBefore: 2,
      checkInDate: req.dateRange?.start,
      offerTtlMinutes: 120,
    };
    const base = normalizeQuote(supplier, raw, now);
    return {
      ...base,
      kind: 'activity' as const,
      title: a.title,
      category: a.category,
      durationMinutes: a.durationMinutes,
      physicalIntensity: a.physicalIntensity,
      minAge: a.minAge,
      meetingPoint: a.meetingPoint,
      languages: ['한국어', '영어'],
    };
  });
}

export function searchTransportFromSupplier(
  req: MCPSearchRequest,
  rng: RandomSource,
  now: Date,
): TransportOffer[] {
  const supplier = getSupplier('transferlink');
  return TRANSPORT_SEEDS.filter((t) => t.destinationId === req.destination).map((t) => {
    const raw: RawSupplierQuote = {
      grossPrice: t.basePriceKRW * rng.between(0.98, 1.04),
      taxRate: 0.1,
      feeRate: 0,
      currency: 'KRW',
      availability: 'available',
      refundable: true,
      freeCancelDaysBefore: 1,
      checkInDate: req.dateRange?.start,
      offerTtlMinutes: 240,
    };
    const base = normalizeQuote(supplier, raw, now);
    return {
      ...base,
      kind: 'transport' as const,
      mode: t.mode,
      from: t.from,
      to: t.to,
      durationMinutes: t.durationMinutes,
      vehicleType: t.vehicleType,
      maxPassengers: t.maxPassengers,
    };
  });
}

export function nightsBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}
