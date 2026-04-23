import { api } from './api';
import type {
  BrokerListResponse,
  BrokerListParams,
  BrokerDetailResponse,
  BrokerCreateRequest,
  BrokerUpdateRequest,
  BrokerRate,
  BrokerRateAddRequest,
  BrokerHostMapping,
  BrokerHostAddRequest,
} from '../types';

export const brokerService = {
  list: (params: BrokerListParams = {}) =>
    api.get<BrokerListResponse>('/admin/brokers', { params }),

  get: (id: number) =>
    api.get<BrokerDetailResponse>(`/admin/brokers/${id}`),

  create: (body: BrokerCreateRequest) =>
    api.post<{ brokerId: number }>('/admin/brokers', body),

  update: (id: number, body: BrokerUpdateRequest) =>
    api.patch<{ brokerId: number }>(`/admin/brokers/${id}`, body),

  getRates: (id: number) =>
    api.get<{ rates: BrokerRate[] }>(`/admin/brokers/${id}/rates`),

  addRate: (id: number, body: BrokerRateAddRequest) =>
    api.post<{ rateId: number }>(`/admin/brokers/${id}/rates`, body),

  getHosts: (id: number) =>
    api.get<{ hostMappings: BrokerHostMapping[] }>(
      `/admin/brokers/${id}/hosts`
    ),

  addHost: (id: number, body: BrokerHostAddRequest) =>
    api.post<{ mappingId: number }>(`/admin/brokers/${id}/hosts`, body),

  removeHost: (id: number, hostId: number) =>
    api.delete<{ mappingId: number }>(
      `/admin/brokers/${id}/hosts/${hostId}`
    ),
};
