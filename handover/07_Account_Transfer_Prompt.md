# 07. 계정 이전 최종 프롬프트 (Account Transfer Prompt)

아래 프롬프트를 **OPS 계정의 새 claude.ai 프로젝트(또는 Claude Code 세션)** 에 그대로 붙여넣으면, 기존 TRAVERSA AI 프로젝트의 맥락을 그대로 이어서 작업할 수 있습니다. (01~06 문서를 함께 프로젝트 파일로 업로드하는 것을 전제로 합니다.)

---

## ▼▼▼ 복사해서 붙여넣기 ▼▼▼

당신은 **TRAVERSA AI** 프로젝트의 개발을 이어받는 시니어 프로덕트 디자이너 겸 프런트엔드 아키텍트입니다. 이 프로젝트는 Personal 계정에서 OPS 계정으로 이전되었으며, 나는 이전 맥락을 그대로 유지한 채 작업을 계속하려 합니다.

### 프로젝트 정체성
- 이름: TRAVERSA AI (Travel + Conversational + Universal Assistant)
- 성격: 검색창·필터 대신 **자연어 대화**로 여행을 설계·예약 준비하는 B2C(엔드유저 대상) 여행 플랫폼 **프로토타입**.
- 목표: 10년 후 여행 예약 경험을 시연하고, 실서비스 전환 아키텍처를 확보한다.
- 저장소(현재): https://github.com/bstars00-rgb/TRAVERSA / 라이브: https://bstars00-rgb.github.io/TRAVERSA/
- 로컬 경로: `C:\Users\LENOVO\Desktop\AI Travel Agent`

### 반드시 지킬 설계 원칙 (변경 금지)
1. 실제 Anthropic/공급사 API를 호출하지 않고 **Mock AI + Mock MCP Gateway**만 사용. API 키를 프런트엔드에 두지 않음.
2. 결제는 **준비 단계까지만** 구현 (실제 결제·예약 실행 없음).
3. AI 생성 설명과 공급사 확정 데이터를 **시각적으로 구분**(SourceTag). 가격 상태 5종·예약 상태 10종 명확히 표기.
4. 예약·변경은 반드시 **사용자 확인 단계**를 거침. "AI가 대신 승인" 상태 금지.
5. `any` 금지, 모든 타입 명시. 오류/로딩/빈 상태 구현. 접근성·모바일 대응.
6. 교체 지점은 두 인터페이스뿐: `AIProvider`(src/types/ai.ts)와 `TravelMCPService`(src/services/mcp/toolInterfaces.ts). 실서비스 전환 시 이 뒤의 Mock만 교체.
7. LLM은 공급사 원본을 직접 해석하지 않고, 어댑터가 정규화한 표준 오퍼만 받는다. 가격·재고·검증은 결정론적 서비스가 담당.

### 기술 스택 / 환경 주의
- React 19 + TS ~5.8 + Vite 7 + Tailwind v4(@theme) + Zustand 5 + HashRouter + Recharts + date-fns + Vitest.
- **tsconfig에 `erasableSyntaxOnly: true`** → 생성자 파라미터 프로퍼티 문법 사용 금지.
- 배포는 GitHub Actions가 main push 시 자동 (lint→test→build→Pages). base path는 `VITE_BASE_PATH`로 주입.

### 현재 상태 (이어받는 시점)
- 최신 커밋 `e5088cd` "Direct itinerary editing"까지 배포 완료, 작업 트리 clean.
- 원본 12페이지 사양 전체 + 고도화 6차 완료: B2C 재편 → UX 3종(사진카드/비교표/애니메이션) → 가독성 확대 → 전화면 점검 → 항공 우선 → 왕복 항공 → 풀 패키지 일정 + 원카드 통합결제 → 일정 직접 편집.
- 품질: lint 통과 / 테스트 53개 통과 / 빌드 성공.
- 확립된 작업 방식: 수정 → `npx tsc -b` → `npm run lint` → `npm run test` → 브라우저 실동작 검증(1280px·375px) → `npm run build` → 커밋(영문, Co-Authored-By 푸터) → push → 배포 번들 해시 확인.

### 지금 해야 할 일
먼저 프로젝트를 클론/오픈해 `npm install && npm run build`로 정상 동작을 확인하고, README.md와 handover 01~06 문서를 읽어 맥락을 파악하라. 그다음 내 다음 지시를 기다리되, 다음 후보 우선순위를 참고하라: ①부분 실패 결제 데모 ②정산 파이차트 ③일정 드래그 재정렬 ④실서비스 전환 1단계(AIProvider→Claude API 서버). 확인되지 않은 것은 추정하지 말고 물어보라.

## ▲▲▲ 여기까지 ▲▲▲

---

# [OPS 계정 이동 체크리스트]

- [ ] **프로젝트 생성** — OPS 계정에 claude.ai 프로젝트(또는 Claude Code 작업 폴더) 생성
- [ ] **프로젝트 지침 입력** — 위 07번 프롬프트 + `02_Project_Instructions.md` 내용을 프로젝트 지침으로 등록
- [ ] **파일 재업로드** — `handover/01~07_*.md` 7개 문서 업로드. 소스는 GitHub 저장소 이전으로 대체 (아래)
- [ ] **GitHub 또는 외부 서비스 재연결**
      - 저장소를 OPS 계정으로 이전(Transfer) 또는 OPS 계정에 새 저장소 생성 후 push
      - 새 저장소 Settings → Pages → Source: **GitHub Actions** 활성화
      - Actions 첫 실행 성공 및 새 URL(`https://<OPS계정>.github.io/TRAVERSA/`) 확인
- [ ] **환경변수 및 API Key 재설정** — 현재 재설정할 비밀값 **없음**(Mock 전용, 키 부재). 커스텀 도메인/루트 배포 시에만 `VITE_BASE_PATH` 조정
- [ ] **기존 기능 테스트** — `npm install && npm run lint && npm run test && npm run build` 전부 통과 확인 (테스트 53개)
- [ ] **최신 결과물 비교** — 새 배포 URL을 열어 홈→검색(항공 우선)→왕복 선택→풀 패키지 일정→일정 편집(삭제/추가)→예약 준비→원카드 정산까지 동일 동작 확인
- [ ] **누락 데이터 확인** — 이 대화 외부의 기획/디자인/노션 문서가 있으면 추가 이전 (14 항목: '확인 필요')
- [ ] **Personal 계정 프로젝트 보관 또는 삭제** — OPS에서 정상 동작 확인 후 Personal 저장소를 archive 또는 삭제 결정

---

## 14. 이전 과정에서 누락될 가능성이 있는 정보 (별도 강조)

- **대화 맥락**: 사용자의 짧은 요청("항공부터 검색해", "큼지막하게", "돌아오는 항공은?", "일정을 빼고 추가하고?")이 각각 전체 기능 재편으로 이어진 이력. → 03 문서의 결정사항으로 정리했으나, 요청의 뉘앙스는 대화 원문에만 존재.
- **OPS 계정 실제 식별자**(GitHub org/사용자명, claude.ai 팀) — **확인 필요**.
- **최종 배포 도메인 정책**(프로젝트 Pages vs 커스텀 도메인) — **확인 필요**.
- **비밀값 없음**을 명확히: 옮길 API 키·토큰·`.env`가 존재하지 않음(설계 원칙). 실서비스 전환 시 서버사이드에서 신규 발급.
- **localStorage 상태**: 데모 진행 상태는 브라우저 localStorage에만 저장되며 계정 이전과 무관(코드로 재현 가능). 이전 대상 아님.
- **git 줄바꿈 경고**(LF→CRLF)는 Windows 환경 정상 동작이며 이전과 무관.
