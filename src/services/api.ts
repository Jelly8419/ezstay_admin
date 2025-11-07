/**
 * API 기본 설정 및 공통 유틸리티
 */

const API_BASE_URL = (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

interface ApiError {
  success: false;
  code: number;
  message: string;
}

/**
 * API 요청 헬퍼 함수
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = localStorage.getItem('accessToken');

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return (data as ApiResponse<T>).data;
  } catch (error) {
    console.error('API 요청 실패:', error);
    throw error;
  }
}

/**
 * Query params를 URL에 추가하는 헬퍼 함수
 */
function buildQueryString(params: Record<string, any>): string {
  const query = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  return query ? `?${query}` : '';
}

export const api = {
  get: <T>(endpoint: string, options?: { params?: Record<string, any> }) => {
    const queryString = options?.params ? buildQueryString(options.params) : '';
    return apiRequest<T>(`${endpoint}${queryString}`, { method: 'GET' });
  },

  post: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T>(endpoint: string, body?: unknown) =>
    apiRequest<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: 'DELETE' }),
};

export type { ApiResponse, ApiError };
