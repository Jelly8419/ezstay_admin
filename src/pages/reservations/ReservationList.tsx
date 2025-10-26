import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockReservations } from '../../data/mockReservations';
import { Reservation, ReservationStatus } from '../../types';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';

export default function ReservationList() {
  const [reservations, setReservations] = useState<Reservation[]>(mockReservations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReservationStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터링
  const filteredReservations = reservations.filter((reservation) => {
    const matchesSearch =
      reservation.id.toString().includes(searchTerm) ||
      reservation.propertyTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reservation.guestName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || reservation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginatedReservations = filteredReservations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 예약 취소
  const handleCancel = (id: number) => {
    if (confirm('정말 이 예약을 취소하시겠습니까?')) {
      setReservations(
        reservations.map((r) => (r.id === id ? { ...r, status: 'cancelled' } : r))
      );
    }
  };

  const columns = [
    {
      key: 'id',
      title: '예약번호',
      render: (value: number) => `#${value}`,
      width: '8%',
    },
    {
      key: 'propertyTitle',
      title: '매물',
      render: (value: string) => (
        <div className="font-medium">{value}</div>
      ),
      width: '20%',
    },
    {
      key: 'guestName',
      title: '게스트',
      width: '10%',
    },
    {
      key: 'checkIn',
      title: '체크인',
      render: (value: string) => formatDate(value),
      width: '10%',
    },
    {
      key: 'checkOut',
      title: '체크아웃',
      render: (value: string) => formatDate(value),
      width: '10%',
    },
    {
      key: 'totalAmount',
      title: '금액',
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
      width: '10%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: ReservationStatus) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '8%',
    },
    {
      key: 'createdAt',
      title: '예약일',
      render: (value: string) => formatDate(value),
      width: '10%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, reservation: Reservation) => (
        <div className="flex gap-2">
          <Link to={`/reservations/${reservation.id}`}>
            <Button variant="secondary" size="sm">
              상세
            </Button>
          </Link>
          {reservation.status === 'confirmed' && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(reservation.id);
              }}
            >
              취소
            </Button>
          )}
        </div>
      ),
      width: '14%',
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
            placeholder="예약번호, 매물명, 게스트명으로 검색"
          />

          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ReservationStatus | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">전체</option>
              <option value="pending">대기</option>
              <option value="confirmed">확정</option>
              <option value="cancelled">취소</option>
              <option value="completed">완료</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            총 {filteredReservations.length}개의 예약
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={paginatedReservations} />
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
