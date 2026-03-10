import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Table } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import {
  Users,
  Home,
  CalendarCheck,
  CreditCard,
  Wallet,
  MessageSquare,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { dashboardService, DashboardStats, RecentActivity } from '../services/dashboardService';

const getReservationStatus = (status: string): { variant: 'warning' | 'success' | 'danger' | 'default'; label: string } => {
  const statusMap: Record<string, { variant: 'warning' | 'success' | 'danger' | 'default'; label: string }> = {
    PENDING_APPROVAL: { variant: 'warning', label: '승인대기' },
    APPROVED: { variant: 'warning', label: '승인됨' },
    PAYMENT_COMPLETED: { variant: 'success', label: '결제완료' },
    IN_PROGRESS: { variant: 'success', label: '진행중' },
    COMPLETED: { variant: 'default', label: '완료' },
    CANCELLED_BY_GUEST: { variant: 'danger', label: '게스트취소' },
    CANCELLED_BY_HOST: { variant: 'danger', label: '호스트취소' },
  };
  return statusMap[status] || { variant: 'default', label: status };
};

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [statsData, activitiesData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivities(),
      ]);
      setStats(statsData);
      setRecentActivities(activitiesData);
    } catch (err) {
      console.error('대시보드 데이터 로드 실패:', err);
      setError('대시보드 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error || !stats || !recentActivities) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-900 font-semibold mb-2">데이터 로드 실패</p>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const reservationColumns = [
    {
      key: 'room',
      title: '방',
      render: (value: any) => (
        <div className="font-medium text-gray-900">{value?.roomName ?? '-'}</div>
      )
    },
    {
      key: 'guest',
      title: '게스트',
      render: (value: any) => value?.name ?? '-'
    },
    {
      key: 'totalAmount',
      title: '금액',
      render: (value: any) => value != null ? `₩${Number(value).toLocaleString()}` : '-'
    },
    {
      key: 'status',
      title: '상태',
      render: (value: string) => {
        const { variant, label } = getReservationStatus(value);
        return <Badge variant={variant}>{label}</Badge>;
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-500 mt-2">EZstay 관리자 시스템 현황을 한눈에 확인하세요</p>
      </div>

      {/* Main Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="전체 사용자"
          value={(stats.totalUsers ?? 0).toLocaleString()}
          icon={Users}
          trend={stats.trends?.user}
          iconColor="text-blue-600"
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="등록 방"
          value={(stats.totalProperties ?? 0).toLocaleString()}
          icon={Home}
          trend={stats.trends?.property}
          iconColor="text-green-600"
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="활성 예약"
          value={(stats.activeReservations ?? 0).toLocaleString()}
          icon={CalendarCheck}
          trend={stats.trends?.reservation}
          iconColor="text-purple-600"
          iconBgColor="bg-purple-100"
        />
        <StatCard
          title="월 매출"
          value={`₩${((stats.monthlyRevenue?.total ?? 0) / 10000).toFixed(0)}만`}
          icon={TrendingUp}
          trend={stats.trends?.revenue}
          iconColor="text-orange-600"
          iconBgColor="bg-orange-100"
        />
      </div>

      {/* 매출 상세 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">이번 달 매출</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">계약 매출</dt>
              <dd className="font-semibold">₩{(stats.monthlyRevenue?.contract ?? 0).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">렌탈 매출</dt>
              <dd className="font-semibold">₩{(stats.monthlyRevenue?.rental ?? 0).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-t pt-3">
              <dt className="text-gray-900 font-semibold">합계</dt>
              <dd className="text-lg font-bold text-primary-600">₩{(stats.monthlyRevenue?.total ?? 0).toLocaleString()}</dd>
            </div>
          </dl>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">지난 달 매출</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">계약 매출</dt>
              <dd className="font-semibold">₩{(stats.lastMonthRevenue?.contract ?? 0).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">렌탈 매출</dt>
              <dd className="font-semibold">₩{(stats.lastMonthRevenue?.rental ?? 0).toLocaleString()}</dd>
            </div>
            <div className="flex justify-between border-t pt-3">
              <dt className="text-gray-900 font-semibold">합계</dt>
              <dd className="text-lg font-bold text-gray-600">₩{(stats.lastMonthRevenue?.total ?? 0).toLocaleString()}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* Action Required Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => navigate('/properties/review')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">방 심사 대기</h3>
                <p className="text-sm text-gray-500">승인이 필요한 방이 있습니다</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.pendingReviews ?? 0}
            </div>
          </div>
        </Card>

        <Card>
          <div
            className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors"
            onClick={() => navigate('/inquiries')}
          >
            <div className="flex items-center gap-3">
              <div className="bg-red-100 p-3 rounded-lg">
                <MessageSquare className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">미답변 문의</h3>
                <p className="text-sm text-gray-500">답변이 필요한 문의가 있습니다</p>
              </div>
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats.pendingInquiries ?? 0}
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reservations */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 예약</h2>
            <button
              onClick={() => navigate('/reservations')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              전체보기 →
            </button>
          </div>
          {recentActivities.recentReservations.length > 0 ? (
            <Table
              columns={reservationColumns}
              data={recentActivities.recentReservations}
              onRowClick={(row) => navigate(`/reservations/${row.id}`)}
            />
          ) : (
            <div className="text-center py-8 text-gray-500">
              최근 예약이 없습니다.
            </div>
          )}
        </Card>

        {/* Recent Inquiries */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">최근 문의</h2>
            <button
              onClick={() => navigate('/inquiries')}
              className="text-sm text-primary-600 hover:text-primary-700 font-medium"
            >
              전체보기 →
            </button>
          </div>
          {recentActivities.recentInquiries.length > 0 ? (
            <div className="text-center py-8 text-gray-500">
              문의 데이터가 준비 중입니다.
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              최근 문의가 없습니다.
            </div>
          )}
        </Card>
      </div>

      {/* Quick Links */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 메뉴</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/users')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
          >
            <Users className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">유저 관리</span>
          </button>
          <button
            onClick={() => navigate('/properties')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
          >
            <Home className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">방 관리</span>
          </button>
          <button
            onClick={() => navigate('/payments')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
          >
            <CreditCard className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">결제 관리</span>
          </button>
          <button
            onClick={() => navigate('/settlements')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-primary-300 transition-colors"
          >
            <Wallet className="w-8 h-8 text-primary-600 mb-2" />
            <span className="text-sm font-medium text-gray-900">정산 관리</span>
          </button>
        </div>
      </Card>
    </div>
  );
};
