/**
 * 영수증 관리 API 서비스
 */

import { api } from './api';
import type { Receipt, ReceiptDetail } from '../types';

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
  status?: string;
  userType?: string;
  receiptType?: string;
  targetType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReceiptHistoryParams {
  page?: number;
  limit?: number;
  userType?: string;
  receiptType?: string;
  targetType?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReceiptIssueResponse {
  id: number;
  status: string;
  issuedAt: string;
  issuedBy: number;
  issueNote: string | null;
}

export const receiptService = {
  /**
   * 영수증 발급 리스트 조회
   */
  getReceipts: (params: ReceiptListParams = {}) =>
    api.get<ReceiptListResponse>('/admin/receipts', { params }),

  /**
   * 영수증 상세 조회
   */
  getReceiptDetail: (id: number) =>
    api.get<ReceiptDetail>(`/admin/receipts/${id}`),

  /**
   * 영수증 발급 완료 처리
   */
  issueReceipt: (id: number, note?: string) =>
    api.patch<ReceiptIssueResponse>(`/admin/receipts/${id}/issue`, note ? { note } : undefined),

  /**
   * 영수증 발급 이력 조회
   */
  getReceiptHistory: (params: ReceiptHistoryParams = {}) =>
    api.get<ReceiptListResponse>('/admin/receipts/history', { params }),

  /**
   * CSV 다운로드
   */
  exportCsv: async (params: ReceiptListParams = {}) => {
    const query = Object.entries(params)
      .filter(([_, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v as string)}`)
      .join('&');
    const baseUrl = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api';
    const token = localStorage.getItem('accessToken');
    const res = await fetch(`${baseUrl}/admin/receipts/export${query ? `?${query}` : ''}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) throw new Error('CSV 다운로드 실패');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const today = new Date().toISOString().split('T')[0];
    a.download = `receipts_${today}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
