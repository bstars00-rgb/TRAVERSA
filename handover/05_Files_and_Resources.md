# 05. 파일과 리소스 (Files and Resources)

## 1. 외부 링크 및 참고 자료

| 항목 | URL / 위치 |
|---|---|
| 라이브 사이트 | https://bstars00-rgb.github.io/TRAVERSA/ |
| GitHub 저장소 (현재, Personal) | https://github.com/bstars00-rgb/TRAVERSA |
| GitHub Actions (배포 상태) | https://github.com/bstars00-rgb/TRAVERSA/actions |
| Pages 설정 | 저장소 Settings → Pages → Source: **GitHub Actions** |
| 로컬 작업 경로 | `C:\Users\LENOVO\Desktop\AI Travel Agent` |

## 2. 관련 파일 목록 및 용도

### 루트 설정
| 파일 | 용도 |
|---|---|
| `package.json` / `package-lock.json` | 의존성·스크립트 |
| `vite.config.ts` | Vite 설정 (base path, PORT, Vitest, 청크 분할) |
| `tsconfig*.json` | TS 설정 3종 (`erasableSyntaxOnly` 주의) |
| `eslint.config.js` | ESLint (no-explicit-any: error) |
| `index.html` | SPA 진입점 |
| `.env.example` | 환경변수 예시 (VITE_BASE_PATH만) |
| `.gitignore` | node_modules, dist, .env 등 |
| `README.md` | 제품 비전·기능·아키텍처·실행·데모·MCP 구조·보안·백엔드 계획 |

### 문서
| 파일 | 용도 |
|---|---|
| `docs/production-architecture.md` | **실서비스 전환 아키텍처** (프로토타입 코드 미변경 원칙). MoR 통합결제·Saga·데이터계층·보안·8단계 로드맵·데모 시나리오·기술 리스크·사업 가설 |
| `.github/workflows/deploy-pages.yml` | GitHub Pages 자동 배포 |
| `handover/01~07_*.md` | **본 이전 패키지 (신규)** |

### src 주요 구조 (총 파일 80개, 테스트 8개)
| 폴더 | 핵심 내용 |
|---|---|
| `src/app/` | App.tsx(HashRouter 라우팅), AppLayout.tsx(헤더·내비) |
| `src/components/ai/` | ConversationPanel, TaskProgress, TripIntentCard, AgentActivityStrip |
| `src/components/search/` | FlightPicker(왕복 선택), RecommendationCard, RecommendationCompareTable |
| `src/components/itinerary/` | JourneyCanvas, ItineraryItemCard(삭제 버튼), **AddItemDrawer(추가)**, DiffPanel, TripIntelligencePanel |
| `src/components/booking/` | BookingItemCard, TravelerForm, RecheckSection, **PaymentMethodSection(원카드 정산)** |
| `src/components/shared/` | primitives/feedback/controls (공통 컴포넌트 전체) |
| `src/pages/` | 9개 라우트 페이지 |
| `src/services/ai/` | intentParser, mockAIProvider, scoring, searchOrchestrator |
| `src/services/mcp/` | toolInterfaces(표준 24종), gateway(Mock 싱글턴) |
| `src/services/suppliers/` | normalize(정규화), adapters(공급사별) |
| `src/services/itinerary/` | generator, validator, budget, risk, commands(자연어 수정) |
| `src/stores/` | 8개 Zustand 스토어 + storage(persist) |
| `src/types/` | 도메인 타입 전체 |
| `src/data/` | Mock 시드 데이터 |
| `src/utils/` | currency, format, id, seededRandom |
| `src/mocks/` | demoScripts (3개 시나리오 대본) |
| `src/test/` | setup.ts (Vitest) |

### 테스트 파일 (8개, 53 케이스)
`utils/currency.test.ts`, `services/itinerary/budget.test.ts`, `services/itinerary/validator.test.ts`, `services/itinerary/commands.test.ts`, `services/ai/intentParser.test.ts`, `services/ai/scoring.test.ts`, `services/suppliers/normalize.test.ts`, `services/flow.test.ts`(주요 흐름+오류 시나리오)

## 3. 새 계정(OPS)에 다시 업로드/이전해야 할 것

- **전체 소스 코드**: GitHub 저장소를 OPS 계정으로 옮기는 방식 권장 (아래 06/07 문서 참고). 코드 자체에 비밀정보 없음.
- **`handover/` 폴더 7개 문서**: OPS 계정 claude.ai 프로젝트 지침/파일로 업로드.
- **재업로드 불필요**: `node_modules`, `dist`, `.env`(존재하지 않음). `npm install`로 복원.
- **비밀정보**: 현재 **없음**. API 키·토큰·`.env` 파일 자체가 없으므로 옮길 비밀값 없음.

> **확인 필요**: 이 대화 세션 외부에 별도 기획 문서/디자인 파일/노션 등이 있는지 (첨부는 원본 12페이지 프롬프트뿐). 있다면 목록에 추가 필요.
