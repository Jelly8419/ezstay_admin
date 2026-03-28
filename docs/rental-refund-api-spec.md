옵션상품 환불 요청 관리 API
Base URL: http://localhost:8080/api/admin
인증: 관리자 토큰 필요 (super_admin, admin)

1. 환불 요청 목록 조회

GET /rental-refund-requests
Query Parameters

파라미터	타입	필수	설명
status	string	N	PENDING / APPROVED / REJECTED
contractId	number	N	특정 계약의 요청만 조회
page	number	N	페이지 (기본값: 1)
limit	number	N	페이지당 개수 (기본값: 20)
sortOrder	string	N	DESC / ASC (기본값: DESC)
Response


{
  "total": 5,
  "page": 1,
  "limit": 20,
  "totalPages": 1,
  "items": [
    {
      "id": 1,
      "status": "PENDING",
      "statusLabel": "처리 대기",
      "deliveryStatusSnapshot": "DELIVERED",
      "itemTotalAmount": 30000,
      "shippingDeduction": 0,
      "finalRefundAmount": 0,
      "retrievalStatus": null,
      "retrievalStatusLabel": null,
      "cancelReason": "필요 없어서요",
      "rejectReason": null,
      "processedAt": null,
      "createdAt": "2026-03-28T10:00:00.000Z",
      "rentalOrder": {
        "id": 10,
        "orderId": "260101-R0001",
        "status": "PAID",
        "deliveryStatus": "DELIVERED",
        "items": [
          {
            "id": 5,
            "name": "공기청정기",
            "quantity": 1,
            "totalPrice": 30000,
            "status": "CANCEL_REQUESTED"
          }
        ]
      },
      "contract": {
        "id": 3,
        "orderId": "260101-C0001",
        "status": "IN_PROGRESS",
        "guest": {
          "id": 7,
          "name": "홍길동",
          "nickname": "길동",
          "phoneNumber": "010-1234-5678"
        }
      }
    }
  ]
}
2. 환불 요청 상세 조회

GET /rental-refund-requests/:requestId
Response (목록보다 추가되는 필드)

필드	설명
shippingDeductionWaivable	true면 수거비 7000원 면제 적용 예정 (같은 계약에 이미 RETRIEVAL_PENDING 건이 있는 경우)
retrievalStartedAt	수거 시작 시점
retrievalCompletedAt	수거 완료 시점
rentalOrder.payment.balanceAmount	현재 환불 가능 잔액
contract.checkInDate / checkOutDate	계약 기간
contract.guest.email	게스트 이메일 (목록에는 없음)

{
  "id": 1,
  "status": "PENDING",
  "statusLabel": "처리 대기",
  "deliveryStatusSnapshot": "DELIVERED",
  "itemTotalAmount": 30000,
  "shippingDeduction": 0,
  "finalRefundAmount": 0,
  "shippingDeductionWaivable": false,
  "retrievalStatus": null,
  "retrievalStartedAt": null,
  "retrievalCompletedAt": null,
  "cancelReason": "필요 없어서요",
  "rejectReason": null,
  "adminId": null,
  "processedAt": null,
  "createdAt": "2026-03-28T10:00:00.000Z",
  "rentalOrder": {
    "id": 10,
    "orderId": "260101-R0001",
    "status": "PAID",
    "deliveryStatus": "DELIVERED",
    "totalAmount": 30000,
    "paidAmount": 30000,
    "refundedAmount": 0,
    "items": [...],
    "payment": {
      "balanceAmount": 30000,
      "status": "PAID"
    }
  },
  "contract": {
    "id": 3,
    "orderId": "260101-C0001",
    "status": "IN_PROGRESS",
    "checkInDate": "2026-03-01",
    "checkOutDate": "2026-06-01",
    "guest": {
      "id": 7,
      "name": "홍길동",
      "nickname": "길동",
      "email": "hong@example.com",
      "phoneNumber": "010-1234-5678"
    }
  }
}
3. 환불 요청 수락

POST /rental-refund-requests/:requestId/approve
Request Body


{
  "adminNotes": "확인 후 처리" // 선택
}
수거비 7000원 차감 자동 판단 규칙

배송 상태가 PENDING이었던 경우 → 차감 없음 (0원)
배송 상태가 IN_TRANSIT 또는 DELIVERED이고, 같은 계약의 다른 환불건이 RETRIEVAL_PENDING(회수 준비중) 상태면 → 차감 없음 (이미 기사 방문 예정)
배송 상태가 IN_TRANSIT 또는 DELIVERED이고, 위 조건 아닌 경우 → 7000원 차감
Response


{
  "requestId": 1,
  "rentalOrderId": 10,
  "orderId": "260101-R0001",
  "itemTotalAmount": 30000,
  "shippingDeduction": 7000,
  "finalRefundAmount": 23000,
  "retrievalStatus": "RETRIEVAL_PENDING",
  "retrievalStatusLabel": "회수 준비중"
}
retrievalStatus가 null이면 배송 전 상품이므로 수거 불필요

4. 환불 요청 거절

POST /rental-refund-requests/:requestId/reject
Request Body


{
  "rejectReason": "거절 사유 (필수)"
}
처리 내용: rental_order_items 상태가 CANCEL_REQUESTED → ACTIVE로 복원됩니다.

Response


{
  "requestId": 1,
  "status": "REJECTED",
  "rejectReason": "거절 사유",
  "restoredItemCount": 2
}
5. 수거 상태 업데이트

PATCH /rental-refund-requests/:requestId/retrieval
수거 상태 전이 규칙 (순서대로만 가능)


RETRIEVAL_PENDING(회수 준비중) → IN_RETRIEVAL(회수중) → RETRIEVED(회수 완료)
Request Body


{
  "retrievalStatus": "IN_RETRIEVAL"  // 또는 "RETRIEVED"
}
Response


{
  "requestId": 1,
  "retrievalStatus": "IN_RETRIEVAL",
  "retrievalStatusLabel": "회수중",
  "retrievalStartedAt": "2026-03-28T14:00:00.000Z",
  "retrievalCompletedAt": null
}