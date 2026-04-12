/**
 * 예약(계약) 관리 API 서비스
 */

import { api } from './api';
import type {
  Reservation,
  ReservationDetail,
  Pagination,
  ForceCancelRequest,
  ForceCancelResponse,
  ApproveCancelRequest,
  ApproveCancelResponse,
  RejectCancelRequest,
  RejectCancelResponse,
  CancelRequestListParams,
  CancelRequestListResponse,
} from '../types';

// 예약 목록 응답 타입
export interface ReservationListResponse {
  reservations: Reservation[];
  pagination: Pagination;
}

// 예약 목록 조회 파라미터
export interface ReservationListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const reservationService = {
  /**
   * 예약 목록 조회
   */
  getReservations: (params: ReservationListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<ReservationListResponse>(
      `/admin/reservations${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 예약 상세 조회
   */
  getReservationDetail: (contractId: number) =>
    api.get<ReservationDetail>(`/admin/reservations/${contractId}`),

  /**
   * 관리자 강제 취소
   */
  forceCancel: (contractId: number, data: ForceCancelRequest) =>
    api.post<ForceCancelResponse>(
      `/admin/reservations/${contractId}/force-cancel`,
      data
    ),

  /**
   * 호스트 취소 요청 승인
   */
  approveCancelRequest: (contractId: number, data: ApproveCancelRequest) =>
    api.post<ApproveCancelResponse>(
      `/admin/reservations/${contractId}/approve-cancel-request`,
      data
    ),

  /**
   * 호스트 취소 요청 거절
   */
  rejectCancelRequest: (contractId: number, data: RejectCancelRequest) =>
    api.post<RejectCancelResponse>(
      `/admin/reservations/${contractId}/reject-cancel-request`,
      data
    ),

  /**
   * 취소 요청 목록 조회
   */
  getCancelRequests: (params: CancelRequestListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<CancelRequestListResponse>(
      `/admin/reservations/cancel-requests${queryString ? `?${queryString}` : ''}`
    );
  },
};
