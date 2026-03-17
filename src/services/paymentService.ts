/**
 * 결제 관리 API 서비스
 */

import { api } from './api';
import type { PaymentSummaryItem, PaymentLog, PaymentOrderDetail, Pagination } from '../types';

export interface PaymentSummaryParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  productType?: string;
}

export interface PaymentLogParams {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  transactionType?: string;
  productType?: string;
}

export interface PaymentSummaryListResponse {
  payments: PaymentSummaryItem[];
  pagination: Pagination;
}

export interface PaymentLogListResponse {
  logs: PaymentLog[];
  pagination: Pagination;
}

export interface RefundRequest {
  refundAmount: number;
  refundReason: string;
}

export const paymentService = {
  /**
   * 탭1: 주문별 결제 현황 (계약 기준 결제 요약)
   */
  getPaymentSummary: (params: PaymentSummaryParams = {}) => {
    return api.get<PaymentSummaryListResponse>('/admin/payments/summary', { params });
  },

  /**
   * 주문번호 기준 결제 상세 조회
   */
  getPaymentDetail: (orderId: string, type?: string) => {
    const params: Record<string, string> = {};
    if (type) params.type = type;
    return api.get<PaymentOrderDetail>(`/admin/payments/${orderId}`, { params });
  },

  /**
   * 탭2: 결제/취소 내역 (결제/환불 이벤트 로그)
   */
  getPaymentLogs: (params: PaymentLogParams = {}) => {
    return api.get<PaymentLogListResponse>('/admin/payments/logs', { params });
  },

  /**
   * 환불 처리 (contractId 기준)
   */
  refund: (contractId: number | string, data: RefundRequest) =>
    api.post<any>(`/admin/payments/${contractId}/refund`, data),
};
