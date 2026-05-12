import type { MoveInRoomReviewStatus, PropertySource } from '../types';

type BadgeVariant = 'warning' | 'success' | 'danger' | 'default';

export interface StatusBearingRow {
  source?: PropertySource;
  status?: string;
  reviewStatus?: MoveInRoomReviewStatus;
}

const INTERNAL_LABEL: Record<string, string> = {
  pending_review: '심사 대기',
  approved: '승인',
  rejected: '반려',
  published: '게시됨',
  draft: '작성중',
  hidden_by_admin: '비공개',
};

const INTERNAL_BADGE: Record<string, BadgeVariant> = {
  pending_review: 'warning',
  approved: 'success',
  rejected: 'danger',
  published: 'success',
};

const MOVE_IN_LABEL: Record<MoveInRoomReviewStatus, string> = {
  PENDING: '심사 대기',
  APPROVED: '사용 가능',
  REJECTED: '심사 거절',
};

const MOVE_IN_BADGE: Record<MoveInRoomReviewStatus, BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};

export const getStatusLabel = (row: StatusBearingRow): string => {
  if (row.source === 'move_in' && row.reviewStatus) {
    return MOVE_IN_LABEL[row.reviewStatus] ?? row.reviewStatus;
  }
  return row.status ? INTERNAL_LABEL[row.status] ?? row.status : '-';
};

export const getStatusBadgeVariant = (row: StatusBearingRow): BadgeVariant => {
  if (row.source === 'move_in' && row.reviewStatus) {
    return MOVE_IN_BADGE[row.reviewStatus] ?? 'default';
  }
  return row.status ? INTERNAL_BADGE[row.status] ?? 'default' : 'default';
};

export const isPending = (row: StatusBearingRow): boolean =>
  row.source === 'move_in'
    ? row.reviewStatus === 'PENDING'
    : row.status === 'pending_review';

// 내부 매물 상태 문자열 단독 매핑 (statusHistory 등 row 없이 쓰는 경우용)
export const internalStatusLabel = (status: string): string =>
  INTERNAL_LABEL[status] ?? status;

export const internalStatusBadge = (status: string): BadgeVariant =>
  INTERNAL_BADGE[status] ?? 'default';

// move_in statusHistory 등 reviewStatus 단독 매핑
export const moveInStatusLabel = (status: MoveInRoomReviewStatus): string =>
  MOVE_IN_LABEL[status] ?? status;

export const moveInStatusBadge = (status: MoveInRoomReviewStatus): BadgeVariant =>
  MOVE_IN_BADGE[status] ?? 'default';
