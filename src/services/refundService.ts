/**
 * 환불 관리 API 서비스
 */

import { api } from './api';
import type {
  Refund, RefundDetail, RefundStatus, Pagination,
  AdminRefundRequest, AdminRefundResponse,
  RentalRefundRequest, RentalRefundResponse,
} from '../types';

// 환불 목록 응답 타입
export interface RefundListResponse {
  refunds: Refund[];
  pagination: Pagination;
}

// 환불 승인 응답 타입
export interface ApproveRefundResponse {
  refundId: number;
  refundStatus: RefundStatus;
  approvedAt: string;
  completedAt: string;
  finalRefundAmount: number;
}

// 환불 거절 응답 타입
export interface RejectRefundResponse {
  refundId: number;
  refundStatus: RefundStatus;
  rejectionReason: string;
  rejectedAt: string;
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
   * 502 응답 시 PG 실패 — refundStatus가 REFUND_FAILED로 변경됨, 재시도 가능
   */
  approveRefund: (refundId: number, adminNotes?: string) =>
    api.patch<ApproveRefundResponse>(`/admin/refunds/${refundId}/approve`, {
      admin_notes: adminNotes,
    }),

  /**
   * 환불 거절
   */
  rejectRefund: (refundId: number, rejectionReason: string, adminNotes?: string) =>
    api.patch<RejectRefundResponse>(`/admin/refunds/${refundId}/reject`, {
      rejection_reason: rejectionReason,
      admin_notes: adminNotes,
    }),

  /**
   * 관리자 직접 환불 처리 (계약 결제 + INITIAL 렌탈 주문)
   * - FULL: 잔액 전체 환불
   * - PARTIAL_ITEMS: 항목별 금액 지정 + INITIAL 렌탈 아이템 ID별 환불 가능
   * 502: DB rollback됨, 재시도 가능
   */
  adminRefund: (contractId: number, data: AdminRefundRequest) =>
    api.post<AdminRefundResponse>(`/admin/payments/${contractId}/refund`, data),

  /**
   * ADDITIONAL 렌탈 주문 추가결제 환불 (rental_payments 대상)
   * INITIAL 렌탈 주문은 adminRefund()의 items.rentalItems 사용
   * 502: DB rollback됨, 재시도 가능
   */
  rentalRefund: (rentalOrderId: string, data: RentalRefundRequest) =>
    api.post<RentalRefundResponse>(`/admin/rental-payments/${rentalOrderId}/refund`, data),
};
