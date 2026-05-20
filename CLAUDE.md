# EZStay Admin - CLAUDE.md

## 프로젝트
EZStay 운영 관리 웹. React 18 + TypeScript + Vite + Tailwind CSS.
개발 서버: http://localhost:3002 | 백엔드: http://localhost:8080

## ⚡ 항상 적용되는 규칙
- 타입은 반드시 `src/types/index.ts`에 정의
- 공통 UI는 `src/components/ui/` 재사용 (Button, Badge, Card, Table, Modal, Input)
- 새 페이지 추가 시 App.tsx 라우트 + Sidebar 메뉴 동시 업데이트
- 기능 구현 후  TypeScript 타입 검사 실행 npx tsc --noEmit

---

## 📂 스킬 자동 매칭 규칙

### architecture-skill.md 로드 조건
**항상 로드**: 새 페이지/컴포넌트 추가 시
**키워드**: 구조, 라우팅, 컴포넌트, 레이아웃, 사이드바, 페이지 추가
**파일 경로**: `src/pages/`, `src/components/`, `src/App.tsx`

### domain-skill.md 로드 조건
**키워드**: 유저, 매물, 예약, 결제, 정산, 문의, 알림, 상태, 승인, 반려, 심사
**의도**: 상태 표시 UI, 관리 기능 구현, API 연동
**파일 경로**: `src/pages/users/`, `src/pages/properties/`, `src/pages/reservations/`

---

## 주요 타입 위치
`src/types/index.ts` — User, Property, Reservation, Payment, Settlement, Inquiry, Notification
