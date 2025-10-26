/**
 * 관리자 인증 API 서비스
 */

import { api } from './api';

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminInfo {
  id: number;
  username: string;
  name: string;
  role: 'super_admin' | 'admin' | 'cs_admin';
  phoneNumber?: string;
  isActive: boolean;
  lastLoginAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminLoginResponse {
  admin: {
    id: number;
    username: string;
    name: string;
    role: string;
    lastLoginAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

/**
 * 관리자 로그인
 */
export const loginAdmin = async (
  credentials: AdminLoginRequest
): Promise<AdminLoginResponse> => {
  const response = await api.post<AdminLoginResponse>('/admin/auth/login', credentials);

  // 토큰 저장
  if (response.accessToken) {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
  }

  return response;
};

/**
 * 관리자 로그아웃
 */
export const logoutAdmin = async (): Promise<void> => {
  try {
    await api.post('/admin/auth/logout');
  } finally {
    // 토큰 삭제 (API 호출 실패해도 삭제)
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
};

/**
 * 현재 관리자 정보 조회
 */
export const getCurrentAdmin = async (): Promise<AdminInfo> => {
  return api.get<AdminInfo>('/admin/auth/me');
};

/**
 * 로그인 상태 확인
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
};

/**
 * 저장된 액세스 토큰 가져오기
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};
