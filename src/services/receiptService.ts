/**
 * 영수증 관리 API 서비스
 */

import { api } from './api';
import type { Receipt } from '../types';

export interface ReceiptPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export interface ReceiptListResponse {
  receipts: Receipt[];
  pagination: ReceiptPagination;
}

export interface ReceiptListParams {
  page?: number;
  limit?: number;
  search?: string;
  issueStatus?: string;
  receiptType?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const receiptService = {
  /**
   * 영수증 신청 목록 조회
   */
  getReceipts: (params: ReceiptListParams = {}) =>
    api.get<ReceiptListResponse>('/admin/receipts', { params }),

  /**
   * 영수증 발급
   */
  issueReceipt: (id: number, note?: string) =>
    api.patch<any>(`/admin/receipts/${id}/issue`, note ? { issueNote: note } : undefined),

  /**
   * 영수증 반려
   */
  rejectReceipt: (id: number, note?: string) =>
    api.patch<any>(`/admin/receipts/${id}/reject`, note ? { issueNote: note } : undefined),
};
