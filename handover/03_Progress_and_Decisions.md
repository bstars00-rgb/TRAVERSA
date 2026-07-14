# 03. 진행 내용과 의사결정 (Progress and Decisions)

## 1. 완료 업무

### A. 초기 구축 — 12페이지 사양서 전체 (커밋 `801e726`)
원본 프롬프트 PAGE 1~12를 한 번에 구현:

| 영역 | 내용 |
|---|---|
| PAGE 1 | 프로젝트 초기화 (Vite+React19+TS+Tailwind v4), HashRouter, 3단 레이아웃, 디렉토리 구조 |
| PAGE 2 | 디자인 시스템 (Button/Badge/StatusBadge/PriceDisplay/SupplierBadge/ConfidenceIndicator/Skeleton/EmptyState/Modal/Drawer/Toast/ConfirmDialog/SegmentedControl/ProgressSteps/SourceTag), `/design-system` 페이지 |
| PAGE 3 | 온보딩·AI 인터뷰, TripIntent 규칙 기반 파서, 3개 시나리오, `/new-trip` |
| PAGE 4 | Mock Travel MCP Gateway, 표준 MCP 도구 24종, 공급사 6곳 어댑터(REST/XML/SOAP/GraphQL 정규화), 지연·실패 시뮬레이션, 시드 고정 재현 모드, `/mcp-monitor` |
| PAGE 5 | 대화형 검색, 작업별 성공/실패/지연 표시, Best Match/Best Value/Premium 3전략, 공급사 가격 비교, 위험 경고 |
| PAGE 6 | Journey Canvas 날짜별 타임라인, 자연어 일정 수정 + Diff 승인 UI, ItineraryValidator |
| PAGE 7 | 예약 준비 7단계, 가격 재확인(동일/인하/인상/품절), Human-in-the-loop 확인 체크리스트, 데모 결제 모달 |
| PAGE 8 | Travel Memory 관리, 자율 모니터링(승인 필수), 성향 디지털 트윈(Recharts 레이더), 멀티에이전트, 예약 후 여정, `/future-journey` |
| PAGE 9 | 전 도메인 타입 정의, Zustand 스토어 8개, TripEvent 이벤트 로그(PII 마스킹), `/activity-log` |
| PAGE 10 | 단위·흐름·오류 시나리오 테스트 53개, lint/test/build green |
| PAGE 11 | GitHub Actions 배포 워크플로, base path 처리 |
| PAGE 12 | `docs/production-architecture.md` 실서비스 전환 아키텍처 문서 |

### B. B2C 고도화 (커밋 `5accaec`)
- 가격/예약 상태·출처 태그를 소비자 친화 한글로 (Estimated→예상 금액, Live Supplier Data→실시간 확인 등)
- 홈 랜딩 강화 (신뢰 포인트, 이용 방법 3단계, 인기 여행지 카드)
- 추천 카드 OTA급 비주얼 (호텔 톤 헤더, 평점, 1박 요금)
- Journey Canvas 히어로 배너 + D-day 카운트다운
- 대화 웰컴 카드, AI 아바타, 여행조건 파악 진행도 게이지
- 주 메뉴(소비자용 4개) / 보조 메뉴(운영자용 4개) 분리
- 예약 준비 안심 배너, 모바일 탭 알림 점

### C. 순차 UX 업그레이드 (커밋 `98d8dff`)
- ① 일정 카드 사진형 썸네일 (타입별 톤, 호텔은 호텔 고유 톤)
- ② 추천 비교표 뷰 (카드/표 토글, 항목별 나란히 비교, 최저가 강조)
- ③ 온보딩 애니메이션 (스태거 등장, 플레이스홀더 순환, reduced-motion 대응)

### D. 가독성 개선 (커밋 `df6ec65`, `4003239`)
- 루트 폰트 17px, 초소형 픽셀 폰트(9~13px) 표준 스케일 일괄 상향
- 버튼/배지/헤더/히어로 확대
- 한국어 줄바꿈 수정: `word-break: keep-all`(어절 단위), `text-wrap: balance`(제목 고아 방지)

### E. 전 화면 점검 (커밋 `f61ea06`)
- 9개 라우트 × 375px/1280px 오버플로·소형폰트·고아줄 자동 감사
- `text-wrap: pretty`(본문 고아 어절 방지), TaskProgress 잘림 해결

### F. 항공 우선 흐름 (커밋 `0e8f6b7`)
- 고객 실제 예약 순서 반영: 검색 파이프라인에서 **항공을 호텔보다 먼저** 검색
- 1단계 FlightPicker(선택 가능 카드, 최저가 자동 선택), 2단계 호텔 선택으로 일정 완성

### G. 왕복 항공 (커밋 `773e6e0`)
- 오는 편(귀국) 항공 시드 데이터 추가 (모든 목적지)
- `FlightOffer.direction`, 가는 편/오는 편 2그룹 선택, 방향별 최저가 자동 선택
- 마지막 날 일정에 선택한 귀국편 + 공항 이동(출발 3.5h 전) 반영

### H. 풀 패키지 일정 + 통합 원카드 결제 (커밋 `07e78ab`)
- 검색된 **모든 어트랙션/티켓/체험**을 일정에 배분 (여유=하루1개, 알차게=하루2개)
- PaymentMethodSection: 카드 한 장 목업(프로토타입은 입력 비활성) + 공급사별 정산 분배 미리보기
- 결제 1회 → N개 공급사 자동 정산, 부분 실패 자동 부분환불 안내
- `production-architecture.md`에 Single Card Multi-Supplier Settlement(MoR, PG토큰화, VCC, Saga) 설계 추가

### I. 일정 직접 편집 (커밋 `e5088cd`, 최신)
- 카드 hover 시 🗑 삭제 버튼 (항공·체크인/아웃 제외)
- 각 날짜 하단 "+ Day N에 일정 추가" → AddItemDrawer (검색된 티켓 담기 / 자유 일정 입력)
- 뺀 상품은 추가 드로어에 다시 노출되어 되돌리기 가능
- `useItineraryStore`에 `removeItem`/`addItem` 액션

## 2. 진행 중 업무
- **없음.** 마지막 요청("일정 편집 기능")까지 완료·배포됨. 작업 트리 clean.

## 3. 주요 결정사항
1. **B2C 확정** — 엔드유저가 고객. UI/UX 전반을 소비자 친화적으로 재편.
2. **항공 우선** — 고객은 항공부터 검색하므로 검색·선택 순서를 항공 → 호텔로.
3. **왕복 필수** — 가는 편만이 아니라 오는 편(귀국)도 선택.
4. **풀 패키지** — 항공·숙소뿐 아니라 차량·티켓·어트랙션 등 모든 상품을 한 번에 일정화.
5. **원카드 통합 결제** — 카드 한 장으로 모든 공급사 결제(Merchant of Record 구조), 프로토타입은 준비 단계까지만.
6. **가독성 우선** — 전반적으로 큼지막한 스케일, 한국어 어절 단위 줄바꿈.
7. **HashRouter + GitHub Pages** — 정적 호스팅 새로고침 문제 회피.

## 4. 변경 이력 (git, 최신 → 과거)
```
e5088cd Direct itinerary editing: remove and add items from the canvas
07e78ab Full-package itinerary and one-card multi-supplier payment design
773e6e0 Round-trip flights: return flight selection and last-day itinerary
0e8f6b7 Flight-first search flow matching real booking behavior
f61ea06 Site-wide readability audit fixes
4003239 Fix awkward Korean line breaks
df6ec65 Scale up UI for readability
98d8dff Sequential UX upgrades: photo-style cards, compare table, onboarding animation
5accaec B2C consumer-friendly UI/UX overhaul
801e726 TRAVERSA AI — conversational travel platform prototype (초기 12페이지 전체)
```
