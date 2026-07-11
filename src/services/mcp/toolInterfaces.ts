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
  TransportOffer,
  ValidationIssue,
} from '../../types';

/**
 * 표준 Travel MCP 도구 인터페이스.
 *
 * 공급사가 MCP를 직접 제공한다고 가정하지 않는다.
 * 기존 REST/XML/SOAP/GraphQL API를 Supplier Adapter가 이 표준 도구로 변환하며,
 * LLM은 공급사 원본 응답을 직접 해석하지 않는다 — 항상 정규화된 결과만 받는다.
 *
 * 이 인터페이스 뒤의 구현(Mock)은 나중에 원격 MCP 서버 클라이언트로 교체할 수 있다.
 */
export interface TravelMCPService {
  // 목적지
  searchDestinations(req: MCPSearchRequest, query: string): Promise<MCPToolResult<Destination[]>>;
  getDestinationContext(req: MCPSearchRequest, destinationId: string): Promise<MCPToolResult<Destination>>;
  checkTravelConstraints(req: MCPSearchRequest, destinationId: string): Promise<MCPToolResult<string[]>>;

  // 호텔
  searchHotels(req: MCPSearchRequest): Promise<MCPToolResult<HotelOffer[]>[]>;
  getHotelDetails(req: MCPSearchRequest, hotelId: string): Promise<MCPToolResult<HotelOffer[]>>;
  searchRoomRates(req: MCPSearchRequest, hotelId: string): Promise<MCPToolResult<HotelOffer[]>>;
  recheckHotelRate(req: MCPSearchRequest, offer: HotelOffer): Promise<MCPToolResult<HotelOffer>>;
  holdHotelRate(req: MCPSearchRequest, offer: HotelOffer): Promise<MCPToolResult<{ heldUntil: string }>>;
  prepareHotelBooking(req: MCPSearchRequest, offer: HotelOffer): Promise<MCPToolResult<{ preparationRef: string }>>;

  // 항공
  searchFlights(req: MCPSearchRequest): Promise<MCPToolResult<FlightOffer[]>>;
  getFareRules(req: MCPSearchRequest, offerId: string): Promise<MCPToolResult<string[]>>;
  recheckFlightOffer(req: MCPSearchRequest, offer: FlightOffer): Promise<MCPToolResult<FlightOffer>>;
  prepareFlightBooking(req: MCPSearchRequest, offer: FlightOffer): Promise<MCPToolResult<{ preparationRef: string }>>;

  // 액티비티
  searchActivities(req: MCPSearchRequest): Promise<MCPToolResult<ActivityOffer[]>>;
  checkActivityAvailability(req: MCPSearchRequest, offerId: string): Promise<MCPToolResult<boolean>>;
  prepareActivityBooking(req: MCPSearchRequest, offer: ActivityOffer): Promise<MCPToolResult<{ preparationRef: string }>>;

  // 교통
  searchTransport(req: MCPSearchRequest): Promise<MCPToolResult<TransportOffer[]>>;
  estimateTransferTime(req: MCPSearchRequest, from: string, to: string): Promise<MCPToolResult<number>>;
  prepareTransportBooking(req: MCPSearchRequest, offer: TransportOffer): Promise<MCPToolResult<{ preparationRef: string }>>;

  // 여행계획 (결정론적 서비스 위임)
  optimizeItinerary(req: MCPSearchRequest, itinerary: Itinerary): Promise<MCPToolResult<Itinerary>>;
  calculateTripBudget(req: MCPSearchRequest, itinerary: Itinerary): Promise<MCPToolResult<Money>>;
  detectScheduleConflicts(req: MCPSearchRequest, itinerary: Itinerary): Promise<MCPToolResult<ValidationIssue[]>>;
  assessTripRisk(req: MCPSearchRequest, itinerary: Itinerary): Promise<MCPToolResult<RiskAlert[]>>;
}

/** 게이트웨이 이벤트 — 모니터링/이벤트 로그 스토어가 구독한다 */
export interface GatewayObserver {
  onToolCall?(toolName: string, supplierId: string | undefined, requestId: string): void;
  onToolResult?(result: MCPToolResult<unknown>): void;
}

export type ScenarioMode = 'realistic' | 'fixed';

export interface GatewayConfig {
  /** fixed: 시드 고정 — 테스트/데모 재현용. realistic: 무작위 지연/실패 */
  mode: ScenarioMode;
  seed: number;
  /** 지연 시뮬레이션 배속 (테스트에서 0으로 설정) */
  latencyScale: number;
}
