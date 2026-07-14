# 02. 프로젝트 기본 지침 (Project Instructions)

## 1. 프로젝트 기본 지침 (개발 원칙 — 반드시 유지)

원본 12페이지 사양서(PAGE 1~12)에서 정의된 개발 원칙. **임의로 변경하지 말 것.**

- 한 컴포넌트가 지나치게 커지지 않도록 분리한다.
- 모든 데이터 타입을 TypeScript `interface` 또는 `type`으로 정의한다.
- `any` 사용을 피한다. (ESLint 규칙 `@typescript-eslint/no-explicit-any: error`로 강제)
- UI에서 **가격 / 재고 / 예약 상태를 명확히 구분**한다.
- **AI가 생성한 설명과 공급사에서 받은 확정 데이터를 시각적으로 구분**한다. (SourceTag 컴포넌트)
- 예약·변경 작업은 반드시 **사용자 확인 단계**를 거친다. ("AI가 대신 승인했다" 상태는 만들지 않는다.)
- 오류·로딩·빈 상태를 모두 구현한다.
- 접근성을 고려한다. (aria 속성, 키보드 포커스, prefers-reduced-motion)
- 과도한 그라데이션이나 일반적인 AI 챗봇 디자인을 피한다.

## 2. 아키텍처 원칙 (교체 지점)

실제 서비스 전환 시 이 두 인터페이스 뒤의 Mock 구현만 교체하면 된다:

1. **`AIProvider`** (`src/types/ai.ts`) — 현재 `MockAIProvider`(규칙 기반)가 구현. 실제 LLM(Claude API) 게이트웨이로 교체.
2. **`TravelMCPService`** (`src/services/mcp/toolInterfaces.ts`) — 현재 `MockTravelMCPGateway` 싱글턴(`travelGateway`)이 구현. 원격 MCP 서버 클라이언트로 교체.

핵심 규칙:
- **LLM은 공급사 원본 응답을 직접 해석하지 않는다.** Supplier Adapter가 표준 오퍼로 정규화한 뒤 전달한다.
- **가격·재고·예약 확정은 결정론적 서비스**(validator, budget, scoring)가 계산한다.
- 모든 사용자 확정은 `UserConfirmation` 증적으로 기록한다.

## 3. 코드/환경 주의사항 (기술적 함정)

- **`tsconfig`에 `erasableSyntaxOnly: true`가 켜져 있음** → 생성자 파라미터 프로퍼티(`constructor(private x)`) 문법 사용 불가. 필드를 별도 선언 후 대입할 것.
- Tailwind CSS v4 (`@tailwindcss/vite`, `@theme` 토큰 방식). v3 문법과 다름.
- Vite `base` 경로는 `VITE_BASE_PATH` 환경변수로 주입 (GitHub Pages 프로젝트 배포 시 `/TRAVERSA/`).
- 개발 서버 포트: `PORT` 환경변수 우선, 기본 5173 (`vite.config.ts`).
- 통화 표기: KRW/JPY/VND는 소수점 없이, 그 외 2자리.
- 한국어 줄바꿈: 전역 `word-break: keep-all` + 제목 `text-wrap: balance` + 본문 `text-wrap: pretty` (index.css).

## 4. 답변 및 작업 기준 (사용자와의 협업 방식)

이전 세션에서 확립된 작업 패턴:

- **작업 단위마다: 코드 수정 → 타입체크(`npx tsc -b`) → lint → test → 브라우저 실동작 검증 → 빌드 → 커밋 → push → 배포 완료 확인** 순으로 진행한다.
- 커밋 메시지는 영문, 본문에 변경 요약. 커밋 푸터: `Co-Authored-By: Claude <noreply@anthropic.com>`.
- 배포 후 반드시 라이브 사이트의 번들 해시가 로컬 빌드와 일치하는지 확인한다.
- 브라우저 검증 시 데스크톱(1280×900)·모바일(375px) 양쪽을 본다.
- 사용자는 한국어로 소통. 간결한 요청("항공부터 검색해", "큼지막하게", "다른곳도 다 점검")에도 의도를 파악해 전체 흐름을 반영한다.
- 확인되지 않은 것은 추정하지 않고 명시한다.

## 5. 반복적으로 사용하는 프롬프트 / 명령

```bash
# 개발 서버
npm run dev

# 품질 게이트 (커밋 전 항상)
npx tsc -b        # 타입체크
npm run lint      # ESLint
npm run test      # Vitest (53개)
npm run build     # 프로덕션 빌드 (tsc -b && vite build)

# 배포는 main push 시 GitHub Actions가 자동 수행
git add -A && git commit -m "..." && git push
```

배포 상태 확인 (폴링):
```bash
curl -s "https://api.github.com/repos/<OWNER>/TRAVERSA/actions/runs?per_page=1"
curl -s "https://<OWNER>.github.io/TRAVERSA/" | grep -oE 'assets/index-[a-zA-Z0-9_-]+\.js'
```
