/**
 * 옵션상품 환불 요청 관리 API 서비스
 * Base: /api/admin/rental-refund-requests
 */

import { api } from './api';
import type {
  RentalRefundRequestListResponse,
  RentalRefundRequestDetail,
  RentalRefundRequestStatus,
  RentalRefundApproveResponse,
  RentalRefundRejectResponse,
  RetrievalStatus,
  RetrievalStatusUpdateResponse,
} from '../types';

export interface RentalRefundRequestListParams {
  status?: RentalRefundRequestStatus;
  contractId?: number;
  page?: number;
  limit?: number;
  sortOrder?: 'ASC' | 'DESC';
}

export const rentalRefundRequestService = {
  /**
   * 환불 요청 목록 조회
   */
  getList: (params: RentalRefundRequestListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<RentalRefundRequestListResponse>(
      `/admin/rental-refund-requests${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 환불 요청 상세 조회
   */
  getDetail: (requestId: number) =>
    api.get<RentalRefundRequestDetail>(`/admin/rental-refund-requests/${requestId}`),

  /**
   * 환불 요청 수락
   * - 수거비 7,000원 차감 여부는 서버가 자동 판단 (shippingDeductionWaivable 참고용)
   */
  approve: (requestId: number, adminNotes?: string) =>
    api.post<RentalRefundApproveResponse>(
      `/admin/rental-refund-requests/${requestId}/approve`,
      adminNotes ? { adminNotes } : {}
    ),

  /**
   * 환불 요청 거절
   * - rental_order_items 상태가 CANCEL_REQUESTED → ACTIVE로 복원됨
   */
  reject: (requestId: number, rejectReason: string) =>
    api.post<RentalRefundRejectResponse>(
      `/admin/rental-refund-requests/${requestId}/reject`,
      { rejectReason }
    ),

  /**
   * 수거 상태 업데이트
   * - 전이 순서: RETRIEVAL_PENDING → IN_RETRIEVAL → RETRIEVED
   */
  updateRetrieval: (requestId: number, retrievalStatus: RetrievalStatus) =>
    api.patch<RetrievalStatusUpdateResponse>(
      `/admin/rental-refund-requests/${requestId}/retrieval`,
      { retrievalStatus }
    ),
};
