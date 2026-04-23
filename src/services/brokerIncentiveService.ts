import { api } from './api';
import type {
  BrokerIncentiveMonthlyParams,
  BrokerIncentiveMonthlyListResponse,
  BrokerIncentiveMonthlyDetailResponse,
} from '../types';

const API_BASE_URL =
  (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api';

async function downloadBlob(endpoint: string, filename: string) {
  const token = localStorage.getItem('accessToken');
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  if (!response.ok) {
    throw new Error('CSV 다운로드에 실패했습니다.');
  }

  // 서버가 내려준 Content-Disposition 의 filename 우선 사용
  const cd = response.headers.get('Content-Disposition') || '';
  const match = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  const serverFilename = match ? decodeURIComponent(match[1]) : '';

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = serverFilename || filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export const brokerIncentiveService = {
  getMonthly: (params: BrokerIncentiveMonthlyParams) =>
    api.get<BrokerIncentiveMonthlyListResponse>(
      '/admin/broker-incentives/monthly',
      { params }
    ),

  getPayoutDetail: (payoutId: number) =>
    api.get<BrokerIncentiveMonthlyDetailResponse>(
      `/admin/broker-incentives/monthly/${payoutId}`
    ),

  markPaid: (payoutId: number, memo?: string | null) =>
    api.patch<{ payoutId: number }>(
      `/admin/broker-incentives/monthly/${payoutId}/pay`,
      memo != null && memo !== '' ? { memo } : {}
    ),

  downloadPayoutCsv: (payoutId: number, fallbackName = 'broker-incentive.csv') =>
    downloadBlob(
      `/admin/broker-incentives/monthly/${payoutId}/csv`,
      fallbackName
    ),

  downloadMonthlyCsv: (month: string) =>
    downloadBlob(
      `/admin/broker-incentives/monthly/csv?month=${encodeURIComponent(month)}`,
      `broker-incentives-${month}.csv`
    ),
};
