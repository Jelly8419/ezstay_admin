/**
 * 보증금 보류 관리 API 서비스
 */

import { api } from './api';
import type { DepositHold, DepositHoldDetail, DepositHoldStatus, Pagination } from '../types';

export interface DepositHoldListResponse {
  holds: DepositHold[];
  pagination: Pagination;
}

export interface DepositHoldListParams {
  page?: number;
  limit?: number;
  status?: DepositHoldStatus;
  contractId?: number;
  hostName?: string;
  startDate?: string;
  endDate?: string;
}

export const depositHoldService = {
  /**
   * 보증금 보류 목록 조회
   */
  getDepositHolds: (params: DepositHoldListParams = {}) =>
    api.get<DepositHoldListResponse>('/admin/deposits', { params }),

  /**
   * 보증금 보류 상세 조회
   */
  getDepositHoldDetail: (contractId: number) =>
    api.get<DepositHoldDetail>(`/admin/deposits/${contractId}`),

  /**
   * 보류 신청 승인
   */
  approveHold: (contractId: number) =>
    api.post<any>(`/admin/deposits/${contractId}/approve-hold`),

  /**
   * 보류 신청 반려
   */
  rejectHold: (contractId: number, reason: string) =>
    api.post<any>(`/admin/deposits/${contractId}/reject-hold`, { reason }),

  /**
   * 강제 반환보류 (관리자 직접 보류)
   */
  forceHold: (contractId: number, reason: string) =>
    api.post<any>(`/admin/deposits/${contractId}/force-hold`, { reason }),

  /**
   * 환불 재시도 (REFUND_FAILED 상태에서 관리자가 PG 환불 재시도)
   */
  retryRefund: (contractId: number) =>
    api.post<any>(`/admin/deposits/${contractId}/retry-refund`),
};
