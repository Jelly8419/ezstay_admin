# 데이터 모델 & 상태 전이 - EZStay Admin

> UI 조건부 렌더링 및 상태 표시 기준

## 상태 전이 요약

### User
`active ↔ suspended` (관리자 정지/해제) | `active → withdrawn` (사용자 탈퇴)

### Property (매물)
`pending → approved | rejected` (관리자 심사)
`approved → inactive` (호스트 비활성화)
`rejected → pending` (재심사 요청)

visibility: `visible`(노출) | `hidden`(비공개) | `inactive`(운영중단)

### Reservation (예약)
`pending → confirmed` (결제완료) | `→ cancelled` (취소)
`confirmed → completed` (체크아웃) | `→ cancelled` (취소/환불)

### Payment (결제)
`success → refunded` | `failed` (재결제 또는 취소)

### Settlement (정산)
`pending → completed` | `→ on_hold` (문제발생)
`on_hold → completed` (문제해결 후)

### Inquiry (문의)
`pending → answered` (관리자 답변)

## 주요 프로세스별 알림 발송
- 매물 승인/반려 → 호스트
- 예약 확정 → 게스트 + 호스트
- 결제 완료 → 게스트 영수증
- 정산 완료 → 호스트
- 문의 답변 → 문의자

## API 엔드포인트 (백엔드 연동)
```
GET/PATCH  /api/admin/users/:id/status
GET/POST   /api/admin/properties/:id/approve|reject
GET/PATCH  /api/admin/reservations/:id/cancel
GET/POST   /api/admin/payments/:id/refund
GET/PATCH  /api/admin/settlements/:id/complete
GET/POST   /api/admin/inquiries/:id/answer
GET/POST   /api/admin/notifications/send
```
