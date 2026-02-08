/**
 * 유저 관리 API 서비스
 */

import { api } from './api';
import type { User, UserDetail } from '../types';

// 유저 목록 조회 파라미터
export interface UserListParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: 'local' | 'social';
  isActive?: 'true' | 'false';
  role?: 'host' | 'guest';
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

    return api.get<{ users: User[]; pagination: { total: number; page: number; limit: number; totalPages: number } }>(
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
