/**
 * 렌탈 주문 관리 API 서비스
 */

import { api } from './api';
import type {
  RentalOrder,
  RentalOrderDetail,
  RentalHistory,
  Pagination,
} from '../types';

// 렌탈 주문 목록 응답 타입
export interface RentalOrderListResponse {
  orders: RentalOrder[];
  pagination: Pagination;
}

// 렌탈 주문 목록 조회 파라미터
export interface RentalOrderListParams {
  page?: number;
  limit?: number;
  status?: string;
  deliveryStatus?: string;
  orderType?: string;
  contractId?: number;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const rentalOrderService = {
  /**
   * 렌탈 주문 목록 조회
   */
  getRentalOrders: (params: RentalOrderListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<RentalOrderListResponse>(
      `/admin/rental-orders${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 렌탈 주문 상세 조회 (주문번호 문자열)
   */
  getRentalOrderDetail: (rentalOrderId: string) =>
    api.get<RentalOrderDetail>(`/admin/rental-orders/${rentalOrderId}`),

  /**
   * 계약별 렌탈 이력 조회
   */
  getRentalHistory: (contractId: number) =>
    api.get<RentalHistory>(`/admin/contracts/${contractId}/rental-history`),

  /**
   * 렌탈 주문 전체 취소 (관리자 강제 취소)
   */
  cancelRentalOrder: (rentalOrderId: string, reason: string, refundAmount?: number) =>
    api.post<any>(`/admin/rental-orders/${rentalOrderId}/cancel`, {
      reason,
      ...(refundAmount !== undefined && { refundAmount }),
    }),

  /**
   * 렌탈 아이템 개별 취소
   */
  cancelRentalItem: (orderId: number, itemId: number, cancelReason: string) =>
    api.post<void>(`/admin/rental-orders/${orderId}/items/${itemId}/cancel`, {
      cancelReason,
    }),

  /**
   * 배송 상태 변경 (숫자 PK)
   */
  updateDeliveryStatus: (orderId: number, deliveryStatus: string, deliveredAt?: string) =>
    api.patch<void>(`/admin/rental-orders/${orderId}/delivery-status`, {
      deliveryStatus,
      deliveredAt,
    }),
};
