# TRAVERSA AI

**Travel + Conversational + Universal Assistant** — 검색창과 필터 대신 자연어 대화로 여행을 설계하고 예약하는 차세대 여행 플랫폼 프로토타입.

> 이 저장소는 데모/프로토타입입니다. 실제 AI API·공급사 API·결제를 호출하지 않으며, Mock AI와 Mock Travel MCP Gateway로 10년 후 여행 예약 경험을 시연합니다.

## 제품 비전

사용자는 지역·날짜·인원·필터를 각각 고르지 않습니다. 이렇게 말할 뿐입니다.

> "8월에 부모님과 일본에 5박 6일로 가고 싶어. 많이 걷지 않고 온천과 좋은 음식을 즐기고 싶어. 전체 예산은 항공 제외 300만 원 정도야."

AI 여행 컨설턴트가 부족한 조건을 인터뷰로 채우고, 여러 공급사를 검색·비교해 하나의 여행 일정으로 조합하며, 모든 예약·결제 승인은 **반드시 사용자가 직접** 수행합니다.

## 주요 기능

| 영역 | 내용 |
|---|---|
| AI 여행 인터뷰 | 규칙 기반 Mock 파서가 `TripIntent` 생성, 우선순위 상위 질문을 한 번에 최대 2개만 질문 |
| Travel MCP Gateway | 표준 MCP 도구 24종(호텔/항공/액티비티/교통/일정), 공급사 6곳 어댑터, 지연·실패 시뮬레이션 |
| 대화형 검색 | 작업별 성공/실패/지연 상태 표시, Best Match / Best Value / Premium 3전략 압축 |
| 가격 비교 | 동일 호텔·동일 객실의 공급사별 가격 비교, 점수 근거("왜 이 상품인가요?") 공개 |
| Journey Canvas | 날짜별 타임라인, 자연어 일정 수정 + Diff 승인 UI, `ItineraryValidator` 충돌 탐지 |
| 예약 준비 | 가격 재확인(동일/인하/인상/품절), Human-in-the-loop 확인 체크리스트, 결제 준비까지 |
| 미래 기능 | Travel Memory 관리, 자율 모니터링(승인 필수), 성향 디지털 트윈, 멀티에이전트, 예약 후 여정 |
| 투명성 | 가격 상태 5종(Estimated→Locked/Changed), 출처 4종(AI/공급사/사용자확정/예약확정) 상시 구분 |

## 아키텍처

```
React UI (3-pane Workspace)
  └─ Zustand Stores (conversation/trip/search/itinerary/booking/supplier/memory/ui)
       └─ AI Orchestrator (MockAIProvider — AIProvider 인터페이스 뒤에서 교체 가능)
            └─ Travel MCP Gateway (TravelMCPService 인터페이스)
                 └─ Supplier Registry → Supplier Adapters (REST/XML/SOAP/GraphQL 정규화)
                      └─ Mock Data (고정 시드 재현 모드 지원)
```

원칙:

- **LLM은 공급사 원본 응답을 해석하지 않습니다.** 어댑터가 표준 오퍼로 정규화한 뒤 전달합니다.
- **가격·재고·예약 확정은 결정론적 서비스**(validator, budget, scoring)가 계산합니다.
- **AI가 대신 승인하는 상태는 존재하지 않습니다.** 모든 확정은 `UserConfirmation` 증적으로 기록됩니다.

## 실행방법

```bash
npm install
npm run dev        # http://localhost:5173
```

## 테스트방법

```bash
npm run lint       # ESLint
npm run test       # Vitest — 단위 + 사용자 흐름 + 오류 시나리오 53개
npm run build      # 타입체크 + 프로덕션 빌드
```

## 데모 시나리오

설정(`/settings`) 화면에서 원클릭 재생:

1. **일본 부모님 온천여행** — 하코네 5박 6일, 도보 최소화, 예산 300만 원
2. **싱가포르 가족여행** — 6세 아이 동반 4박, 수영장·테마파크
3. **방콕 출장 연계 여행** — 호찌민 출장 후 2박 휴식

같은 화면의 **Demo Reset**으로 모든 localStorage 상태를 초기화해 재시연할 수 있습니다.

## Mock MCP 구조

- `src/services/mcp/toolInterfaces.ts` — 표준 Travel MCP 도구 인터페이스 (`TravelMCPService`)
- `src/services/mcp/gateway.ts` — Mock 게이트웨이: 공급사 헬스, 지연/실패 시뮬레이션, 호출 감사
- `src/services/suppliers/normalize.ts` — 원본 응답 → 표준 오퍼 정규화 (경고·신뢰도 포함)
- `src/services/suppliers/adapters.ts` — 공급사별 특성(가격/취소조건/데이터 품질) 구현
- `/mcp-monitor` 페이지에서 연결상태·응답시간·성공률 실시간 확인

재현성: 게이트웨이는 `fixed` 모드에서 시드 고정 난수를 사용합니다 (`setConfig({ mode: 'fixed', seed, latencyScale })`).

## 실제 MCP 전환방법

1. `TravelMCPService`를 구현하는 원격 MCP 클라이언트 작성 (예: `RemoteTravelMCPGateway`)
2. `src/services/mcp/gateway.ts`의 `travelGateway` 싱글턴만 교체 — UI/스토어 변경 불필요
3. `MockAIProvider` 대신 서버사이드 LLM 게이트웨이를 호출하는 `AIProvider` 구현으로 교체
4. 세부 로드맵은 [docs/production-architecture.md](docs/production-architecture.md) 참고

## 보안상 주의사항

- API 키를 프런트엔드 코드·저장소에 절대 넣지 않습니다. `.env`는 커밋 금지, `.env.example`만 제공합니다.
- 이 프로토타입은 Mock API만 사용합니다. 실제 Anthropic API·공급사 API는 **서버사이드 Gateway**에서만 호출해야 합니다.
- 이벤트 로그에는 여행자 실명 등 PII를 원문으로 기록하지 않습니다(마스킹).
- 실제 서비스 보안 요건(OAuth 2.1, key vault, idempotency, 프롬프트 인젝션 방어 등)은 아키텍처 문서 참고.

## 배포 (GitHub Pages)

`main` push 시 `.github/workflows/deploy-pages.yml`이 lint → test → build → Pages 배포를 수행합니다.

- 저장소 **Settings → Pages → Source: GitHub Actions** 선택
- 배포 URL: `https://<owner>.github.io/<repository-name>/`
- base 경로는 워크플로에서 `VITE_BASE_PATH=/<repository-name>/`으로 주입되며, HashRouter를 사용해 새로고침/직접 접근 문제가 없습니다.

## 향후 백엔드 구축계획

프런트 프로토타입 → 실서비스 전환의 권장 구조(API Gateway, AI Travel Orchestrator, Booking Orchestrator(Saga), Reservation Ledger, 데이터 매핑 계층, 8단계 확장 전략)는 [docs/production-architecture.md](docs/production-architecture.md)에 정리되어 있습니다.
