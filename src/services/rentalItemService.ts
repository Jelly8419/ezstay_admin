/**
 * 옵션 상품 재고 관리 API 서비스
 * Base: /api/admin/rental-items
 */

import { api } from './api';
import type {
  RentalItem,
  RentalItemStat,
  RentalCalendarData,
  RentalCalendarBulkData,
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
   * - isActive: false → 게스트 화면 노출 차단
   */
  update: (id: number, body: RentalItemUpdateRequest) =>
    api.patch<RentalItem>(`/admin/rental-items/${id}`, body),

  /**
   * 날짜별 예약 현황 캘린더 조회 (단건)
   * - salesType === 'RENTAL' 아이템만 지원 (SALE 요청 시 400)
   * - RESERVED / CONFIRMED 상태 예약만 집계
   */
  getCalendar: (id: number, year: number, month: number) =>
    api.get<RentalCalendarData>(`/admin/rental-items/${id}/calendar`, { params: { year, month } }),

  /**
   * 날짜별 예약 현황 캘린더 일괄 조회
   * - RENTAL 타입 활성 아이템 전체를 DB 쿼리 2회로 반환
   */
  getCalendarBulk: (year: number, month: number) =>
    api.get<RentalCalendarBulkData>('/admin/rental-items/calendar', { params: { year, month } }),

  /**
   * 상품 삭제
   * - 대여 중인 수량이 있으면 서버에서 400(4007) 반환
   */
  delete: (id: number) =>
    api.delete<void>(`/admin/rental-items/${id}`),
};
