import type {
  MoveInCleaningStatus,
  MoveInGroupPaymentStatus,
  MoveInPaymentRequestStatus,
  MoveInRefundRequestStatus,
  MoveInGuestOrderStatus,
  MoveInGuestOrderDeliveryStatus,
  MoveInGuestOrderType,
  MoveInPaymentType,
  MoveInPaymentStatus,
} from '../../types';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'default';

export const CLEANING_STATUS_CONFIG: Record<
  MoveInCleaningStatus,
  { label: string; variant: BadgeVariant }
> = {
  NOT_REQUESTED: { label: '미신청', variant: 'default' },
  PAYMENT_PENDING: { label: '결제 대기', variant: 'warning' },
  PAID: { label: '결제 완료', variant: 'success' },
  CANCELLED: { label: '취소됨', variant: 'danger' },
};

export const CLEANING_STATUS_OPTIONS: {
  value: MoveInCleaningStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'NOT_REQUESTED', label: '미신청' },
  { value: 'PAYMENT_PENDING', label: '결제 대기' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'CANCELLED', label: '취소됨' },
];

export function getGroupStatusBadge(status: MoveInGroupPaymentStatus): {
  label: string;
  variant: BadgeVariant;
} | null {
  if (status === 'PAID') return { label: '결제 완료', variant: 'success' };
  if (status === 'PENDING') return { label: '결제 대기', variant: 'warning' };
  return null;
}

export const PAYMENT_REQUEST_STATUS_CONFIG: Record<
  MoveInPaymentRequestStatus,
  { label: string; variant: BadgeVariant }
> = {
  NOT_SENT: { label: '미발송', variant: 'default' },
  SENT: { label: '발송 완료', variant: 'warning' },
  EXPIRED: { label: '만료', variant: 'danger' },
  COMPLETED: { label: '결제 완료', variant: 'success' },
  CANCELLED: { label: '취소됨', variant: 'danger' },
};

export const REFUND_REQUEST_STATUS_CONFIG: Record<
  MoveInRefundRequestStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: '처리 대기', variant: 'warning' },
  APPROVED: { label: '승인됨', variant: 'success' },
  REJECTED: { label: '거절됨', variant: 'danger' },
};

export const REFUND_REQUEST_STATUS_OPTIONS: {
  value: MoveInRefundRequestStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '처리 대기' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '거절됨' },
];

// ── 게스트 주문 모니터링 ──

export const GUEST_ORDER_STATUS_CONFIG: Record<
  MoveInGuestOrderStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: '결제 대기', variant: 'warning' },
  PAID: { label: '결제 완료', variant: 'success' },
  PARTIAL_REFUND: { label: '부분 환불', variant: 'info' },
  FULLY_REFUNDED: { label: '전액 환불', variant: 'danger' },
  CANCELLED: { label: '취소됨', variant: 'default' },
};

export const GUEST_ORDER_STATUS_OPTIONS: {
  value: MoveInGuestOrderStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '결제 대기' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'PARTIAL_REFUND', label: '부분 환불' },
  { value: 'FULLY_REFUNDED', label: '전액 환불' },
  { value: 'CANCELLED', label: '취소됨' },
];

export const GUEST_ORDER_DELIVERY_CONFIG: Record<
  MoveInGuestOrderDeliveryStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: '배송 전', variant: 'default' },
  IN_TRANSIT: { label: '배송 중', variant: 'warning' },
  DELIVERED: { label: '배송 완료', variant: 'success' },
};

export const GUEST_ORDER_DELIVERY_OPTIONS: {
  value: MoveInGuestOrderDeliveryStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '배송 전' },
  { value: 'IN_TRANSIT', label: '배송 중' },
  { value: 'DELIVERED', label: '배송 완료' },
];

export const GUEST_ORDER_TYPE_OPTIONS: {
  value: MoveInGuestOrderType | 'all';
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'INITIAL', label: '최초 주문' },
  { value: 'ADDITIONAL', label: '추가 주문' },
];

// 배송 상태 전이 규칙 (명세 3.1)
export const GUEST_ORDER_DELIVERY_TRANSITIONS: Record<
  MoveInGuestOrderDeliveryStatus,
  MoveInGuestOrderDeliveryStatus[]
> = {
  PENDING: ['IN_TRANSIT', 'DELIVERED'],
  IN_TRANSIT: ['DELIVERED', 'PENDING'],
  DELIVERED: ['IN_TRANSIT'],
};

// ── 결제 통합 내역 ──

export const PAYMENT_TYPE_LABEL: Record<MoveInPaymentType, string> = {
  cleaning: '청소 결제',
  guest_option: '옵션 결제',
};

export const PAYMENT_TYPE_OPTIONS: {
  value: MoveInPaymentType | 'all';
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'cleaning', label: '청소 결제' },
  { value: 'guest_option', label: '옵션 결제' },
];

export const PAYMENT_STATUS_CONFIG: Record<
  MoveInPaymentStatus,
  { label: string; variant: BadgeVariant }
> = {
  PENDING: { label: '결제 대기', variant: 'warning' },
  PAID: { label: '결제 완료', variant: 'success' },
  FAILED: { label: '결제 실패', variant: 'danger' },
  CANCELLED: { label: '취소됨', variant: 'default' },
  REFUNDED: { label: '환불됨', variant: 'info' },
};

export const PAYMENT_STATUS_OPTIONS: {
  value: MoveInPaymentStatus | 'all';
  label: string;
}[] = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '결제 대기' },
  { value: 'PAID', label: '결제 완료' },
  { value: 'FAILED', label: '결제 실패' },
  { value: 'CANCELLED', label: '취소됨' },
  { value: 'REFUNDED', label: '환불됨' },
];
