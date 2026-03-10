/**
 * 영수증 관리 API 서비스
 */

import { api } from './api';
import type { Receipt, Pagination } from '../types';

export interface ReceiptListResponse {
  receipts: Receipt[];
  pagination: Pagination;
}

export interface ReceiptListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const receiptService = {
  /**
   * 영수증 신청 목록 조회
   */
  getReceipts: (params: ReceiptListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<ReceiptListResponse>(
      `/admin/receipts${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 영수증 발급
   */
  issueReceipt: (id: number) =>
    api.patch<any>(`/admin/receipts/${id}/issue`),

  /**
   * 영수증 반려
   */
  rejectReceipt: (id: number) =>
    api.patch<any>(`/admin/receipts/${id}/reject`),
};
