/**
 * 방 관리 API 서비스
 */

import { api } from './api';
import { Pagination } from './userService';

// API 응답 타입 (백엔드 응답 구조)
export interface Property {
  id: number;
  roomName: string;
  address: string;
  detailAddress?: string;
  area: number;
  dailyRent: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'published';
  submittedAt?: string;
  approvedAt?: string;
  rejectionReason?: string;
  createdAt: string;
  host: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  photos: Array<{
    id: number;
    url: string;
    displayOrder?: number;
  }>;
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

  // 편의시설
  amenities?: {
    basicOptions?: {
      bed?: boolean;
      desk?: boolean;
      closet?: boolean;
      shoeRack?: boolean;
    };
    additionalOptions?: {
      airConditioner?: boolean;
      refrigerator?: boolean;
      washingMachine?: boolean;
      tv?: boolean;
    };
    convenienceOptions?: {
      wifi?: boolean;
      microwave?: boolean;
      inductionStove?: boolean;
    };
    petsAllowed?: boolean;
  };

  // 무료 부가서비스
  freeServices?: {
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

  // 방 소개
  description?: string;
  transportation?: string;
  houseRules?: string;

  // 호스트 상세 정보
  host: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
    isVerified?: boolean;
    hasBankAccount?: boolean;
  };

  // 등록 진행 상황
  registrationProgress?: {
    currentStep?: string;
    completionRate?: number;
    steps?: {
      basicInfo?: boolean;
      pricing?: boolean;
      photosAndAmenities?: boolean;
      freeServices?: boolean;
      description?: boolean;
    };
  };

  // 게시 정보
  publishedAt?: string;
  updatedAt?: string;
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
}

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
  getPendingReviewProperties: (page = 1, limit = 20) => {
    return api.get<PropertyListResponse>(
      `/admin/properties/pending-review?page=${page}&limit=${limit}`
    );
  },

  /**
   * 매물 상세 조회 (심사용 - 민감정보 포함)
   */
  getPropertyDetail: (roomId: number) =>
    api.get<PropertyDetail>(`/admin/properties/${roomId}`),

  /**
   * 매물 승인
   */
  approveProperty: (roomId: number) =>
    api.post<Property>(`/admin/properties/${roomId}/approve`),

  /**
   * 매물 반려
   */
  rejectProperty: (roomId: number, rejectionReason: string) =>
    api.post<Property>(`/admin/properties/${roomId}/reject`, {
      rejectionReason,
    }),
};
