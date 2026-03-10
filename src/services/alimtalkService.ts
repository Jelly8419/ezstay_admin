/**
 * 알림톡 관리 API 서비스
 */

import { api } from './api';
import type {
  AlimtalkTemplateListResponse,
  AlimtalkTemplateSyncResponse,
  AlimtalkLog,
  AlimtalkLogListParams,
  AlimtalkStatsResponse,
} from '../types';

export interface AlimtalkLogPagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
}

export interface AlimtalkLogListResponse {
  logs: AlimtalkLog[];
  pagination: AlimtalkLogPagination;
}

export const alimtalkService = {
  /**
   * 알림톡 템플릿 목록 조회
   */
  getTemplates: () =>
    api.get<AlimtalkTemplateListResponse>('/admin/alimtalk/templates'),

  /**
   * 알림톡 템플릿 캐시 수동 갱신
   */
  syncTemplates: () =>
    api.post<AlimtalkTemplateSyncResponse>('/admin/alimtalk/templates/sync'),

  /**
   * 알림톡 발송 이력 조회
   */
  getLogs: (params: AlimtalkLogListParams = {}) =>
    api.get<AlimtalkLogListResponse>('/admin/alimtalk/logs', { params }),

  /**
   * 알림톡 발송 통계
   */
  getStats: (params: { startDate?: string; endDate?: string } = {}) =>
    api.get<AlimtalkStatsResponse>('/admin/alimtalk/stats', { params }),

  /**
   * 알림톡 수동 재시도
   */
  retryLog: (logId: number) =>
    api.post<{ logId: number; retried: boolean }>(`/admin/alimtalk/logs/${logId}/retry`),
};
