/**
 * 예약 관리 API 서비스
 */

import { api } from './api';
import { Pagination } from './userService';

// 예약 타입
export interface Reservation {
  id: number;
  status:
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'REJECTED'
    | 'PAYMENT_COMPLETED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED_BY_GUEST'
    | 'CANCELLED_BY_HOST'
    | 'REFUNDED'
    | 'APPROVAL_EXPIRED'
    | 'PAYMENT_EXPIRED';
  checkInDate: string;
  checkOutDate: string;
  totalDays: number;
  rentalFee: number;
  maintenanceFee: number;
  cleaningFee: number;
  platformFee: number;
  discountAmount: number;
  finalTotalAmount: number;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  guest: {
    id: number;
    name: string;
    email: string;
    phoneNumber: string;
  };
  host: {
    id: number;
    name: string;
    email: string;
  };
  room: {
    id: number;
    roomName: string;
    address: string;
  };
}

// 예약 상세 타입
export interface ReservationDetail extends Reservation {
  totalWeeks: number;
  rentalItemsFee: number;
  discountType?: string;
  discountCode?: string | null;
  subtotal: number;
  totalUsageFee: number;
  deposit: number;
  rentalItems?: Array<{
    itemType: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  installmentMonths: number;
  guestMessage?: string;
  hostMessage?: string;
  specialRequests?: {
    earlyCheckIn: boolean;
    lateCheckOut: boolean;
  };
  termsAgreed?: {
    serviceTerms: boolean;
    cancellationPolicy: boolean;
  };
  pricingSnapshot?: {
    dailyRent: number;
    dailyMaintenanceFee: number;
    longTermDiscount: number;
  };
  approvedAt?: string;
  updatedAt: string;
}

// 예약 목록 응답 타입
export interface ReservationListResponse {
  reservations: Reservation[];
  pagination: Pagination;
}

// 예약 목록 조회 파라미터
export interface ReservationListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const reservationService = {
  /**
   * 예약 목록 조회
   */
  getReservations: (params: ReservationListParams = {}) => {
    const queryString = new URLSearchParams(
      Object.entries(params)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, String(value)])
    ).toString();

    return api.get<ReservationListResponse>(
      `/admin/reservations${queryString ? `?${queryString}` : ''}`
    );
  },

  /**
   * 예약 상세 조회
   */
  getReservationDetail: (contractId: number) =>
    api.get<ReservationDetail>(`/admin/reservations/${contractId}`),
};
