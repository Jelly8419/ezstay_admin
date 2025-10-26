/**
 * 유저 관리 API 서비스
 */

import { api } from './api';

// 유저 타입
export interface User {
  id: number;
  email: string;
  name: string;
  phoneNumber: string;
  phoneVerified: boolean;
  phoneVerifiedAt?: string;
  profileImageUrl?: string;
  userType: 'local' | 'social';
  isActive: boolean;
  lastLoginAt?: string;
  serviceTermsAgreed: boolean;
  privacyPolicyAgreed: boolean;
  marketingConsent: boolean;
  ageConfirmed: boolean;
  termsAgreedAt?: string;
  isAdmin: boolean;
  adminRole?: string | null;
  createdAt: string;
  updatedAt: string;
}

// 유저 상세 타입
export interface UserDetail extends User {
  rooms?: Array<{
    id: number;
    roomName: string;
    status: string;
    createdAt: string;
  }>;
  hostRoomsCount?: number;
  guestReservationsCount?: number;
}

// 페이지네이션 타입
export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 유저 목록 응답 타입
export interface UserListResponse {
  users: User[];
  pagination: Pagination;
}

// 유저 목록 조회 파라미터
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: 'local' | 'social';
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const userService = {
  /**
   * 유저 목록 조회
   */
  getUsers: (params: UserListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<UserListResponse>(
      `/admin/users${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 유저 상세 조회
   */
  getUserDetail: (userId: number) =>
    api.get<UserDetail>(`/admin/users/${userId}`),

  /**
   * 유저 상태 변경
   */
  updateUserStatus: (userId: number, isActive: boolean) =>
    api.patch<User>(`/admin/users/${userId}/status`, { isActive }),
};
