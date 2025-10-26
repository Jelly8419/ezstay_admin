/**
 * 대시보드 API 서비스
 */

import { api } from './api';

// 대시보드 통계 타입
export interface DashboardStats {
  totalUsers: number;
  totalProperties: number;
  activeReservations: number;
  monthlyRevenue: number;
  pendingReviews: number;
  pendingInquiries: number;
  trends: {
    user: { value: number; isPositive: boolean };
    property: { value: number; isPositive: boolean };
    reservation: { value: number; isPositive: boolean };
    revenue: { value: number; isPositive: boolean };
  };
}

// 최근 활동 타입
export interface RecentActivity {
  recentReservations: Array<{
    id: number;
    status: string;
    checkInDate: string;
    checkOutDate: string;
    finalTotalAmount: number;
    guest: {
      id: number;
      name: string;
      email: string;
    };
    room: {
      id: number;
      roomName: string;
      address: string;
    };
    createdAt: string;
  }>;
  recentInquiries: Array<unknown>;
}

export const dashboardService = {
  /**
   * 대시보드 통계 조회
   */
  getStats: () => api.get<DashboardStats>('/admin/dashboard/stats'),

  /**
   * 최근 활동 조회
   */
  getRecentActivities: () =>
    api.get<RecentActivity>('/admin/dashboard/recent-activities'),
};
