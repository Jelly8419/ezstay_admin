/**
 * 매물 관리 API 서비스
 */

import { api } from './api';
import { Pagination } from './userService';

// 매물 타입
export interface Property {
  id: number;
  roomName: string;
  address: string;
  detailAddress?: string;
  area: number;
  dailyRent: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  host: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  photos: Array<{
    id: number;
    photoUrl: string;
    displayOrder?: number;
  }>;
}

// 매물 목록 응답 타입
export interface PropertyListResponse {
  properties: Property[];
  pagination: Pagination;
}

// 매물 목록 조회 파라미터
export interface PropertyListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const propertyService = {
  /**
   * 매물 목록 조회
   */
  getProperties: (params: PropertyListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<PropertyListResponse>(
      `/admin/properties${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 심사 대기 매물 조회
   */
  getPendingReviewProperties: (page = 1, limit = 20) => {
    return api.get<PropertyListResponse>(
      `/admin/properties/pending-review?page=${page}&limit=${limit}`
    );
  },

  /**
   * 매물 승인
   */
  approveProperty: (roomId: number) =>
    api.post<Property>(`/admin/properties/${roomId}/approve`),

  /**
   * 매물 반려
   */
  rejectProperty: (roomId: number, rejectionReason: string) =>
    api.post<Property>(`/admin/properties/${roomId}/reject`, {
      rejectionReason,
    }),
};
