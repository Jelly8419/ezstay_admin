import { api } from './api';
import type {
  NotificationQueueStatsResponse,
  NotificationQueueContractResponse,
  NotificationMissingResponse,
  NotificationRecoverRequest,
  NotificationRecoverResponse,
} from '../types';

export const notificationQueueService = {
  getStats: () =>
    api.get<NotificationQueueStatsResponse>('/admin/notification-queue/stats'),

  getContractQueue: (contractId: number) =>
    api.get<NotificationQueueContractResponse>(
      `/admin/notification-queue/contract/${contractId}`
    ),

  getMissing: () =>
    api.get<NotificationMissingResponse>('/admin/notification-queue/missing'),

  recoverJob: (body: NotificationRecoverRequest) =>
    api.post<NotificationRecoverResponse>('/admin/notification-queue/recover', body),
};
