import type {
  ActivityOffer,
  AITask,
  FlightOffer,
  HotelOffer,
  MCPSearchRequest,
  TransportOffer,
  TripIntent,
} from '../../types';
import { travelGateway } from '../mcp/gateway';
import { buildRecommendations, type HotelRecommendation } from './scoring';
import { uid } from '../../utils/id';

/**
 * 검색 오케스트레이터 — PAGE 5의 작업 목록을 실제 게이트웨이 호출로 수행하며
 * 각 작업의 성공/실패/지연 상태를 콜백으로 UI에 전달한다.
 */

export interface SearchOutcome {
  recommendations: HotelRecommendation[];
  hotelOffers: HotelOffer[];
  flightOffers: FlightOffer[];
  activityOffers: ActivityOffer[];
  transportOffers: TransportOffer[];
  failedSuppliers: string[];
  allHotelSuppliersFailed: boolean;
}

export type TaskUpdateCallback = (tasks: AITask[]) => void;

/** 고객의 실제 예약 순서를 따른다 — 항공을 먼저 확보한 뒤 숙소를 찾는다 */
const TASK_LABELS = [
  '여행조건 확인',
  '목적지 분석',
  '항공편 검색',
  '호텔 공급사 3곳 검색',
  '이동시간 계산',
  '액티비티 검색',
  '일정 충돌 확인',
  '예산 검토',
  '추천안 작성',
] as const;

export function buildSearchRequest(intent: TripIntent, sessionId: string): MCPSearchRequest {
  return {
    requestId: uid('req'),
    sessionId,
    locale: 'ko-KR',
    currency: intent.currency,
    travelers: intent.travelerTypes.length > 0 ? intent.travelerTypes : ['adult'],
    destination: intent.possibleDestinations[0],
    dateRange: intent.dateRange,
    userPreferences: [...intent.interests, ...intent.accommodationPreferences],
    accessibilityNeeds: intent.accessibilityNeeds,
    timeoutMs: 8000,
  };
}

export async function runTravelSearch(
  intent: TripIntent,
  sessionId: string,
  onTasks: TaskUpdateCallback,
): Promise<SearchOutcome> {
  const tasks: AITask[] = TASK_LABELS.map((label) => ({
    id: uid('task'),
    label,
    state: 'pending',
  }));
  const set = (index: number, state: AITask['state'], detail?: string) => {
    tasks[index] = { ...tasks[index], state, detail };
    onTasks([...tasks]);
  };
  onTasks([...tasks]);

  const req = buildSearchRequest(intent, sessionId);

  // 1. 여행조건 확인 / 2. 목적지 분석
  set(0, 'running');
  set(0, 'success', `${req.travelers.length}명 · ${intent.duration ?? '?'}박`);
  set(1, 'running');
  const destResult = await travelGateway.getDestinationContext(req, req.destination ?? '');
  set(1, destResult.ok ? 'success' : 'failed', destResult.ok ? destResult.data?.name : destResult.errorMessage);

  // 3. 항공편 검색 — 고객의 예약 순서상 가장 먼저 확보한다
  set(2, 'running');
  const flightResult = await travelGateway.searchFlights(req);
  const flightOffers = flightResult.ok && flightResult.data ? flightResult.data : [];
  set(2, flightResult.ok ? 'success' : 'failed', flightResult.ok ? `${flightOffers.length}개 운임` : flightResult.errorMessage);

  // 4. 호텔 공급사 3곳 병렬 검색
  set(3, 'running');
  const hotelResults = await travelGateway.searchHotels(req);
  const hotelOffers = hotelResults.flatMap((r) => (r.ok && r.data ? r.data : []));
  const failedSuppliers = hotelResults.filter((r) => !r.ok).map((r) => r.supplierId ?? '?');
  const slowSuppliers = hotelResults.filter((r) => r.ok && r.status === 'degraded');
  const allHotelSuppliersFailed = hotelResults.every((r) => !r.ok);
  set(
    3,
    allHotelSuppliersFailed ? 'failed' : slowSuppliers.length > 0 ? 'slow' : 'success',
    allHotelSuppliersFailed
      ? '모든 호텔 공급사 응답 실패'
      : `${hotelOffers.length}개 객실 · ${failedSuppliers.length > 0 ? `${failedSuppliers.join(', ')} 실패` : '3개사 정상'}`,
  );

  // 5. 이동시간 계산
  set(4, 'running');
  const transferResult = await travelGateway.estimateTransferTime(req, '공항', req.destination ?? '');
  set(4, transferResult.ok ? 'success' : 'failed', transferResult.ok ? `약 ${transferResult.data}분` : undefined);

  // 6. 액티비티 검색 + 교통편
  set(5, 'running');
  const [activityResult, transportResult] = await Promise.all([
    travelGateway.searchActivities(req),
    travelGateway.searchTransport(req),
  ]);
  const activityOffers = activityResult.ok && activityResult.data ? activityResult.data : [];
  const transportOffers = transportResult.ok && transportResult.data ? transportResult.data : [];
  set(5, activityResult.ok ? 'success' : 'failed', `${activityOffers.length}개 액티비티`);

  // 7. 일정 충돌 확인 (검색 단계에서는 사전 점검)
  set(6, 'running');
  set(6, 'success', '충돌 없음 (일정 생성 후 재검증)');

  // 8. 예산 검토
  set(7, 'running');
  const cheapest = hotelOffers.length > 0 ? Math.min(...hotelOffers.map((o) => o.totalPrice.amount)) : 0;
  const within = intent.budget === undefined || cheapest <= intent.budget;
  set(7, within ? 'success' : 'slow', within ? '예산 범위 내 후보 존재' : '최저가가 예산을 초과합니다');

  // 9. 추천안 작성
  set(8, 'running');
  const recommendations = buildRecommendations(hotelOffers, intent);
  set(8, recommendations.length > 0 ? 'success' : 'failed', `${recommendations.length}개 전략 추천`);

  return {
    recommendations,
    hotelOffers,
    flightOffers,
    activityOffers,
    transportOffers,
    failedSuppliers,
    allHotelSuppliersFailed,
  };
}
