import { api } from './api';
import type {
  ServiceTask,
  ServiceTaskDetail,
  ServiceTaskListParams,
  ServiceTaskListResponse,
  ServiceTaskSource,
  ServiceTaskUpdateRequest,
} from '../types';

export const serviceTaskService = {
  getTasks: (params?: ServiceTaskListParams): Promise<ServiceTaskListResponse> => {
    return api.get<ServiceTaskListResponse>('/admin/service-tasks', { params });
  },

  getTaskDetail: (
    id: number,
    source: ServiceTaskSource = 'internal'
  ): Promise<ServiceTaskDetail> =>
    api.get<ServiceTaskDetail>(`/admin/service-tasks/${id}`, {
      params: { source },
    }),

  updateStatus: (
    id: number,
    body: ServiceTaskUpdateRequest,
    source: ServiceTaskSource = 'internal'
  ): Promise<ServiceTask> => {
    const query = `?source=${encodeURIComponent(source)}`;
    return api.patch<ServiceTask>(`/admin/service-tasks/${id}/status${query}`, body);
  },
};
