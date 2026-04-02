import { api } from './api';
import type {
  NotificationQueueStatsResponse,
  NotificationQueueContractResponse,
} from '../types';

export const notificationQueueService = {
  getStats: () =>
    api.get<NotificationQueueStatsResponse>('/admin/notification-queue/stats'),

  getContractQueue: (contractId: number) =>
    api.get<NotificationQueueContractResponse>(
      `/admin/notification-queue/contract/${contractId}`
    ),
};
