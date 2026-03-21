/**
 * 정산 관리 API 서비스
 */

import { api } from './api';
import type { Settlement, SettlementSummary, Pagination } from '../types';

export interface SettlementListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  hostId?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface SettlementListResponse {
  settlements: Settlement[];
  summary: SettlementSummary;
  pagination: Pagination;
}

export const settlementService = {
  /**
   * 정산 목록 조회
   */
  getSettlements: (params: SettlementListParams = {}) => {
    return api.get<SettlementListResponse>('/admin/settlements', { params });
  },

  /**
   * 정산 상세 조회
   */
  getSettlementDetail: (contractId: number) =>
    api.get<any>(`/admin/settlements/${contractId}`),

  /**
   * 정산 완료 처리
   */
  complete: (settlementId: number, note?: string) =>
    api.patch<any>(`/admin/settlements/${settlementId}/complete`, { note }),

  /**
   * 정산 보류 처리
   */
  hold: (settlementId: number, reason: string) =>
    api.patch<any>(`/admin/settlements/${settlementId}/hold`, { reason }),

  /**
   * 정산 보류 해제
   */
  unhold: (settlementId: number, note?: string) =>
    api.patch<any>(`/admin/settlements/${settlementId}/unhold`, { note }),

  /**
   * 정산 금액 수동 조정
   */
  adjust: (settlementId: number, netAmount: number, reason: string) =>
    api.patch<any>(`/admin/settlements/${settlementId}/adjust`, { netAmount, reason }),

  /**
   * 정산 메모 수정
   */
  updateNote: (settlementId: number, note: string) =>
    api.patch<any>(`/admin/settlements/${settlementId}/note`, { note }),

  /**
   * 정산 엑셀 내보내기 (파일 다운로드)
   */
  exportExcel: async (params: { status?: string; hostId?: number; startDate?: string; endDate?: string } = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    const token = localStorage.getItem('accessToken');
    const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const response = await fetch(
      `${baseUrl}/admin/settlements/export${queryString ? `?${queryString}` : ''}`,
      {
        headers: {
          ...(token && { Authorization: `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) throw new Error('엑셀 다운로드 실패');

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `settlement_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
  },
};
