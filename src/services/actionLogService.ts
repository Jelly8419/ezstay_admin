/**
 * 관리자 액션 로그 API 서비스
 */

import { api } from './api';
import type {
  AdminActionLog,
  AdminActionLogFilter,
  AdminActionLogStats,
  Pagination,
} from '../types';

// 액션 로그 목록 응답 타입
export interface ActionLogListResponse {
  logs: AdminActionLog[];
  pagination: Pagination;
}

export const actionLogService = {
  /**
   * 액션 로그 목록 조회
   */
  getActionLogs: (params: AdminActionLogFilter = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<ActionLogListResponse>(
      `/admin/action-logs${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 액션 로그 통계 조회
   */
  getActionLogStats: (params?: { startDate?: string; endDate?: string }) => {
    const queryString = params
      ? new URLSearchParams(
          Object.entries(params)
            .filter(([, value]) => value !== undefined)
            .map(([key, value]) => [key, String(value)])
        ).toString()
      : '';

    return api.get<AdminActionLogStats>(
      `/admin/action-logs/stats${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 액션 로그 상세 조회
   */
  getActionLogDetail: (logId: number) =>
    api.get<AdminActionLog>(`/admin/action-logs/${logId}`),
};
