import type {
  ActivityOffer,
  Destination,
  FlightOffer,
  HotelOffer,
  Itinerary,
  MCPSearchRequest,
  MCPToolResult,
  Money,
  RiskAlert,
  SupplierHealth,
  TransportOffer,
  ValidationIssue,
} from '../../types';
import { SUPPLIERS, HOTEL_SUPPLIER_IDS, getSupplier } from '../../data/suppliers';
import { DESTINATIONS, findDestination } from '../../data/destinations';
import {
  searchActivitiesFromSupplier,
  searchFlightsFromSupplier,
  searchHotelsFromSupplier,
  searchTransportFromSupplier,
} from '../suppliers/adapters';
import { createRandomSource, type RandomSource } from '../../utils/seededRandom';
import { uid } from '../../utils/id';
import { calculateItineraryBudget } from '../itinerary/budget';
import { validateItinerary } from '../itinerary/validator';
import { assessItineraryRisk } from '../itinerary/risk';
import type {
  GatewayConfig,
  GatewayObserver,
  TravelMCPService,
} from './toolInterfaces';

/**
 * Mock Travel MCP Gateway.
 *
 * AI Orchestrator → (이 게이트웨이) → Supplier Registry → Supplier Adapters → Mock Data
 * 공급사별로 지연/실패를 시뮬레이션하고, 모든 호출을 관찰자에게 통지하며,
 * 공급사 헬스 상태를 유지한다. `fixed` 모드에서는 시드가 고정되어 재현 가능하다.
 */
export class MockTravelMCPGateway implements TravelMCPService {
  private rng: RandomSource;
  private health = new Map<string, SupplierHealth>();
  private observers: GatewayObserver[] = [];
  private config: GatewayConfig;

  constructor(config: GatewayConfig = { mode: 'fixed', seed: 42, latencyScale: 1 }) {
    this.config = config;
    this.rng = createRandomSource(config.mode === 'fixed' ? config.seed : undefined);
    for (const s of SUPPLIERS) {
      this.health.set(s.id, {
        supplierId: s.id,
        status: 'connected',
        latencyMs: s.avgLatencyMs,
        successRate: 1,
        lastCheckedAt: new Date().toISOString(),
        recentCalls: 0,
        recentFailures: 0,
      });
    }
  }

  subscribe(observer: GatewayObserver): () => void {
    this.observers.push(observer);
    return () => {
      this.observers = this.observers.filter((o) => o !== observer);
    };
  }

  getSupplierHealth(): SupplierHealth[] {
    return [...this.health.values()];
  }

  setConfig(config: Partial<GatewayConfig>): void {
    this.config = { ...this.config, ...config };
    this.rng = createRandomSource(
      this.config.mode === 'fixed' ? this.config.seed : undefined,
    );
  }

  /** 공통 실행 파이프라인: 호출 통지 → 지연 시뮬레이션 → 실패 판정 → 헬스 갱신 */
  private async execute<T>(
    toolName: string,
    supplierId: string | undefined,
    requestId: string,
    fn: () => T,
    opts?: { failChance?: number; slowChance?: number },
  ): Promise<MCPToolResult<T>> {
    const callId = uid('call');
    this.observers.forEach((o) => o.onToolCall?.(toolName, supplierId, requestId));

    const supplier = supplierId ? getSupplier(supplierId) : undefined;
    const baseLatency = supplier?.avgLatencyMs ?? 300;
    const isSlow = this.rng.chance(opts?.slowChance ?? 0.12);
    const latencyMs = Math.round(
      baseLatency * this.rng.between(0.7, 1.3) * (isSlow ? 2.8 : 1),
    );
    await delay(latencyMs * this.config.latencyScale);

    const failed = this.rng.chance(opts?.failChance ?? this.defaultFailChance(supplierId));
    const result: MCPToolResult<T> = failed
      ? {
          callId,
          toolName,
          supplierId,
          ok: false,
          status: isSlow ? 'timeout' : 'error',
          latencyMs,
          completedAt: new Date().toISOString(),
          errorMessage: isSlow
            ? `${supplier?.name ?? toolName} 응답 시간 초과`
            : `${supplier?.name ?? toolName} 오류 응답 (mock)`,
        }
      : {
          callId,
          toolName,
          supplierId,
          ok: true,
          status: isSlow ? 'degraded' : 'success',
          latencyMs,
          completedAt: new Date().toISOString(),
          data: fn(),
        };

    if (supplierId) this.updateHealth(supplierId, latencyMs, !failed, isSlow);
    this.observers.forEach((o) => o.onToolResult?.(result));
    return result;
  }

  private defaultFailChance(supplierId?: string): number {
    if (!supplierId) return 0.02;
    const reliability = getSupplier(supplierId).reliability;
    return Math.max(0.02, (1 - reliability) * 0.6);
  }

  private updateHealth(supplierId: string, latencyMs: number, ok: boolean, slow: boolean): void {
    const prev = this.health.get(supplierId);
    if (!prev) return;
    const recentCalls = prev.recentCalls + 1;
    const recentFailures = prev.recentFailures + (ok ? 0 : 1);
    const successRate = (recentCalls - recentFailures) / recentCalls;
    const status: SupplierHealth['status'] =
      successRate < 0.5
        ? 'unavailable'
        : successRate < 0.8
          ? 'degraded'
          : slow
            ? 'slow'
            : 'connected';
    this.health.set(supplierId, {
      supplierId,
      status,
      latencyMs,
      successRate,
      lastCheckedAt: new Date().toISOString(),
      recentCalls,
      recentFailures,
    });
  }

  // ---------- 목적지 ----------

  searchDestinations(req: MCPSearchRequest, query: string) {
    return this.execute('search_destinations', undefined, req.requestId, () => {
      const q = query.toLowerCase();
      const hits = DESTINATIONS.filter(
        (d) =>
          d.name.includes(query) ||
          d.country.includes(query) ||
          d.tags.some((t) => q.includes(t) || t.includes(q)),
      );
      return hits.length > 0 ? hits : DESTINATIONS.slice(0, 3);
    });
  }

  getDestinationContext(req: MCPSearchRequest, destinationId: string) {
    return this.execute('get_destination_context', undefined, req.requestId, () => {
      const d = findDestination(destinationId);
      if (!d) throw new Error(`목적지 없음: ${destinationId}`);
      return d;
    }) as Promise<MCPToolResult<Destination>>;
  }

  checkTravelConstraints(req: MCPSearchRequest, destinationId: string) {
    return this.execute('check_travel_constraints', undefined, req.requestId, () => {
      const d = findDestination(destinationId);
      const notes = ['대한민국 여권 소지자는 무비자 입국 가능 (mock 데이터)'];
      if (d?.country === '일본') notes.push('Visit Japan Web 사전 등록 권장');
      if (d?.country === '싱가포르') notes.push('SG Arrival Card 온라인 제출 필요');
      return notes;
    });
  }

  // ---------- 호텔 ----------

  /** 호텔 공급사 3곳에 병렬 검색 — 공급사별 성공/실패가 독립적이다 */
  async searchHotels(req: MCPSearchRequest): Promise<MCPToolResult<HotelOffer[]>[]> {
    return Promise.all(
      HOTEL_SUPPLIER_IDS.map((supplierId) =>
        this.execute(`search_hotels`, supplierId, req.requestId, () =>
          searchHotelsFromSupplier(supplierId, req, this.rng, new Date()),
        ),
      ),
    );
  }

  getHotelDetails(req: MCPSearchRequest, hotelId: string) {
    return this.execute('get_hotel_details', 'sakuradirect', req.requestId, () =>
      searchHotelsFromSupplier('sakuradirect', req, this.rng, new Date()).filter(
        (o) => o.hotel.id === hotelId,
      ),
    );
  }

  searchRoomRates(req: MCPSearchRequest, hotelId: string) {
    return this.execute('search_room_rates', 'globalbeds', req.requestId, () =>
      searchHotelsFromSupplier('globalbeds', req, this.rng, new Date()).filter(
        (o) => o.hotel.id === hotelId,
      ),
    );
  }

  /** 가격 재확인 — 동일/인하/인상/품절/조건변경을 확률적으로 반환 */
  recheckHotelRate(req: MCPSearchRequest, offer: HotelOffer) {
    return this.execute(
      'recheck_hotel_rate',
      offer.supplierId,
      req.requestId,
      () => this.mutateOfferOnRecheck(offer),
      { failChance: 0.03 },
    );
  }

  holdHotelRate(req: MCPSearchRequest, offer: HotelOffer) {
    return this.execute('hold_hotel_rate', offer.supplierId, req.requestId, () => ({
      heldUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
    }));
  }

  prepareHotelBooking(req: MCPSearchRequest, offer: HotelOffer) {
    return this.execute('prepare_hotel_booking', offer.supplierId, req.requestId, () => ({
      preparationRef: uid('prep_hotel'),
    }));
  }

  private mutateOfferOnRecheck<T extends HotelOffer | FlightOffer>(offer: T): T {
    const roll = this.rng.next();
    const now = new Date().toISOString();
    if (roll < 0.55) {
      return { ...offer, retrievedAt: now }; // 가격 동일
    }
    if (roll < 0.7) {
      return scalePrice(offer, this.rng.between(0.93, 0.98), now); // 인하
    }
    if (roll < 0.9) {
      return scalePrice(offer, this.rng.between(1.03, 1.12), now); // 인상
    }
    if (roll < 0.96) {
      return { ...offer, retrievedAt: now, availabilityStatus: 'last_room' as const };
    }
    return { ...offer, retrievedAt: now, availabilityStatus: 'sold_out' as const };
  }

  // ---------- 항공 ----------

  searchFlights(req: MCPSearchRequest) {
    return this.execute('search_flights', 'airconnect', req.requestId, () =>
      searchFlightsFromSupplier(req, this.rng, new Date()),
    );
  }

  getFareRules(req: MCPSearchRequest, offerId: string) {
    return this.execute('get_fare_rules', 'airconnect', req.requestId, () => [
      `운임 규정 (${offerId})`,
      '출발 14일 전까지 취소 시 수수료 50,000원/인',
      '출발 14일 이내 취소 시 수수료 120,000원/인',
      '노쇼 시 환불 불가',
    ]);
  }

  recheckFlightOffer(req: MCPSearchRequest, offer: FlightOffer) {
    return this.execute(
      'recheck_flight_offer',
      'airconnect',
      req.requestId,
      () => this.mutateOfferOnRecheck(offer),
      { failChance: 0.03 },
    );
  }

  prepareFlightBooking(req: MCPSearchRequest, offer: FlightOffer) {
    return this.execute('prepare_flight_booking', 'airconnect', req.requestId, () => ({
      preparationRef: uid(`prep_flight_${offer.flightNumber}`),
    }));
  }

  // ---------- 액티비티 ----------

  searchActivities(req: MCPSearchRequest) {
    return this.execute('search_activities', 'localxperience', req.requestId, () =>
      searchActivitiesFromSupplier(req, this.rng, new Date()),
    );
  }

  checkActivityAvailability(req: MCPSearchRequest, offerId: string) {
    return this.execute('check_activity_availability', 'localxperience', req.requestId, () =>
      offerId.length > 0 ? !this.rng.chance(0.05) : false,
    );
  }

  prepareActivityBooking(req: MCPSearchRequest, offer: ActivityOffer) {
    return this.execute('prepare_activity_booking', 'localxperience', req.requestId, () => ({
      preparationRef: uid(`prep_act_${offer.supplierOfferId.slice(-4)}`),
    }));
  }

  // ---------- 교통 ----------

  searchTransport(req: MCPSearchRequest) {
    return this.execute('search_transport', 'transferlink', req.requestId, () =>
      searchTransportFromSupplier(req, this.rng, new Date()),
    );
  }

  estimateTransferTime(req: MCPSearchRequest, from: string, to: string) {
    return this.execute('estimate_transfer_time', 'transferlink', req.requestId, () =>
      Math.round(30 + ((from.length + to.length) % 5) * 15),
    );
  }

  prepareTransportBooking(req: MCPSearchRequest, offer: TransportOffer) {
    return this.execute('prepare_transport_booking', 'transferlink', req.requestId, () => ({
      preparationRef: uid(`prep_trf_${offer.supplierOfferId.slice(-4)}`),
    }));
  }

  // ---------- 여행계획 (결정론적 서비스 위임) ----------

  optimizeItinerary(req: MCPSearchRequest, itinerary: Itinerary): Promise<MCPToolResult<Itinerary>> {
    return this.execute('optimize_itinerary', undefined, req.requestId, () => itinerary);
  }

  calculateTripBudget(req: MCPSearchRequest, itinerary: Itinerary): Promise<MCPToolResult<Money>> {
    return this.execute('calculate_trip_budget', undefined, req.requestId, () =>
      calculateItineraryBudget(itinerary, req.currency),
    );
  }

  detectScheduleConflicts(
    req: MCPSearchRequest,
    itinerary: Itinerary,
  ): Promise<MCPToolResult<ValidationIssue[]>> {
    return this.execute('detect_schedule_conflicts', undefined, req.requestId, () =>
      validateItinerary(itinerary),
    );
  }

  assessTripRisk(req: MCPSearchRequest, itinerary: Itinerary): Promise<MCPToolResult<RiskAlert[]>> {
    return this.execute('assess_trip_risk', undefined, req.requestId, () =>
      assessItineraryRisk(itinerary),
    );
  }
}

function scalePrice<T extends { price: Money; taxes: Money; fees: Money; totalPrice: Money; retrievedAt: string }>(
  offer: T,
  factor: number,
  now: string,
): T {
  const scale = (m: Money): Money => ({ ...m, amount: Math.round(m.amount * factor) });
  const price = scale(offer.price);
  const taxes = scale(offer.taxes);
  const fees = scale(offer.fees);
  return {
    ...offer,
    retrievedAt: now,
    price,
    taxes,
    fees,
    totalPrice: { currency: price.currency, amount: price.amount + taxes.amount + fees.amount },
  };
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** 앱 전역 게이트웨이 싱글턴 — 데모 재현을 위해 fixed 시드로 시작 */
export const travelGateway = new MockTravelMCPGateway({
  mode: 'realistic',
  seed: 42,
  latencyScale: 1,
});
