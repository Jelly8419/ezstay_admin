import { api } from './api';
import type {
  PromotionListResponse,
  PromotionEvent,
  PromotionCreateRequest,
  PromotionUpdateRequest,
  PromotionParticipantListResponse,
  PromotionBenefitListResponse,
} from '../types';

export const promotionService = {
  getPromotions: () =>
    api.get<PromotionListResponse>('/admin/promotions'),

  getPromotion: (id: number) =>
    api.get<PromotionEvent>(`/admin/promotions/${id}`),

  createPromotion: (body: PromotionCreateRequest) =>
    api.post<{ id: number }>('/admin/promotions', body),

  updatePromotion: (id: number, body: PromotionUpdateRequest) =>
    api.patch<{ id: number }>(`/admin/promotions/${id}`, body),

  getParticipants: (id: number) =>
    api.get<PromotionParticipantListResponse>(`/admin/promotions/${id}/participants`),

  getBenefits: (id: number) =>
    api.get<PromotionBenefitListResponse>(`/admin/promotions/${id}/benefits`),
};
