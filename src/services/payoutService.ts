/**
 * 지급(Payout) 관리 API 서비스
 */

import { api } from './api';
import type { PayoutListItem, PayoutDetail, PayoutListParams } from '../types';

export interface PayoutListResponse {
  total: number;
  page: number;
  limit: number;
  payouts: PayoutListItem[];
}

export const payoutService = {
  /**
   * 지급 목록 조회
   */
  getPayouts: (params: PayoutListParams = {}) =>
    api.get<PayoutListResponse>('/admin/payouts', { params }),

  /**
   * 지급 상세 조회
   */
  getPayout: (payoutId: number) =>
    api.get<PayoutDetail>(`/admin/payouts/${payoutId}`),

  /**
   * 지급 실행 (PAYABLE → COMPLETED)
   */
  execute: (payoutId: number, note?: string) =>
    api.post<{ payoutId: number; status: string; processedAt: string }>(
      `/admin/payouts/${payoutId}/execute`,
      { note }
    ),

  /**
   * 지급 실패 처리
   */
  fail: (payoutId: number, failureReason: string) =>
    api.post<{ payoutId: number; status: string }>(
      `/admin/payouts/${payoutId}/fail`,
      { failureReason }
    ),

  /**
   * 지급 취소
   */
  cancel: (payoutId: number, note?: string) =>
    api.post<{ payoutId: number; status: string }>(
      `/admin/payouts/${payoutId}/cancel`,
      { note }
    ),

  /**
   * 지급 재시도 (FAILED → PAYABLE, 최신 계좌 재스냅샷)
   */
  retry: (payoutId: number) =>
    api.post<{ payoutId: number; status: string }>(
      `/admin/payouts/${payoutId}/retry`,
      {}
    ),

  /**
   * 관리자 메모 수정 (모든 상태에서 가능)
   */
  updateNote: (payoutId: number, note: string) =>
    api.patch<{ payoutId: number; note: string }>(
      `/admin/payouts/${payoutId}/note`,
      { note }
    ),

  /**
   * 지급 목록 CSV 다운로드
   */
  exportCsv: async (params: PayoutListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const token = localStorage.getItem('accessToken');
    const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const response = await fetch(
      `${baseUrl}/admin/payouts/export${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) throw new Error('CSV 다운로드 실패');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payouts_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
