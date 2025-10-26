# EZstay Admin - Technical Documentation

## 프로젝트 개요

**EZstay Admin**은 EZstay 숙박 플랫폼의 전반적인 운영 관리를 위한 웹 기반 관리 시스템입니다.

- **프로젝트명**: ezstay_admin
- **기술 스택**: React 18 + TypeScript + Vite + Tailwind CSS
- **라우팅**: React Router v6
- **아이콘**: Lucide React
- **개발 서버**: http://localhost:3002
- **백엔드 API**: http://localhost:8080

---

## 데이터 모델 아키텍처 (ERD)

### 핵심 엔티티 관계도

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│    User     │────────>│  Property    │────────>│ Reservation │
│   (사용자)   │  소유    │   (매물)      │  예약    │   (예약)     │
└─────────────┘         └──────────────┘         └─────────────┘
       │                        │                        │
       │                        │                        │
       ▼                        ▼                        ▼
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│  Inquiry    │         │  Settlement  │         │   Payment   │
│   (문의)     │         │   (정산)      │         │   (결제)     │
└─────────────┘         └──────────────┘         └─────────────┘
                                                         │
                                                         ▼
                                                  ┌─────────────┐
                                                  │Notification │
                                                  │   (알림)     │
                                                  └─────────────┘
```

---

## 데이터 모델 상세

### 1. User (사용자)

**역할**: 플랫폼 사용자 관리 (게스트/호스트)

```typescript
interface User {
  id: number;              // 사용자 고유 ID
  name: string;            // 실명
  nickname: string;        // 닉네임
  phone: string;           // 전화번호
  email: string;           // 이메일
  role: UserRole;          // 'guest' | 'host' | 'both'
  status: UserStatus;      // 'active' | 'suspended' | 'withdrawn'
  phoneVerified: boolean;  // 휴대폰 인증 여부
  createdAt: string;       // 가입일시
  lastLoginAt: string;     // 마지막 로그인
}
```

**상태 전이**:
```
active ──> suspended (관리자가 정지)
active ──> withdrawn (사용자가 탈퇴)
suspended ──> active (정지 해제)
```

**관계**:
- `1:N` → Property (호스트일 경우 여러 매물 소유)
- `1:N` → Reservation (게스트일 경우 여러 예약)
- `1:N` → Inquiry (여러 문의 작성)
- `1:N` → Settlement (호스트일 경우 정산 내역)

---

### 2. Property (매물)

**역할**: 숙박 매물 정보 및 심사 관리

```typescript
interface Property {
  id: number;                      // 매물 고유 ID
  title: string;                   // 매물 제목
  address: string;                 // 주소
  hostId: number;                  // 호스트 ID (User FK)
  hostName: string;                // 호스트 이름
  status: PropertyStatus;          // 'pending' | 'approved' | 'rejected' | 'inactive'
  visibility: PropertyVisibility;  // 'visible' | 'hidden' | 'inactive'
  thumbnailUrl: string;            // 대표 이미지 URL
  description: string;             // 매물 설명
  createdAt: string;               // 등록일시
  reviewedAt?: string;             // 심사 완료일
  rejectionReason?: string;        // 반려 사유
}
```

**상태 전이**:
```
pending ──> approved (관리자 승인)
pending ──> rejected (관리자 반려)
approved ──> inactive (호스트가 비활성화)
rejected ──> pending (재심사 요청)
```

**Visibility 관리**:
```
visible: 검색 노출 (예약 가능)
hidden: 비공개 (예약 불가)
inactive: 비활성화 (운영 중단)
```

**관계**:
- `N:1` → User (호스트)
- `1:N` → Reservation (여러 예약)
- `1:N` → Settlement (정산 항목)

---

### 3. Reservation (예약)

**역할**: 숙박 예약 내역 관리

```typescript
interface Reservation {
  id: number;             // 예약 고유 ID
  propertyId: number;     // 매물 ID (Property FK)
  propertyTitle: string;  // 매물 제목
  guestId: number;        // 게스트 ID (User FK)
  guestName: string;      // 게스트 이름
  checkIn: string;        // 체크인 일자
  checkOut: string;       // 체크아웃 일자
  status: ReservationStatus; // 'pending' | 'confirmed' | 'cancelled' | 'completed'
  totalAmount: number;    // 총 결제 금액
  createdAt: string;      // 예약 생성일
}
```

**상태 전이**:
```
pending ──> confirmed (결제 완료)
pending ──> cancelled (예약 취소)
confirmed ──> completed (체크아웃 완료)
confirmed ──> cancelled (취소 및 환불)
```

**관계**:
- `N:1` → Property (매물)
- `N:1` → User (게스트)
- `1:1` → Payment (결제 정보)

---

### 4. Payment (결제)

**역할**: 결제 및 환불 내역 관리

```typescript
interface Payment {
  id: number;              // 결제 고유 ID
  reservationId: number;   // 예약 ID (Reservation FK)
  amount: number;          // 결제 금액
  method: PaymentMethod;   // 'card' | 'bank' | 'virtual'
  status: PaymentStatus;   // 'success' | 'failed' | 'refunded'
  paidAt: string;          // 결제 일시
}
```

**상태 전이**:
```
success ──> refunded (환불 처리)
failed (재결제 또는 예약 취소)
```

**관계**:
- `1:1` → Reservation (예약)
- `1:N` → Notification (결제 알림)

---

### 5. Settlement (정산)

**역할**: 호스트 정산 관리

```typescript
interface Settlement {
  id: number;             // 정산 고유 ID
  hostId: number;         // 호스트 ID (User FK)
  hostName: string;       // 호스트 이름
  amount: number;         // 정산 금액
  bankAccount: string;    // 입금 계좌
  status: SettlementStatus; // 'pending' | 'completed' | 'on_hold'
  scheduledAt: string;    // 정산 예정일
  completedAt?: string;   // 정산 완료일
}
```

**상태 전이**:
```
pending ──> completed (정산 완료)
pending ──> on_hold (보류 - 문제 발생시)
on_hold ──> completed (문제 해결 후)
```

**관계**:
- `N:1` → User (호스트)
- 정산 금액 = 예약 완료된 매물의 수수료 차감 금액

---

### 6. Inquiry (고객 문의)

**역할**: 사용자 문의 및 답변 관리

```typescript
interface Inquiry {
  id: number;           // 문의 고유 ID
  userId: number;       // 작성자 ID (User FK)
  userName: string;     // 작성자 이름
  title: string;        // 문의 제목
  content: string;      // 문의 내용
  status: InquiryStatus; // 'pending' | 'answered'
  createdAt: string;    // 문의 일시
  answeredAt?: string;  // 답변 일시
  answer?: string;      // 답변 내용
}
```

**상태 전이**:
```
pending ──> answered (관리자 답변 완료)
```

**관계**:
- `N:1` → User (문의 작성자)

---

### 7. Notification (알림)

**역할**: 이메일/SMS 알림 발송 내역 관리

```typescript
interface Notification {
  id: number;                  // 알림 고유 ID
  type: NotificationType;      // 'email' | 'sms'
  recipient: string;           // 수신자 (이메일 or 전화번호)
  template: string;            // 알림 템플릿명
  status: NotificationStatus;  // 'success' | 'failed'
  sentAt: string;              // 발송 일시
}
```

**알림 발송 시나리오**:
- 예약 확정 → 게스트/호스트에게 알림
- 결제 완료 → 게스트에게 영수증
- 매물 승인/반려 → 호스트에게 알림
- 정산 완료 → 호스트에게 알림
- 문의 답변 → 문의자에게 알림

**관계**:
- 독립적인 로그 테이블 (다른 엔티티 참조 없음)

---

## 관리자 페이지 구조

### 라우팅 구조

```
/admin
├── /users              # 유저 관리
│   ├── /list           # 유저 목록
│   └── /:id            # 유저 상세
├── /properties         # 매물 관리
│   ├── /list           # 매물 목록
│   ├── /review         # 매물 심사
│   └── /:id            # 매물 상세
├── /reservations       # 예약 관리
│   ├── /list           # 예약 목록
│   └── /:id            # 예약 상세
├── /payments           # 결제 관리
│   ├── /list           # 결제 내역
│   └── /refunds        # 환불 관리
├── /settlements        # 정산 관리
│   ├── /list           # 정산 목록
│   └── /pending        # 정산 대기
├── /inquiries          # 고객센터
│   ├── /list           # 문의 목록
│   └── /:id            # 문의 상세/답변
└── /notifications      # 알림 관리
    ├── /list           # 발송 내역
    └── /templates      # 템플릿 관리
```

---

## 주요 기능별 데이터 흐름

### 1. 매물 심사 프로세스

```
호스트 매물 등록
    ↓
Property.status = 'pending'
    ↓
관리자 심사
    ↓ (승인)              ↓ (반려)
status = 'approved'   status = 'rejected'
reviewedAt 기록       rejectionReason 입력
    ↓                      ↓
Notification 발송      Notification 발송
(호스트에게 승인 알림)  (호스트에게 반려 사유)
```

### 2. 예약 및 결제 프로세스

```
게스트 예약 요청
    ↓
Reservation.status = 'pending'
    ↓
결제 진행
    ↓ (성공)                    ↓ (실패)
Payment.status = 'success'   Payment.status = 'failed'
Reservation.status = 'confirmed'
    ↓
Notification 발송 (게스트 + 호스트)
```

### 3. 정산 프로세스

```
체크아웃 완료
    ↓
Reservation.status = 'completed'
    ↓
정산 스케줄링 (익월 15일)
    ↓
Settlement.status = 'pending'
    ↓
관리자 정산 처리
    ↓
Settlement.status = 'completed'
completedAt 기록
    ↓
Notification 발송 (호스트에게 입금 알림)
```

### 4. 고객 문의 처리

```
사용자 문의 등록
    ↓
Inquiry.status = 'pending'
    ↓
관리자 답변 작성
    ↓
Inquiry.status = 'answered'
answeredAt, answer 기록
    ↓
Notification 발송 (문의자에게 답변 알림)
```

---

## 보안 및 권한 관리

### 관리자 권한 레벨 (추후 확장 가능)

```typescript
// 추후 Admin 모델 추가 시
interface Admin {
  id: number;
  username: string;
  role: 'super_admin' | 'manager' | 'cs';
  permissions: AdminPermission[];
}

type AdminPermission =
  | 'user_manage'          // 유저 관리
  | 'property_review'      // 매물 심사
  | 'payment_manage'       // 결제 관리
  | 'settlement_manage'    // 정산 관리
  | 'inquiry_answer'       // 문의 답변
  | 'notification_send';   // 알림 발송
```

### 보안 고려사항

- ✅ JWT 기반 인증 (추후 구현)
- ✅ RBAC (Role-Based Access Control)
- ✅ 민감 정보 마스킹 (전화번호, 계좌번호)
- ✅ 변경 이력 로깅 (Audit Log)
- ✅ HTTPS 필수
- ✅ CORS 설정

---

## 데이터베이스 인덱스 전략

### 필수 인덱스

```sql
-- User
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_phone ON users(phone);
CREATE INDEX idx_user_status ON users(status);

-- Property
CREATE INDEX idx_property_host_id ON properties(host_id);
CREATE INDEX idx_property_status ON properties(status);
CREATE INDEX idx_property_created_at ON properties(created_at);

-- Reservation
CREATE INDEX idx_reservation_property_id ON reservations(property_id);
CREATE INDEX idx_reservation_guest_id ON reservations(guest_id);
CREATE INDEX idx_reservation_status ON reservations(status);
CREATE INDEX idx_reservation_check_in ON reservations(check_in);

-- Payment
CREATE INDEX idx_payment_reservation_id ON payments(reservation_id);
CREATE INDEX idx_payment_status ON payments(status);

-- Settlement
CREATE INDEX idx_settlement_host_id ON settlements(host_id);
CREATE INDEX idx_settlement_status ON settlements(status);
CREATE INDEX idx_settlement_scheduled_at ON settlements(scheduled_at);

-- Inquiry
CREATE INDEX idx_inquiry_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiry_status ON inquiries(status);

-- Notification
CREATE INDEX idx_notification_type ON notifications(type);
CREATE INDEX idx_notification_status ON notifications(status);
CREATE INDEX idx_notification_sent_at ON notifications(sent_at);
```

---

## API 엔드포인트 설계 (백엔드 연동용)

### User API
```
GET    /api/admin/users              # 유저 목록
GET    /api/admin/users/:id          # 유저 상세
PATCH  /api/admin/users/:id/status   # 유저 상태 변경
```

### Property API
```
GET    /api/admin/properties         # 매물 목록
GET    /api/admin/properties/:id     # 매물 상세
GET    /api/admin/properties/pending # 심사 대기 매물
PATCH  /api/admin/properties/:id/approve  # 승인
PATCH  /api/admin/properties/:id/reject   # 반려
```

### Reservation API
```
GET    /api/admin/reservations       # 예약 목록
GET    /api/admin/reservations/:id   # 예약 상세
PATCH  /api/admin/reservations/:id/cancel # 예약 취소
```

### Payment API
```
GET    /api/admin/payments           # 결제 내역
GET    /api/admin/payments/:id       # 결제 상세
POST   /api/admin/payments/:id/refund # 환불 처리
```

### Settlement API
```
GET    /api/admin/settlements        # 정산 목록
GET    /api/admin/settlements/pending # 정산 대기
PATCH  /api/admin/settlements/:id/complete # 정산 완료
```

### Inquiry API
```
GET    /api/admin/inquiries          # 문의 목록
GET    /api/admin/inquiries/:id      # 문의 상세
POST   /api/admin/inquiries/:id/answer # 답변 등록
```

### Notification API
```
GET    /api/admin/notifications      # 발송 내역
POST   /api/admin/notifications/send # 알림 발송
```

---

## 프론트엔드 컴포넌트 구조

### 공통 UI 컴포넌트
- [Button.tsx](src/components/ui/Button.tsx)
- [Badge.tsx](src/components/ui/Badge.tsx)
- [Card.tsx](src/components/ui/Card.tsx)
- [Table.tsx](src/components/ui/Table.tsx)
- [Modal.tsx](src/components/ui/Modal.tsx)
- [Input.tsx](src/components/ui/Input.tsx)

### 레이아웃
- [AdminLayout.tsx](src/components/layout/AdminLayout.tsx)
- [Sidebar.tsx](src/components/layout/Sidebar.tsx)
- [Header.tsx](src/components/layout/Header.tsx)

### 공통 기능
- [SearchBar.tsx](src/components/common/SearchBar.tsx)
- [Pagination.tsx](src/components/common/Pagination.tsx)

### 페이지
- [UserList.tsx](src/pages/users/UserList.tsx)
- [UserDetail.tsx](src/pages/users/UserDetail.tsx)
- [PropertyReview.tsx](src/pages/properties/PropertyReview.tsx)

---

## 개발 가이드

### 프로젝트 시작

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 린트 검사
npm run lint
```

### 새 페이지 추가 시

1. `src/pages/[도메인]/` 디렉토리 생성
2. 페이지 컴포넌트 작성
3. `src/App.tsx`에 라우트 추가
4. `src/components/layout/Sidebar.tsx`에 메뉴 추가
5. 필요시 `src/types/index.ts`에 타입 추가

### 타입 정의 추가

```typescript
// src/types/index.ts
export interface NewEntity {
  id: number;
  // ... fields
}
```

### 상태 관리 (추후 확장)

현재는 로컬 상태 관리만 사용하지만, 추후 다음과 같은 전역 상태 관리 도입 검토:
- Zustand (경량 상태 관리)
- React Query (서버 상태 관리)
- Context API (간단한 전역 상태)

---

## 향후 확장 계획

### Phase 1 (현재)
- ✅ 유저 관리
- ✅ 매물 심사
- 🔄 매물 관리

### Phase 2
- ⬜ 예약 관리
- ⬜ 결제 관리
- ⬜ 정산 관리

### Phase 3
- ⬜ 고객센터 (문의 답변)
- ⬜ 알림 서비스
- ⬜ 통계 대시보드

### Phase 4 (고도화)
- ⬜ 관리자 권한 관리
- ⬜ 변경 이력 (Audit Log)
- ⬜ 실시간 알림 (WebSocket)
- ⬜ 리포트 및 분석

---

## 참고 문서

- [React 공식 문서](https://react.dev)
- [TypeScript 공식 문서](https://www.typescriptlang.org)
- [Tailwind CSS 문서](https://tailwindcss.com)
- [Vite 문서](https://vitejs.dev)
- [React Router 문서](https://reactrouter.com)

---

## 라이선스

MIT License

---

**최종 수정일**: 2025-10-27
**작성자**: Claude AI
**버전**: 1.0.0
