/**
 * 결제 관리 API 서비스
 */

import { api } from './api';
import type { Payment, Pagination } from '../types';

export interface PaymentListParams {
  page?: number;
  limit?: number;
  type?: 'contract' | 'rental' | 'all';
  status?: string;
  method?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaymentSummary {
  contractCount: number;
  rentalCount: number;
  totalCount: number;
}

export interface PaymentListResponse {
  payments: Payment[];
  pagination: Pagination;
  summary?: PaymentSummary;
}

export interface RefundRequest {
  refundAmount: number;
  refundReason: string;
}

export const paymentService = {
  /**
   * 결제 목록 조회
   */
  getPayments: (params: PaymentListParams = {}) => {
    return api.get<PaymentListResponse>('/admin/payments', { params });
  },

  /**
   * 결제 상세 조회
   */
  getPaymentDetail: (paymentId: number, type: 'contract' | 'rental' = 'contract') =>
    api.get<any>(`/admin/payments/${paymentId}?type=${type}`),

  /**
   * 환불 처리
   */
  refund: (paymentId: number, data: RefundRequest) =>
    api.post<any>(`/admin/payments/${paymentId}/refund`, data),
};
