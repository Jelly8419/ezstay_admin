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
  search?: string;
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
   * 렌탈 주문 상세 조회
   */
  getRentalOrderDetail: (orderId: number) =>
    api.get<RentalOrderDetail>(`/admin/rental-orders/${orderId}`),

  /**
   * 계약별 렌탈 이력 조회
   */
  getRentalHistory: (contractId: number) =>
    api.get<RentalHistory>(`/admin/rental-orders/contract/${contractId}/history`),

  /**
   * 렌탈 아이템 취소
   */
  cancelRentalItem: (orderId: number, itemId: number, cancelReason: string) =>
    api.post<void>(`/admin/rental-orders/${orderId}/items/${itemId}/cancel`, {
      cancelReason,
    }),

  /**
   * 배송 상태 변경
   */
  updateDeliveryStatus: (orderId: number, deliveryStatus: string, deliveredAt?: string) =>
    api.patch<void>(`/admin/rental-orders/${orderId}/delivery-status`, {
      deliveryStatus,
      deliveredAt,
    }),
};
