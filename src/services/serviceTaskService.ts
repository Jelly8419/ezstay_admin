import { api } from './api';
import type {
  ServiceTask,
  ServiceTaskDetail,
  ServiceTaskListParams,
  ServiceTaskListResponse,
  ServiceTaskUpdateRequest,
} from '../types';

export const serviceTaskService = {
  getTasks: (params?: ServiceTaskListParams): Promise<ServiceTaskListResponse> => {
    return api.get<ServiceTaskListResponse>('/admin/service-tasks', { params });
  },

  getTaskDetail: (id: number): Promise<ServiceTaskDetail> =>
    api.get<ServiceTaskDetail>(`/admin/service-tasks/${id}`),

  updateStatus: (id: number, body: ServiceTaskUpdateRequest): Promise<ServiceTask> => {
    return api.patch<ServiceTask>(`/admin/service-tasks/${id}/status`, body);
  },
};
