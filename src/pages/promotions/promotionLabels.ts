import type {
  PromotionTargetRole,
  PromotionBenefitType,
  PromotionApplyTrigger,
  PromotionVoidedReason,
  PromotionBenefitStatus,
} from '../../types';

export const targetRoleLabel: Record<PromotionTargetRole, string> = {
  HOST: '호스트',
  GUEST: '게스트',
};

export const benefitTypeLabel: Record<PromotionBenefitType, string> = {
  HOST_FEE_WAIVER: '호스트 정산 수수료 면제',
  GUEST_DISCOUNT: '게스트 결제 할인',
};

export const applyTriggerLabel: Record<PromotionApplyTrigger, string> = {
  CONTRACT: '계약 시',
  SETTLEMENT: '정산 시',
};

export const benefitStatusLabel: Record<PromotionBenefitStatus, string> = {
  ACTIVE: '유효',
  VOIDED: '무효',
};

export const voidedReasonLabel: Record<PromotionVoidedReason, string> = {
  REJECTED: '호스트 거절',
  CANCELLED_BY_GUEST: '게스트 취소',
  CANCELLED_BY_HOST: '호스트 취소',
  CANCELLED_BY_ADMIN_WITH_REFUND: '관리자 취소(환불O)',
  CANCELLED_BY_ADMIN_NO_REFUND: '관리자 취소(환불X)',
  APPROVAL_EXPIRED: '미승인 만료',
  PAYMENT_EXPIRED: '미결제 만료',
  SETTLEMENT_ON_HOLD: '정산 보류',
};

export const formatDateTime = (iso: string | null): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export const formatAmount = (n: number): string =>
  `${n.toLocaleString('ko-KR')}원`;

/** ISO 문자열 → datetime-local input 값 (YYYY-MM-DDTHH:mm) */
export const toDatetimeLocal = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** datetime-local input 값 → ISO 문자열 (null 유지) */
export const fromDatetimeLocal = (v: string): string | null => {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
};
