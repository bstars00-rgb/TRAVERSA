# 01. 프로젝트 개요 (Project Overview)

> 본 문서는 Personal 계정 → OPS 계정 프로젝트 이전을 위한 인수인계 패키지의 일부입니다.
> 기준 시점: 최신 커밋 `e5088cd` (Direct itinerary editing) 배포 완료 상태.

## 1. 프로젝트명

**TRAVERSA AI**

- 의미: **Travel + Conversational + Universal Assistant**
- 한 줄 정의: 검색창·필터 대신 **자연어 대화**로 여행을 설계하고 예약까지 준비하는 차세대 여행 플랫폼 프로토타입.
- GitHub 저장소명: `TRAVERSA`

## 2. 프로젝트의 목적과 최종 목표

### 목적
"10년 후의 여행 예약 경험"을 미리 보여주는 대화형 여행 플랫폼 프로토타입. 기존 OTA(온라인 여행사)의 복잡한 검색·필터 UX가 아니라, 개인 여행 컨설턴트와 함께 여행을 완성하는 경험을 제공한다.

### 핵심 콘셉트
사용자가 "8월에 부모님과 일본에 5박 6일, 많이 걷지 않고 온천과 좋은 음식, 예산 항공 제외 300만 원" 처럼 자연어로 말하면, AI가 대화로 부족한 조건을 채우고 → 목적지·일정 추천 → 여러 공급사 상품 검색·비교 → 하나의 여행 일정으로 조합 → 사용자 승인 후 예약 준비 → 결제 직전 최종 확인까지 진행한다.

### 사용자 유형 (중요 결정)
**B2C — 엔드유저(일반 소비자)가 고객**이다. (이전에 명시적으로 확정됨. 이에 따라 전체 UI/UX를 소비자 친화적으로 고도화함 — 03 문서 참고.)

### 최종 목표
- 투자자·내부 경영진·공급사에게 시연 가능한 수준의 프로토타입 (달성)
- 실제 서비스 전환을 위한 아키텍처 청사진 확보 (`docs/production-architecture.md`)

### 초기 단계 제한 (설계 원칙 — 계속 유지)
- 실제 Anthropic API를 브라우저에서 호출하지 않음
- 실제 공급사 API를 연결하지 않음
- API 키를 프런트엔드 코드에 넣지 않음
- Mock AI + Mock MCP Gateway 사용
- 결제는 구현하지 않고 **결제 준비 단계까지만** 구현
- 모바일·데스크톱 모두 대응
- GitHub Pages에서 동작하는 SPA (HashRouter 사용)
- 새로고침해도 상태 유지 (localStorage)

## 3. 현재 상태

- **개발/배포 상태**: 라이브 서비스 중 (GitHub Pages)
- **라이브 URL**: https://bstars00-rgb.github.io/TRAVERSA/
- **저장소**: https://github.com/bstars00-rgb/TRAVERSA
- **최신 커밋**: `e5088cd` — "Direct itinerary editing: remove and add items from the canvas"
- **브랜치**: `main` (작업 트리 clean, 모든 변경 push 완료)
- **품질 상태**: lint 통과 / 테스트 53개 전부 통과 / 프로덕션 빌드 성공
- **12개 페이지 사양(PAGE 1~12)** 전체 구현 완료 + 사용자 요청 기반 고도화 6차례 완료

## 4. 주요 담당자

| 역할 | 담당 | 비고 |
|---|---|---|
| 프로젝트 오너 / 의사결정 | 사용자 (오마이호텔 CEO office) | 이메일: CEO.office@ohmyhotel.com |
| GitHub 계정 (현재) | `bstars00-rgb` | Personal 계정 |
| 개발 실행 | Claude Code (Opus 4.8) | 대화형으로 전 기능 구현·배포 |
| 이전 대상 계정 | **OPS 계정** | 실제 OPS 계정 GitHub org/사용자명 **확인 필요** |

> **확인 필요**: OPS 계정의 실제 GitHub 사용자명/조직명, claude.ai 팀/조직 정보, 배포에 사용할 최종 도메인.
