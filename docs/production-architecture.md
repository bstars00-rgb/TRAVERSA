# TRAVERSA AI — 실제 서비스 전환 아키텍처

> 본 문서는 프로토타입 코드를 변경하지 않고, 실서비스 전환 시 권장 구조와 로드맵을 정의한다.

## 1. 실제 서비스 권장 구조

```
Web / Mobile Client
  → API Gateway                (인증, rate limit, 요청 검증)
  → Identity Service           (OAuth 2.1, 세션, 동의 관리)
  → AI Travel Orchestrator     (LLM 기반 의도 해석·계획·설명)
  → Travel MCP Gateway         (표준 도구 계층, allowlist, 감사)
  → Supplier Adapter Layer     (REST/XML/SOAP/GraphQL → 표준 모델 정규화)
  → Supplier APIs              (호텔/항공/액티비티/교통)
  → Booking Orchestrator       (Saga 기반 예약 트랜잭션)
  → Payment Orchestrator       (PG/3DS, 토큰화)
  → Reservation Ledger         (예약 원장, 불변 기록)
  → Notification Service       (알림, 승인 요청)
  → Monitoring and Audit       (도구 호출 감사, SLA, 이상 탐지)
```

## 2. AI Travel Orchestrator 역할

**담당:**

- 사용자 의도 해석 (`TripIntent` 생성·갱신)
- 필요한 MCP 도구 선택과 검색계획 수립
- 공급사 정규화 결과 요약·후보 비교
- 여행 일정 최적화 제안, 설명 생성

**담당하지 않음 (결정론적 서비스가 처리):**

| 업무 | 담당 서비스 |
|---|---|
| 가격 계산의 최종 확정 | Pricing Service (원장 기반) |
| 재고 확정 | Booking Orchestrator + 공급사 hold API |
| 세금 계산의 원장 처리 | Tax/Ledger Service |
| 예약번호 생성 | Reservation Ledger |
| 결제 승인 | Payment Orchestrator |
| 취소수수료 확정·환불 실행 | Refund Service |

LLM 산출물은 항상 "제안"이며, 금액·재고·정책의 사실 데이터는 정규화 파이프라인의 스냅샷을 근거로 한다. 프로토타입의 `validator/budget/scoring` 분리가 이 원칙의 축소판이다.

## 3. Booking Orchestrator (Saga 패턴)

```
1. 호텔 hold            (보상: hold 해제)
2. 항공 hold            (보상: 좌석 release)
3. 액티비티 가용성 확인
4. 결제 승인 (authorize)  (보상: void/refund)
5. 공급사별 예약 실행
6. 성공 항목 확정 (capture)
7. 일부 실패 시 보상 트랜잭션 실행 + 사용자에게 부분 실패 안내
8. 최종 결과 통지 (Notification)
```

- 각 단계는 **idempotency key**를 가지며 재시도 안전해야 한다.
- 부분 실패 시 자동 재예약은 하지 않는다 — 대안과 영향을 제시하고 사용자 승인을 받는다.

### 3-1. 통합 결제 — 카드 한 장, 공급사 전체 정산 (Single Card, Multi-Supplier Settlement)

고객은 카드 한 장으로 1회만 결제하고, 공급사별 분배는 플랫폼이 처리한다.

```
고객 카드 1회 승인 (PG 토큰화, 3DS)
  → TRAVERSA = Merchant of Record (대표 가맹점)
  → Payment Orchestrator
       ├─ 항공: BSP/ARC 정산 또는 가상카드(VCC) 발급 결제
       ├─ 호텔: 공급사 크레딧 라인 정산 또는 VCC
       ├─ 액티비티/교통: 정산 주기별 배치 정산
       └─ 부분 실패: 해당 공급사 몫만 자동 부분환불 (Saga 보상)
  → Reservation Ledger에 승인·정산·환불 원장 기록
```

핵심 설계:

- **고객 관점**: 결제수단 등록 1회 → 이후 모든 여행 상품이 원클릭. 카드 정보는 PG 토큰만 보관 (PCI-DSS 범위 최소화).
- **공급사 관점**: 플랫폼과의 정산 계약(B2B 크레딧/VCC/배치 정산) — 고객 카드가 공급사에 직접 노출되지 않는다.
- **가상카드(VCC)**: 예약 건별 1회용 카드 발급으로 공급사별 결제 격리 — 분쟁·환불 추적이 예약 단위로 정확해진다.
- **부분 실패 UX**: 호텔 성공 + 액티비티 실패 시, 실패 몫만 즉시 부분환불하고 대체 상품을 제안한다. 전체 취소를 강요하지 않는다.
- **수수료 모델**: MoR 마진 또는 공급사 커미션 — 원장(Ledger)에서 정산 리포트 자동 생성.

## 4. 필수 데이터 계층

| 계층 | 목적 |
|---|---|
| Canonical Hotel ID / Canonical Room ID | 공급사 간 동일 호텔·객실 식별 (프로토타입: `canonicalId`) |
| Supplier Hotel/Room Mapping | 공급사 코드 ↔ canonical 매핑, 신뢰도 점수 포함 |
| Rate Plan Mapping | 조식/결제시점/취소조건 표준화 |
| Cancellation Policy Normalization | 자유 텍스트 → 구조화 정책, 불일치 플래그 |
| Price Snapshot / Availability Snapshot | 시점 기록 — 가격 변경 분쟁·재확인 근거 |
| Booking Ledger | 예약 상태 전이의 불변 기록 |
| Supplier Reliability Score | 응답속도·오류율·데이터 품질 누적 점수 |
| Tool Invocation Audit | 모든 MCP 도구 호출의 입력 요약·결과·지연 기록 |

## 5. 핵심 보안

- OAuth 2.1 또는 공급사별 인증 + **API key vault** (프런트에 키 없음)
- 사용자 동의 관리 (Travel Memory는 opt-in, 항목별 삭제권)
- 역할 기반 접근제어(RBAC), PII 필드 암호화
- 결제정보 비저장 또는 PG 토큰화
- MCP 도구 **allowlist** + 도구 입력 schema validation
- 예약 작업 idempotency key
- 사용자 승인 증적 (승인 시각·화면 스냅샷 — 프로토타입의 `UserConfirmation` 확장)
- 프롬프트 인젝션 방어: 공급사 응답·사용자 업로드 문서를 신뢰 경계 밖 데이터로 취급, 도구 호출 전 정책 엔진 통과
- 공급사 응답 검증 (스키마·범위·통화 단위) 후에만 LLM 컨텍스트에 주입
- 전 구간 감사 로그

## 6. 확장 전략 (8단계)

| 단계 | 내용 | 프로토타입 대비 |
|---|---|---|
| 1 | Mock MCP + 3개 여행 시나리오 | ✅ 현재 완료 |
| 2 | 자체 ELLIS 데이터베이스 검색 MCP 연결 | `TravelMCPService` 구현체 교체 |
| 3 | 호텔 공급사 1개 읽기 전용 연결 | 어댑터 1종 실연동 |
| 4 | 요금 재확인(recheck) 기능 연결 | `recheck_hotel_rate` 실구현 |
| 5 | 테스트 예약 / 예약 준비 API 연결 | `prepare_*_booking` 실구현 |
| 6 | 실제 예약과 취소 연결 | Booking Orchestrator + Ledger 필요 |
| 7 | 항공·투어·교통 확장 | 어댑터 수평 확장 |
| 8 | 여행 중 실시간 관리 에이전트 | Post-booking Agent 실서비스화 |

## 7. 데모 시나리오

### 3분 데모

1. (30초) 홈에서 한 문장 입력: "8월에 부모님과 일본 온천 5박 6일, 항공 제외 300만 원" → 의도 카드가 실시간 채워지는 것 강조
2. (60초) AI 인터뷰 2문답 → 검색 실행 — 공급사 3곳 병렬 검색의 작업별 성공/지연/실패 상태 표시
3. (60초) Best Match/Value/Premium 비교 — 동일 객실의 공급사별 가격, "왜 이 상품인가요?" 점수 근거, 위험 경고(세금 불명확·매핑 신뢰도) 강조
4. (30초) 호텔 선택 → 일정 자동 생성 → "둘째 날 여유롭게" 자연어 수정 → Diff 승인

### 10분 상세 데모

3분 데모 이후:

5. Trip Intelligence — 확정가/예상가 분리, 남은 예산, 일정 충돌, 리스크
6. 예약 준비 — 가격 재확인에서 가격 인상 발생 → 사용자 선택지(계속/제외) 시연
7. Human-in-the-loop — 영문명 확정, 취소조건 동의 체크리스트, 승인 증적
8. "예약 및 결제 단계로 이동" → 프로토타입 안내 모달 (Payment Orchestrator 구조 설명)
9. /mcp-monitor — 공급사 헬스·도구 호출 감사
10. /future-journey — 모니터링 승인 흐름, 디지털 트윈, 멀티에이전트
11. /memory — 여행 기억 항목별 삭제/비활성화
12. /settings — Demo Reset 후 싱가포르 시나리오 원클릭 재생

## 8. 구현 현황 평가

**현재 구현된 기능 (동작):**

- 자연어 인터뷰 → TripIntent → 검색 → 비교 → 일정 → Diff 수정 → 예약 준비 전 과정
- 표준 MCP 도구 인터페이스, 공급사 정규화, 헬스 모니터링, 이벤트 로그, 상태 지속성
- 53개 자동화 테스트 (단위 + 흐름 + 오류 시나리오)

**Mock인 기능:**

- AI 파서(규칙 기반), 공급사 데이터·지연·실패, 가격 재확인 결과, 모니터링 알림, 멀티에이전트 상태, 지도

**실서비스 전환에 필요한 것:**

- 서버사이드 LLM 게이트웨이(Claude API), 실공급사 어댑터, canonical 매핑 데이터베이스,
  Booking/Payment Orchestrator, Reservation Ledger, 인증·동의·감사 인프라

**예상 기술 리스크:**

1. 공급사 간 호텔/객실 매핑 정확도 (오예약의 최대 원인)
2. 취소정책 자유 텍스트의 구조화 신뢰도
3. 가격 스냅샷과 실제 예약 시점 가격의 괴리 처리
4. LLM 지연시간과 검색 병렬화의 UX 균형
5. 프롬프트 인젝션(공급사 응답 경유) 방어

**사업적으로 검증해야 할 가설:**

1. 사용자가 필터 UI보다 대화형 설계를 실제로 더 신뢰하고 완주하는가 (전환율)
2. "3전략 압축"이 수백 개 리스트보다 높은 예약 전환을 만드는가
3. 위험 경고 노출이 신뢰를 높이는가, 이탈을 만드는가
4. 공급사가 B2B 계약으로 이 채널에 재고·요금을 제공할 유인이 있는가
5. Human-in-the-loop 승인 단계가 이탈 지점이 되지 않는 최소 마찰 수준
