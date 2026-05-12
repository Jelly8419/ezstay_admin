/**
 * 방 관리 API 서비스
 */

import { api } from './api';
import type { Pagination, PropertySource, MoveInRoomReviewStatus, MoveInStatusHistory } from '../types';

// API 응답 타입 (백엔드 응답 구조)
export interface Property {
  id: number;
  roomName: string;
  address: string;
  detailAddress?: string;
  area: number;
  dailyRent: number | null;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published' | 'hidden_by_admin';
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  host: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
  };
  photos: Array<{
    id: number;
    url: string;
    displayOrder?: number;
  }>;

  // 입주 준비 방 (source=move_in)
  source?: PropertySource;
  reviewStatus?: MoveInRoomReviewStatus;
  dailyRentLabel?: string;
  areaPyeong?: number;
}

// 매물 상세 정보 타입 (심사용 - 민감정보 포함)
export interface PropertyDetail extends Property {
  // 위치 정보
  latitude?: number;
  longitude?: number;
  floor?: string;
  buildingType?: string;
  entrancePassword?: string;

  // 방 구조
  maxGuests?: number;
  parkingAvailable?: boolean;
  parkingInfo?: string;
  elevatorAvailable?: boolean;
  roomCount?: number;
  bathroomCount?: number;
  livingRoomCount?: number;
  kitchenCount?: number;
  isDuplex?: boolean;

  // 요금 정보 (상세)
  dailyMaintenanceFee?: number;
  maintenanceDetail?: string;
  longTermWeeks?: number;
  longTermDiscount?: number;
  quickMoveIn?: string;
  quickMoveInDiscount?: number;
  includeElectricity?: boolean;
  includeWater?: boolean;
  includeGas?: boolean;
  includeInternet?: boolean;
  cleaningFee?: number;
  minContractWeeks?: number;
  refundPolicy?: string;

  // 편의시설 (string 배열로 변경)
  amenities?: {
    basicOptions?: string[];
    additionalOptions?: string[];
    convenienceOptions?: string[];
    petsAllowed?: boolean;
  };

  // EZ서비스 (freeServices → ezService)
  ezService?: {
    agreeTerms?: boolean;
    cleaningService?: boolean;
    cleaningToolImageUrl?: string;
    hairDryerRental?: boolean;
    beddingService?: boolean;
    bedSizes?: {
      superSingle?: number;
      queen?: number;
      king?: number;
    };
    amenityKit?: boolean;
    autoPasswordChange?: boolean;
    roomPassword?: string | null;
  };

  // 입실/퇴실 시간
  checkInTime?: string;
  checkOutTime?: string;

  // 방 소개
  description?: string;
  transportation?: string;
  houseRules?: string;

  // 호스트 상세 정보
  host: {
    id: number;
    name: string;
    nickname: string;
    email: string;
    phoneNumber: string;
    phoneVerified?: boolean;
    hasBankAccount?: boolean;
  };

  // 등록 진행 상황
  registrationProgress?: {
    currentStep?: string;
    completionRate?: number;
    completedSteps?: string[];
    requiredSteps?: string[];
  };

  // 게시 정보
  publishedAt?: string;
  updatedAt?: string;

  // 입주 준비 방 전용 (source=move_in)
  commonEntrancePassword?: string | null;
  doorLockPassword?: string | null;
  bedCount?: number;
  beds?: Array<{
    index: number;
    size: 'SINGLE' | 'SUPER_SINGLE' | 'DOUBLE' | 'QUEEN' | 'KING';
  }>;
  cleaningSuppliesAvailable?: boolean;
  cleaningSuppliesLocation?: string | null;
  memo?: string | null;
  statusHistories?: MoveInStatusHistory[];
}

// 매물 목록 응답 타입
export interface PropertyListResponse {
  properties: Property[];
  pagination: Pagination;
}

// 매물 목록 조회 파라미터
export interface PropertyListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  source?: PropertySource | 'all';
}

const sourceQuery = (source?: PropertySource): string =>
  source ? `source=${source}` : '';

const withSource = (path: string, source?: PropertySource): string => {
  if (!source) return path;
  const sep = path.includes('?') ? '&' : '?';
  return `${path}${sep}source=${source}`;
};

export const propertyService = {
  /**
   * 매물 목록 조회
   */
  getProperties: (params: PropertyListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<PropertyListResponse>(
      `/admin/properties${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 심사 대기 매물 조회
   */
  getPendingReviewProperties: (page = 1, limit = 20, source?: PropertySource) => {
    const sourcePart = sourceQuery(source);
    const query = `page=${page}&limit=${limit}${sourcePart ? `&${sourcePart}` : ''}`;
    return api.get<PropertyListResponse>(
      `/admin/properties/pending-review?${query}`
    );
  },

  /**
   * 매물 상세 조회 (심사용 - 민감정보 포함)
   */
  getPropertyDetail: (roomId: number, source?: PropertySource) =>
    api.get<PropertyDetail>(withSource(`/admin/properties/${roomId}`, source)),

  /**
   * 매물 승인
   */
  approveProperty: (roomId: number, source?: PropertySource) =>
    api.post<Property>(withSource(`/admin/properties/${roomId}/approve`, source)),

  /**
   * 매물 반려
   */
  rejectProperty: (roomId: number, rejectionReason: string, source?: PropertySource) =>
    api.post<Property>(withSource(`/admin/properties/${roomId}/reject`, source), {
      rejectionReason,
    }),
};
