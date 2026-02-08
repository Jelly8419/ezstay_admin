/**
 * 환불 관리 API 서비스
 */

import { api } from './api';
import type { Refund, RefundDetail, Pagination } from '../types';

// 환불 목록 응답 타입
export interface RefundListResponse {
  refunds: Refund[];
  pagination: Pagination;
}

// 환불 목록 조회 파라미터
export interface RefundListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const refundService = {
  /**
   * 환불 목록 조회
   */
  getRefunds: (params: RefundListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<RefundListResponse>(
      `/admin/refunds${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 환불 상세 조회
   */
  getRefundDetail: (refundId: number) =>
    api.get<RefundDetail>(`/admin/refunds/${refundId}`),

  /**
   * 환불 승인
   */
  approveRefund: (refundId: number, adminNotes?: string) =>
    api.post<void>(`/admin/refunds/${refundId}/approve`, { adminNotes }),

  /**
   * 환불 거절
   */
  rejectRefund: (refundId: number, rejectionReason: string, adminNotes?: string) =>
    api.post<void>(`/admin/refunds/${refundId}/reject`, { rejectionReason, adminNotes }),
};
