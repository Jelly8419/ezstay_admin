/**
 * 결제 관리 API 서비스
 */

import { api } from './api';
import type { Payment, Pagination } from '../types';

export interface PaymentListParams {
  page?: number;
  limit?: number;
  status?: string;
  method?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface PaymentListResponse {
  payments: Payment[];
  pagination: Pagination;
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
  getPaymentDetail: (paymentId: number) =>
    api.get<any>(`/admin/payments/${paymentId}`),

  /**
   * 환불 처리
   */
  refund: (paymentId: number, data: RefundRequest) =>
    api.post<any>(`/admin/payments/${paymentId}/refund`, data),
};
