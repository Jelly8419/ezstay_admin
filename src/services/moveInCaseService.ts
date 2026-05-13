import { api } from './api';
import type {
  MoveInCaseDetail,
  MoveInCaseListParams,
  MoveInCaseListResponse,
  MoveInCaseUpdateRequest,
  MoveInPaymentRequestResendResponse,
} from '../types';

export const moveInCaseService = {
  getCases: (params?: MoveInCaseListParams): Promise<MoveInCaseListResponse> =>
    api.get<MoveInCaseListResponse>('/admin/move-in/cases', { params }),

  getCaseDetail: (caseId: number): Promise<MoveInCaseDetail> =>
    api.get<MoveInCaseDetail>(`/admin/move-in/cases/${caseId}`),

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
};
