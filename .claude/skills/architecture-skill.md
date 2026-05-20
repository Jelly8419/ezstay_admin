# 프로젝트 구조 & 아키텍처 - EZStay Admin

## 기술 스택
React 18 + TypeScript + Vite + Tailwind CSS / React Router v6 / Lucide React
- 개발 서버: http://localhost:3002
- 백엔드 API: http://localhost:8080

## 컴포넌트 구조
```
src/
├── components/
│   ├── ui/         # Button, Badge, Card, Table, Modal, Input
│   ├── layout/     # AdminLayout, Sidebar, Header
│   └── common/     # SearchBar, Pagination
├── pages/
│   ├── users/      # UserList, UserDetail
│   └── properties/ # PropertyReview
└── types/index.ts  # 모든 타입 정의
```

## 라우팅 구조
```
/admin
├── /users              # 유저 목록 / /:id 상세
├── /properties         # 매물 목록 / /review 심사 / /:id 상세
├── /reservations       # 예약 목록 / /:id 상세
├── /payments           # 결제 내역 / /refunds 환불
├── /settlements        # 정산 목록 / /pending 대기
├── /inquiries          # 문의 목록 / /:id 상세/답변
└── /notifications      # 발송 내역 / /templates 템플릿
```

## 새 페이지 추가 시
1. `src/pages/[도메인]/` 디렉토리에 컴포넌트 작성
2. `src/App.tsx`에 라우트 추가
3. `src/components/layout/Sidebar.tsx`에 메뉴 추가
4. `src/types/index.ts`에 타입 추가

## 관리자 권한 레벨
```typescript
role: 'super_admin' | 'admin' | 'cs_admin'

// UI 조건부 렌더링 기준
super_admin: 모든 기능 접근
admin: 대부분의 관리 기능
cs_admin: 문의 답변, 조회만 가능
```

## 개발 명령어
```bash
npm install && npm run dev   # 개발 서버
npm run build               # 빌드
npm run lint                # 린트
```
