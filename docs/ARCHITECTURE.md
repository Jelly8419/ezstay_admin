# EZstay Admin Dashboard - 현재 구현 아키텍처

> 📅 **작성일**: 2025-10-27
> 📌 **버전**: v1.0
> 🔧 **상태**: Phase 1 완료, Phase 2 진행중

---

## 📋 목차

1. [프로젝트 개요](#프로젝트-개요)
2. [기술 스택](#기술-스택)
3. [프로젝트 구조](#프로젝트-구조)
4. [데이터 모델](#데이터-모델)
5. [구현된 기능](#구현된-기능)
6. [라우팅 구조](#라우팅-구조)
7. [컴포넌트 아키텍처](#컴포넌트-아키텍처)
8. [향후 계획](#향후-계획)

---

## 🎯 프로젝트 개요

**EZstay Admin Dashboard**는 숙박 플랫폼의 관리자를 위한 웹 기반 관리 시스템입니다.

### 핵심 목표
- ✅ 유저 및 매물 통합 관리
- ✅ 예약 및 결제 모니터링
- ✅ 정산 및 고객센터 운영
- ✅ 실시간 대시보드 제공

### 접속 정보
- **개발 서버**: http://localhost:5173
- **빌드 도구**: Vite
- **프레임워크**: React 18 + TypeScript

---

## 🛠️ 기술 스택

### Frontend Core
| 기술 | 버전 | 용도 |
|------|------|------|
| **React** | 18.2.0 | UI 프레임워크 |
| **TypeScript** | 5.2.2 | 타입 안전성 |
| **Vite** | 5.0.8 | 빌드 도구 |
| **React Router** | 6.20.0 | 라우팅 |

### Styling & UI
| 기술 | 버전 | 용도 |
|------|------|------|
| **Tailwind CSS** | 3.3.6 | 유틸리티 CSS |
| **Lucide React** | 0.294.0 | 아이콘 라이브러리 |

### Development Tools
- **ESLint**: 코드 품질 관리
- **TypeScript ESLint**: TS 린트 규칙
- **PostCSS**: CSS 후처리
- **Autoprefixer**: 브라우저 호환성

---

## 📁 프로젝트 구조

```
admin-dashboard/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── ui/             # 기본 UI 컴포넌트
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Input.tsx
│   │   │   └── StatCard.tsx
│   │   ├── layout/         # 레이아웃 컴포넌트
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   └── common/         # 공통 컴포넌트
│   │       ├── SearchBar.tsx
│   │       └── Pagination.tsx
│   │
│   ├── pages/              # 페이지 컴포넌트
│   │   ├── Dashboard.tsx          # 대시보드 (메인)
│   │   ├── users/
│   │   │   ├── UserList.tsx       # 유저 목록
│   │   │   └── UserDetail.tsx     # 유저 상세
│   │   ├── properties/
│   │   │   ├── PropertyList.tsx   # 매물 목록
│   │   │   └── PropertyReview.tsx # 매물 심사
│   │   ├── reservations/
│   │   │   └── ReservationList.tsx
│   │   ├── payments/
│   │   │   └── PaymentList.tsx
│   │   ├── settlements/
│   │   │   └── SettlementList.tsx
│   │   ├── inquiries/
│   │   │   └── InquiryList.tsx
│   │   └── notifications/
│   │       └── NotificationList.tsx
│   │
│   ├── data/               # Mock 데이터
│   │   ├── mockProperties.ts
│   │   ├── mockReservations.ts
│   │   ├── mockPayments.ts
│   │   ├── mockSettlements.ts
│   │   ├── mockInquiries.ts
│   │   └── mockNotifications.ts
│   │
│   ├── types/              # TypeScript 타입 정의
│   │   └── index.ts
│   │
│   ├── utils/              # 유틸리티 함수
│   │   └── format.ts       # 포맷팅 헬퍼
│   │
│   ├── App.tsx             # 앱 루트
│   ├── main.tsx            # 엔트리 포인트
│   └── index.css           # 글로벌 스타일
│
├── public/                 # 정적 파일
├── docs/                   # 문서
│   ├── CLAUDE.md          # 기존 기술 문서
│   └── ARCHITECTURE.md    # 이 문서
├── .clauderc              # Claude MCP 설정
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── vite.config.ts
```

---

## 🗄️ 데이터 모델

### 1. User (사용자)

```typescript
interface User {
  id: number;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: string | null;
  profileImageUrl: string | null;
  userType: 'local' | 'social';
  isActive: boolean;
  lastLoginAt: string | null;

  // 약관 동의
  serviceTermsAgreed: boolean;
  privacyPolicyAgreed: boolean;
  marketingConsent: boolean;
  ageConfirmed: boolean;
  termsAgreedAt: string | null;

  createdAt: string;
  updatedAt: string;
}
```

**주요 특징**:
- 로컬/소셜 로그인 구분
- 휴대폰 인증 여부 관리
- 약관 동의 이력 추적
- 활성/비활성 상태 관리

---

### 2. Room (매물)

```typescript
type RoomStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';

interface Room {
  id: number;
  hostId: number;

  // 기본 정보
  roomName: string;
  address: string;
  detailAddress: string;
  latitude: number | null;
  longitude: number | null;
  area: number;
  floor: string | null;
  buildingType: string;

  // 시설 정보
  parkingAvailable: boolean;
  parkingInfo: string | null;
  elevatorAvailable: boolean;
  roomCount: number;
  bathroomCount: number;
  livingRoomCount: number;
  kitchenCount: number;
  isDuplex: boolean;
  entrancePassword: string | null;

  // 요금 정보
  dailyRent: number | null;
  dailyMaintenanceFee: number | null;
  maintenanceDetail: string | null;
  longTermWeeks: number | null;
  longTermDiscount: number | null;
  quickMoveIn: string | null;
  quickMoveInDiscount: number | null;

  // 유틸리티 포함 여부
  includeElectricity: boolean;
  includeWater: boolean;
  includeGas: boolean;
  includeInternet: boolean;

  cleaningFee: number | null;
  minContractWeeks: number | null;
  refundPolicy: string | null;

  // 소개
  description: string | null;
  transportation: string | null;
  houseRules: string | null;

  // 상태 관리
  status: RoomStatus;
  submittedAt: string | null;
  approvedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**상태 흐름**:
```
draft → pending_review → approved → published
                    ↓
                rejected
```

---

### 3. Contract (계약/예약)

```typescript
type ContractStatus =
  | 'PENDING_APPROVAL'    // 승인 대기
  | 'APPROVED'            // 승인됨 (결제 대기)
  | 'REJECTED'            // 거절됨
  | 'PAYMENT_COMPLETED'   // 결제 완료
  | 'IN_PROGRESS'         // 진행중 (체크인 완료)
  | 'COMPLETED'           // 완료 (체크아웃 완료)
  | 'CANCELLED_BY_GUEST'  // 게스트 취소
  | 'CANCELLED_BY_HOST'   // 호스트 취소
  | 'REFUNDED'            // 환불 완료
  | 'APPROVAL_EXPIRED'    // 미승인 만료
  | 'PAYMENT_EXPIRED';    // 미결제 만료

interface Contract {
  id: number;
  roomId: number;
  hostId: number;
  guestId: number;

  // 체크인/아웃
  checkInDate: string;
  checkOutDate: string;
  totalDays: number;
  totalWeeks: number | null;

  // 금액 정보
  rentalFee: number;
  maintenanceFee: number;
  cleaningFee: number;
  rentalItemsFee: number;
  platformFee: number;
  discountAmount: number;
  discountType: DiscountType | null;
  discountCode: string | null;

  // 계산된 금액
  subtotal: number;
  totalUsageFee: number;
  deposit: number;
  finalTotalAmount: number;

  // 렌탈 아이템
  rentalItems: any; // JSON

  // 결제 정보
  paymentMethod: PaymentMethod | null;
  installmentMonths: number;

  // 메시지
  guestMessage: string | null;
  hostMessage: string | null;
  cancellationReason: string | null;

  // 특별 요청
  specialRequests: any; // JSON

  // 약관 동의
  termsAgreed: any; // JSON

  // 가격 스냅샷
  pricingSnapshot: any; // JSON

  // 상태
  status: ContractStatus;

  // 진행 시점
  approvedAt: string | null;
  rejectedAt: string | null;
  paidAt: string | null;
  checkedInAt: string | null;
  checkedOutAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}
```

**상태 흐름**:
```
PENDING_APPROVAL → APPROVED → PAYMENT_COMPLETED → IN_PROGRESS → COMPLETED
       ↓              ↓              ↓                  ↓
   REJECTED    APPROVAL_EXPIRED  PAYMENT_EXPIRED  CANCELLED_BY_*
                                        ↓
                                    REFUNDED
```

---

### 4. RentalItem (렌탈 아이템)

```typescript
type RentalItemType =
  | 'hair_dryer'
  | 'bedding_set'
  | 'amenity_kit'
  | 'towel_set'
  | 'other';

interface RentalItem {
  id: number;
  itemType: RentalItemType;
  name: string;
  description: string | null;
  price: number;
  totalStock: number;
  availableStock: number;
  imageUrl: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
```

---

## ✅ 구현된 기능

### Phase 1: 완료 ✅

#### 1. 대시보드 (Dashboard)
- **경로**: `/`
- **컴포넌트**: `Dashboard.tsx`
- **주요 기능**:
  - 📊 **통계 카드**: 전체 사용자, 등록 매물, 활성 예약, 월 매출
  - 📈 **트렌드 표시**: 전월 대비 증감률
  - ⚠️ **조치 필요 섹션**: 매물 심사 대기, 미답변 문의
  - 📋 **최근 활동**: 최근 예약, 최근 문의
  - 🔗 **빠른 메뉴**: 주요 관리 페이지 바로가기

**통계 데이터 (Mock)**:
```typescript
{
  totalUsers: 1247,
  totalProperties: 389,
  activeReservations: 156,
  monthlyRevenue: 45820000,
  pendingReviews: 12,
  pendingInquiries: 8,
  userTrend: { value: 12.5, isPositive: true },
  propertyTrend: { value: 8.3, isPositive: true },
  revenueTrend: { value: 15.2, isPositive: true }
}
```

#### 2. 유저 관리
- **경로**: `/users`, `/users/:id`
- **컴포넌트**: `UserList.tsx`, `UserDetail.tsx`
- **주요 기능**:
  - 📋 유저 목록 조회 (페이지네이션)
  - 🔍 검색 및 필터링
  - 👤 유저 상세 정보
  - 🔐 계정 상태 관리 (활성/정지/탈퇴)

#### 3. 매물 관리
- **경로**: `/properties`, `/properties/review`
- **컴포넌트**: `PropertyList.tsx`, `PropertyReview.tsx`
- **주요 기능**:
  - 📋 매물 목록 조회
  - 🔍 검색 및 필터링 (상태별)
  - 📝 매물 심사 (승인/반려)
  - 📊 매물 상세 정보

### Phase 2: 진행중 🔄

#### 4. 예약 관리
- **경로**: `/reservations`
- **컴포넌트**: `ReservationList.tsx`
- **상태**: 목록 페이지 구현 완료
- **TODO**: 예약 상세, 취소 처리

#### 5. 결제 관리
- **경로**: `/payments`
- **컴포넌트**: `PaymentList.tsx`
- **상태**: 목록 페이지 구현 완료
- **TODO**: 결제 상세, 환불 처리

#### 6. 정산 관리
- **경로**: `/settlements`
- **컴포넌트**: `SettlementList.tsx`
- **상태**: 목록 페이지 구현 완료
- **TODO**: 정산 처리, 보류 관리

#### 7. 고객센터
- **경로**: `/inquiries`
- **컴포넌트**: `InquiryList.tsx`
- **상태**: 목록 페이지 구현 완료
- **TODO**: 문의 상세, 답변 작성

#### 8. 알림 서비스
- **경로**: `/notifications`
- **컴포넌트**: `NotificationList.tsx`
- **상태**: 목록 페이지 구현 완료
- **TODO**: 알림 발송, 템플릿 관리

---

## 🗺️ 라우팅 구조

```typescript
<Routes>
  <Route path="/" element={<AdminLayout />}>
    <Route index element={<Dashboard />} />

    {/* 유저 관리 */}
    <Route path="users" element={<UserList />} />
    <Route path="users/:id" element={<UserDetail />} />

    {/* 매물 관리 */}
    <Route path="properties" element={<PropertyList />} />
    <Route path="properties/review" element={<PropertyReview />} />

    {/* 예약 관리 */}
    <Route path="reservations" element={<ReservationList />} />

    {/* 결제 관리 */}
    <Route path="payments" element={<PaymentList />} />

    {/* 정산 관리 */}
    <Route path="settlements" element={<SettlementList />} />

    {/* 고객센터 */}
    <Route path="inquiries" element={<InquiryList />} />

    {/* 알림 서비스 */}
    <Route path="notifications" element={<NotificationList />} />
  </Route>
</Routes>
```

**레이아웃 구조**:
```
AdminLayout
├── Sidebar (좌측 네비게이션)
├── Header (상단 헤더)
└── Main Content (페이지 컨텐츠)
```

---

## 🧩 컴포넌트 아키텍처

### UI 컴포넌트 (Atomic Design)

#### Button
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}
```

#### Badge
```typescript
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger';
  children: React.ReactNode;
}
```

#### Table
```typescript
interface TableColumn<T> {
  key: keyof T | string;
  title: string;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
}
```

#### StatCard
```typescript
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  iconColor?: string;
  iconBgColor?: string;
}
```

### 유틸리티 함수 (`utils/format.ts`)

#### 금액 포맷팅
```typescript
formatCurrency(120000) // ₩120,000
```

#### 날짜 포맷팅
```typescript
formatDate('2024-10-27') // 2024. 10. 27.
formatDateTime('2024-10-27T10:30:00') // 2024. 10. 27. 오전 10:30
```

#### 상태 관리
```typescript
getStatusColor('approved') // 'bg-green-100 text-green-800'
getStatusText('pending') // '심사중'
```

#### 민감 정보 마스킹
```typescript
maskPhone('010-1234-5678') // 010-****-5678
maskEmail('user@example.com') // u***r@example.com
maskBankAccount('국민은행 123-456-7890') // 국민은행 ****-****-7890
```

---

## 🎨 디자인 시스템

### 색상 팔레트 (Tailwind CSS)

```css
/* Primary Colors */
primary-50 ~ primary-900

/* Status Colors */
success: green-500
warning: yellow-500
danger: red-500
info: blue-500

/* Neutral Colors */
gray-50 ~ gray-900
```

### 타이포그래피
```css
/* Headings */
h1: text-3xl font-bold
h2: text-2xl font-semibold
h3: text-xl font-semibold

/* Body */
body: text-base
small: text-sm
```

### 간격 시스템
- **Padding**: `p-4` (1rem), `p-6` (1.5rem)
- **Margin**: `mb-4`, `mt-6`
- **Gap**: `gap-4`, `gap-6`

---

## 🔄 데이터 흐름

### 현재 상태 (Mock Data)
```
Component
    ↓
Mock Data (src/data/mock*.ts)
    ↓
Render
```

### 향후 계획 (API Integration)
```
Component
    ↓
React Query / SWR
    ↓
API Service Layer
    ↓
Backend API
    ↓
Database
```

---

## 🚀 향후 계획

### Phase 3: API 연동
- [ ] Axios 설정 및 API 서비스 레이어 구축
- [ ] React Query 도입 (서버 상태 관리)
- [ ] 인증/인가 시스템 (JWT)
- [ ] API 에러 핸들링

### Phase 4: 상세 기능 구현
- [ ] 예약 상세 및 취소 처리
- [ ] 결제 상세 및 환불 관리
- [ ] 정산 처리 워크플로우
- [ ] 문의 답변 시스템
- [ ] 알림 템플릿 관리

### Phase 5: 고도화
- [ ] 실시간 알림 (WebSocket)
- [ ] 통계 대시보드 고도화
- [ ] 엑셀 내보내기
- [ ] 관리자 권한 관리 (RBAC)
- [ ] 변경 이력 (Audit Log)
- [ ] 다크 모드

### Phase 6: 성능 최적화
- [ ] Code Splitting
- [ ] Lazy Loading
- [ ] Image Optimization
- [ ] Caching Strategy
- [ ] Bundle Size Optimization

---

## 📚 참고 문서

- [CLAUDE.md](../CLAUDE.md) - 기존 기술 문서
- [React 공식 문서](https://react.dev)
- [TypeScript 공식 문서](https://www.typescriptlang.org)
- [Tailwind CSS 문서](https://tailwindcss.com)
- [Vite 문서](https://vitejs.dev)

---

## 🤝 개발 가이드

### 개발 서버 실행
```bash
npm install
npm run dev
```

### 빌드
```bash
npm run build
```

### 린트 검사
```bash
npm run lint
```

### 새 페이지 추가 시
1. `src/pages/[도메인]/` 디렉토리 생성
2. 페이지 컴포넌트 작성
3. `src/App.tsx`에 라우트 추가
4. `src/components/layout/Sidebar.tsx`에 메뉴 추가
5. 필요시 `src/types/index.ts`에 타입 추가

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-10-27 | 1.0.0 | 초기 아키텍처 문서 작성 |

---

**작성자**: Claude AI
**라이선스**: MIT License
