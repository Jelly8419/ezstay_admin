import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Reservation, ReservationStatus, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { reservationService } from '../../services/reservationService';

const getStatusBadge = (status: string) => {
  const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }> = {
    PENDING_APPROVAL: { variant: 'warning', label: '승인 대기' },
    APPROVED: { variant: 'info', label: '승인됨' },
    PAYMENT_COMPLETED: { variant: 'success', label: '결제 완료' },
    IN_PROGRESS: { variant: 'success', label: '진행중' },
    COMPLETED: { variant: 'default', label: '완료' },
    CANCELLED: { variant: 'danger', label: '취소' },
    EXPIRED: { variant: 'default', label: '만료' },
    CANCEL_REQUESTED: { variant: 'warning', label: '취소 요청' },
    CANCELLED_BY_ADMIN_WITH_REFUND: { variant: 'danger', label: '관리자 취소(환불)' },
    CANCELLED_BY_ADMIN_WITHOUT_REFUND: { variant: 'danger', label: '관리자 취소' },
    CANCELLED_BY_HOST: { variant: 'danger', label: '호스트 취소' },
  };
  const config = map[status] || { variant: 'default' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function ContractList() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  const loadReservations = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reservationService.getReservations({
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });
      setReservations(response.reservations || []);
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('예약 목록 로드 실패:', err);
      setError('예약 목록을 불러오는데 실패했습니다.');
      setReservations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReservations();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadReservations();
  };

  const columns = [
    {
      key: 'id',
      title: '예약번호',
      render: (value: number) => `#${value}`,
      width: '8%',
    },
    {
      key: 'guest',
      title: '게스트',
      render: (value: any) => value?.name || '-',
      width: '10%',
    },
    {
      key: 'room',
      title: '매물',
      render: (value: any) => value?.roomName || '-',
      width: '15%',
    },
    {
      key: 'checkInDate',
      title: '체크인',
      render: (value: string) => value ? formatDate(value) : '-',
      width: '10%',
    },
    {
      key: 'checkOutDate',
      title: '체크아웃',
      render: (value: string) => value ? formatDate(value) : '-',
      width: '10%',
    },
    {
      key: 'totalAmount',
      title: '금액',
      render: (value: any) => (
        <span className="font-semibold">{value != null ? formatCurrency(value) : '-'}</span>
      ),
      width: '10%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: string) => getStatusBadge(value),
      width: '12%',
    },
    {
      key: 'createdAt',
      title: '예약일',
      render: (value: string) => value ? formatDate(value) : '-',
      width: '10%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, reservation: any) => (
        <div className="flex gap-2">
          <Link to={`/contracts/${reservation.id}`}>
            <Button variant="secondary" size="sm">
              상세
            </Button>
          </Link>
        </div>
      ),
      width: '12%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">예약 관리</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleSearch}
            placeholder="예약번호 또는 게스트명으로 검색"
          />

          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as ReservationStatus | 'all');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">전체</option>
              <option value="PENDING_APPROVAL">승인 대기</option>
              <option value="APPROVED">승인됨</option>
              <option value="PAYMENT_COMPLETED">결제 완료</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED">취소</option>
              <option value="EXPIRED">만료</option>
              <option value="CANCEL_REQUESTED">취소 요청</option>
              <option value="CANCELLED_BY_ADMIN_WITH_REFUND">관리자 취소(환불)</option>
              <option value="CANCELLED_BY_ADMIN_WITHOUT_REFUND">관리자 취소</option>
              <option value="CANCELLED_BY_HOST">호스트 취소</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            총 {pagination?.total ?? reservations.length}개의 예약
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadReservations}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={reservations} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
