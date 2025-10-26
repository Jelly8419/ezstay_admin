# EZstay Admin - 관리자 대시보드

EZstay 숙박 플랫폼 관리자 시스템입니다.
React + TypeScript + Tailwind CSS로 제작되었습니다.

## 🚀 시작하기

### 1. 의존성 설치
```bash
npm install
```

### 2. 개발 서버 실행
```bash
npm run dev
```

개발 서버가 `http://localhost:5173`에서 실행됩니다.

### 3. 빌드
```bash
npm run build
```

## 📁 프로젝트 구조

```
ezstay_admin/
├── src/
│   ├── components/          # 공통 컴포넌트
│   │   ├── layout/         # 레이아웃 (Sidebar, Header)
│   │   ├── ui/             # UI 컴포넌트 (Button, Table 등)
│   │   └── common/         # 공통 기능 (Search, Pagination)
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── users/          # 유저 관리
│   │   └── properties/     # 매물 관리
│   ├── types/              # TypeScript 타입
│   └── App.tsx            # 메인 앱
├── package.json
└── README.md
```

## 🎯 구현된 기능

### ✅ 완료
- [x] 프로젝트 초기 설정
- [x] 공통 레이아웃 (Sidebar, Header)
- [x] 공통 UI 컴포넌트 (Button, Table, Card, Badge, Modal, Input)
- [x] 유저 관리 목록 페이지
- [x] 유저 상세 페이지
- [x] 매물 심사 페이지

### 🔄 진행 예정
- [ ] 매물 관리 페이지
- [ ] 예약 관리 페이지
- [ ] 결제 관리 페이지
- [ ] 정산 관리 페이지
- [ ] 고객센터 페이지
- [ ] 알림 서비스 페이지

## 🛠️ 기술 스택

- **React 18** - UI 라이브러리
- **TypeScript** - 타입 안정성
- **Vite** - 빌드 도구
- **React Router v6** - 라우팅
- **Tailwind CSS** - 스타일링
- **Lucide React** - 아이콘

## 📝 주요 페이지

### 유저 관리
- **목록**: 검색, 필터링, 상태별 조회
- **상세**: 기본정보, 연락처, 계정활동, 통계, 상태변경

### 매물 심사
- **목록**: 심사 대기 매물 조회
- **승인/반려**: 매물 심사 처리 및 반려 사유 입력

## 🎨 디자인 시스템

### 색상
- Primary: Blue (#0ea5e9)
- Success: Green
- Warning: Yellow
- Danger: Red
- Neutral: Gray

### 컴포넌트
모든 UI 컴포넌트는 재사용 가능하도록 설계되었습니다.
