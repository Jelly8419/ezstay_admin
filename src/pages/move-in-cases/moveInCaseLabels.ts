import type {
  MoveInCleaningStatus,
  MoveInGroupPaymentStatus,
  MoveInPaymentRequestStatus,
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
