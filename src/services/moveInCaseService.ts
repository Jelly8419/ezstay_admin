import { api } from './api';
import type {
  CleaningPaymentDetail,
  MoveInCaseDetail,
  MoveInCaseListParams,
  MoveInCaseListResponse,
  MoveInCaseUpdateRequest,
  MoveInPaymentRequestResendResponse,
  MoveInRefundApproveResponse,
  MoveInRefundRejectResponse,
  MoveInRefundRequestListParams,
  MoveInRefundRequestListResponse,
  MoveInGuestOrderListParams,
  MoveInGuestOrderListResponse,
  MoveInGuestOrderDetail,
  MoveInGuestOrderDeliveryUpdateRequest,
  MoveInPaymentListParams,
  MoveInPaymentListResponse,
} from '../types';

export const moveInCaseService = {
  getCases: (params?: MoveInCaseListParams): Promise<MoveInCaseListResponse> =>
    api.get<MoveInCaseListResponse>('/admin/move-in/cases', { params }),

  getCaseDetail: (caseId: number): Promise<MoveInCaseDetail> =>
    api.get<MoveInCaseDetail>(`/admin/move-in/cases/${caseId}`),

  getCleaningPaymentDetail: (caseId: number): Promise<CleaningPaymentDetail> =>
    api.get<CleaningPaymentDetail>(
      `/admin/move-in/cases/${caseId}/cleaning-payment`
    ),

  updateCase: (
    caseId: number,
    body: MoveInCaseUpdateRequest
  ): Promise<MoveInCaseDetail> =>
    api.patch<MoveInCaseDetail>(`/admin/move-in/cases/${caseId}`, body),

  resendPaymentRequest: (
    caseId: number
  ): Promise<MoveInPaymentRequestResendResponse> =>
    api.post<MoveInPaymentRequestResendResponse>(
      `/admin/move-in/cases/${caseId}/payment-request/resend`
    ),

  // ── 임차인 반품 요청 ──

  getRefundRequests: (
    params?: MoveInRefundRequestListParams
  ): Promise<MoveInRefundRequestListResponse> =>
    api.get<MoveInRefundRequestListResponse>('/admin/move-in/refund-requests', {
      params,
    }),

  approveRefundRequest: (
    requestId: number
  ): Promise<MoveInRefundApproveResponse> =>
    api.patch<MoveInRefundApproveResponse>(
      `/admin/move-in/refund-requests/${requestId}/approve`
    ),

  rejectRefundRequest: (
    requestId: number,
    rejectReason?: string
  ): Promise<MoveInRefundRejectResponse> =>
    api.patch<MoveInRefundRejectResponse>(
      `/admin/move-in/refund-requests/${requestId}/reject`,
      rejectReason ? { rejectReason } : {}
    ),

  // ── 게스트 주문 모니터링 ──

  getGuestOrders: (
    params?: MoveInGuestOrderListParams
  ): Promise<MoveInGuestOrderListResponse> =>
    api.get<MoveInGuestOrderListResponse>('/admin/move-in/guest-orders', {
      params,
    }),

  getGuestOrderDetail: (orderId: number): Promise<MoveInGuestOrderDetail> =>
    api.get<MoveInGuestOrderDetail>(`/admin/move-in/guest-orders/${orderId}`),

  updateGuestOrderDelivery: (
    orderId: number,
    body: MoveInGuestOrderDeliveryUpdateRequest
  ): Promise<MoveInGuestOrderDetail> =>
    api.patch<MoveInGuestOrderDetail>(
      `/admin/move-in/guest-orders/${orderId}/delivery`,
      body
    ),

  // ── 결제 통합 내역 ──

  getPayments: (
    params?: MoveInPaymentListParams
  ): Promise<MoveInPaymentListResponse> =>
    api.get<MoveInPaymentListResponse>('/admin/move-in/payments', { params }),
};
