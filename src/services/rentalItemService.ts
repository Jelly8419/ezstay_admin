/**
 * 옵션 상품 재고 관리 API 서비스
 * Base: /api/admin/rental-items
 */

import { api } from './api';
import type {
  RentalItem,
  RentalItemStat,
  RentalItemCreateRequest,
  RentalItemUpdateRequest,
  RentalItemType,
} from '../types';

export interface RentalItemListParams {
  itemType?: RentalItemType;
  isActive?: boolean;
}

export const rentalItemService = {
  /**
   * 상품 목록 조회
   */
  getList: (params: RentalItemListParams = {}) =>
    api.get<RentalItem[]>('/admin/rental-items', { params }),

  /**
   * 카테고리별 재고 통계
   */
  getStats: () =>
    api.get<RentalItemStat[]>('/admin/rental-items/stats'),

  /**
   * 상품 단건 조회
   */
  getDetail: (id: number) =>
    api.get<RentalItem>(`/admin/rental-items/${id}`),

  /**
   * 상품 등록
   */
  create: (body: RentalItemCreateRequest) =>
    api.post<RentalItem>('/admin/rental-items', body),

  /**
   * 상품 정보 수정 (부분 수정)
   * - totalStock 수정 시 rentedStock보다 낮으면 서버에서 400 반환
   * - isActive: false → 게스트 화면 노출 차단
   */
  update: (id: number, body: RentalItemUpdateRequest) =>
    api.patch<RentalItem>(`/admin/rental-items/${id}`, body),

  /**
   * 재고 수량 수동 조정
   * - availableStock 직접 지정 (분실/파손 등 예외 상황)
   * - 범위: 0 이상, totalStock 이하
   */
  adjustStock: (id: number, availableStock: number) =>
    api.patch<RentalItem>(`/admin/rental-items/${id}/stock`, { availableStock }),

  /**
   * 상품 삭제
   * - rentedStock > 0 이면 서버에서 400(4007) 반환
   */
  delete: (id: number) =>
    api.delete<void>(`/admin/rental-items/${id}`),
};
