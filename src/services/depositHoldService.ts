/**
 * 보증금 보류 관리 API 서비스
 */

import { api } from './api';
import type {
  DepositHold,
  Pagination,
} from '../types';

export interface DepositHoldListResponse {
  depositHolds: DepositHold[];
  pagination: Pagination;
}

export interface DepositHoldListParams {
  page?: number;
  limit?: number;
  status?: string;
  contractId?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const depositHoldService = {
  /**
   * 보류 신청 목록 조회
   */
  getDepositHolds: (params: DepositHoldListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<DepositHoldListResponse>(
      `/admin/deposits/pending-holds${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 보류 승인
   */
  approveHold: (contractId: number) =>
    api.post<any>(`/admin/deposits/${contractId}/approve-hold`),

  /**
   * 보류 거절
   */
  rejectHold: (contractId: number) =>
    api.post<any>(`/admin/deposits/${contractId}/reject-hold`),

  /**
   * 강제 반환보류
   */
  forceHold: (contractId: number) =>
    api.post<any>(`/admin/deposits/${contractId}/force-hold`),
};
