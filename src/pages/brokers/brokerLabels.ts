import type {
  BrokerType,
  BrokerStatus,
  BrokerIncentiveStatus,
  BrokerPayoutStatus,
} from '../../types';

export const brokerTypeLabel: Record<BrokerType, string> = {
  individual: '개인',
  business: '사업자',
};

export const brokerStatusLabel: Record<BrokerStatus, string> = {
  active: '활성',
  inactive: '비활성',
};

export const payoutStatusLabel: Record<BrokerPayoutStatus, string> = {
  PENDING: '지급 대기',
  PAID: '지급 완료',
};

export const incentiveStatusLabel: Record<BrokerIncentiveStatus, string> = {
  PENDING: '대기',
  AGGREGATED: '집계됨',
  PAID: '지급됨',
  ON_HOLD: '보류',
  CANCELLED: '취소',
};

export const formatAmount = (n: number): string =>
  `₩${n.toLocaleString('ko-KR')}`;

export const formatRate = (rate: number | null | undefined): string => {
  if (rate == null) return '-';
  return `${(rate * 100).toFixed(1)}%`;
};

export const formatDate = (iso: string | null): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

export const formatDateTime = (iso: string | null): string => {
  if (!iso) return '-';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '-';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** ISO → YYYY-MM-DD (input[type=date] 용) */
export const toDateInput = (iso: string | null | undefined): string => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/** YYYY-MM 형식 검증 */
export const isValidMonth = (month: string): boolean =>
  /^\d{4}-(0[1-9]|1[0-2])$/.test(month);

/** 현재 월 YYYY-MM */
export const currentMonth = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
