# 04. 기술 컨텍스트 (Technical Context)

## 1. 시스템 구조

```
React UI (3-pane Workspace: 대화 | Journey Canvas | 한눈에 보기)
  └─ Zustand Stores (8개)
       └─ AI Orchestrator (MockAIProvider — AIProvider 인터페이스 뒤)
            └─ Travel MCP Gateway (MockTravelMCPGateway — TravelMCPService 인터페이스)
                 └─ Supplier Registry → Supplier Adapters (REST/XML/SOAP/GraphQL 정규화)
                      └─ Mock Data (시드 고정 재현 모드)
```

### 라우트 (HashRouter)
| 경로 | 페이지 | 성격 |
|---|---|---|
| `/`, `/new-trip` | HomePage | 소비자 |
| `/trip` | WorkspacePage (3단) | 소비자 |
| `/booking` | BookingPage (예약 준비) | 소비자 |
| `/future-journey` | FutureJourneyPage | 소비자 |
| `/memory` | MemoryPage (여행 기억) | 소비자 |
| `/mcp-monitor` | McpMonitorPage | 운영자/데모 |
| `/activity-log` | ActivityLogPage | 운영자/데모 |
| `/design-system` | DesignSystemPage | 운영자/데모 |
| `/settings` | SettingsPage (데모·리셋) | 운영자/데모 |

### Zustand 스토어 8개 (`src/stores/`)
`useConversationStore`(대화·검색·에이전트 오케스트레이션), `useTripStore`(TripIntent·이벤트 로그), `useSearchStore`(검색 결과·왕복 항공 선택), `useItineraryStore`(일정·Diff·검증·리스크·항목 편집), `useBookingStore`(예약 준비·가격 재확인·확인 체크리스트), `useSupplierStore`(공급사 헬스·MCP 호출 로그), `useUserMemoryStore`(여행 기억·모니터링 알림·페르소나), `useUIStore`(모바일 탭·토스트).
→ `useTrip/Conversation/Search/Itinerary/Booking/UserMemory`는 localStorage 지속화(`src/stores/storage.ts`, 손상 복구 포함).

## 2. 개발 환경

- **Node.js**: v24.14.1 (로컬 확인). CI는 `lts/*`.
- **패키지 매니저**: npm (package-lock.json 커밋됨)
- **스택**: React 19, TypeScript ~5.8, Vite 7, Tailwind CSS v4(@tailwindcss/vite), Zustand 5, react-router-dom 7(HashRouter), lucide-react, recharts 3, date-fns 4, Vitest 3 + @testing-library
- **주요 스크립트** (package.json):
  - `dev` = vite
  - `build` = `tsc -b && vite build`
  - `lint` = eslint .
  - `test` = vitest run
  - `preview` = vite preview

## 3. 데이터 구조 (핵심 타입 — `src/types/`)

- `common.ts`: Money, CurrencyCode, **PriceStatus**(estimated/retrieved/rechecked/locked/changed), **BookingStatus**(idea~confirmed 10종), **DataSourceType**(ai_recommendation/live_supplier_data/user_confirmed/booking_confirmation), PriceSnapshot, CancellationPolicy, RiskAlert
- `trip.ts`: TripIntent, Traveler, Destination, UserProfile, TravelMemory, TravelPersonaAxes
- `supplier.ts`: Supplier, SupplierHealth, MCPSearchRequest, SupplierOfferBase, Hotel/Room/RatePlan, **HotelOffer/FlightOffer(direction 포함)/ActivityOffer/TransportOffer**, MCPToolCall/Result
- `itinerary.ts`: Itinerary, ItineraryDay, ItineraryItem, ValidationIssue, ItineraryDiff
- `booking.ts`: BookingItem, BookingPreparation, RecheckResult, UserConfirmation
- `ai.ts`: AIMessage, AITask, AgentActivity, TripEvent, **AIProvider 인터페이스**, MonitoringAlert

### Mock 데이터 (`src/data/`)
- `suppliers.ts`: 공급사 6곳 (GlobalBeds, SakuraDirect, AsiaRoomsHub / AirConnect / LocalXperience / TransferLink)
- `destinations.ts`: 하코네, 유후인, 기노사키, 싱가포르, 방콕
- `hotels.ts`: 목적지별 호텔·객실 시드 (canonical ID 매핑 포함)
- `catalog.ts`: 항공(왕복 outbound/return), 액티비티, 교통 시드

## 4. 연동 정보

- **현재 외부 연동 없음.** 실제 API·결제 미연동이 설계 원칙. 모든 데이터는 Mock.
- **API 키 없음** — 프런트엔드에 어떤 키도 존재하지 않음. `.env`는 커밋 금지, `.env.example`만 제공(`VITE_BASE_PATH`만 포함).
- **GitHub Actions**: `.github/workflows/deploy-pages.yml` — main push/수동 실행 시 lint→test→build→Pages 배포. 권한 최소화(contents:read, pages:write, id-token:write), concurrency로 중복 방지.
- **배포 시 base path**: 워크플로가 `VITE_BASE_PATH=/${{ github.event.repository.name }}/` 주입.

## 5. 실행 방법

```bash
# 클론 후
npm install
npm run dev          # http://localhost:5173

# 품질 확인
npm run lint
npm run test         # 53개 통과 기대
npm run build

# 데모 시연: /settings 화면에서 3개 시나리오 원클릭 재생, Demo Reset으로 초기화
```

### 재현성
Mock 게이트웨이는 `travelGateway.setConfig({ mode: 'fixed', seed, latencyScale })`로 시드 고정 재현 가능. 테스트에서 `latencyScale: 0`으로 지연 제거. 앱 기본은 `realistic` 모드(무작위 지연/실패).
