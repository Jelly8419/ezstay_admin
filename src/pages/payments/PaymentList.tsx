import { useState } from 'react';
import { mockPayments } from '../../data/mockPayments';
import { Payment, PaymentStatus, PaymentMethod } from '../../types';
import { formatCurrency, formatDateTime, getStatusColor, getStatusText } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>(mockPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터링
  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.id.toString().includes(searchTerm) ||
      payment.reservationId.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;

    return matchesSearch && matchesStatus && matchesMethod;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 환불 처리
  const handleRefund = (id: number) => {
    if (confirm('정말 이 결제를 환불하시겠습니까?')) {
      setPayments(
        payments.map((p) => (p.id === id ? { ...p, status: 'refunded' } : p))
      );
    }
  };

  const columns = [
    {
      key: 'id',
      title: '결제번호',
      render: (value: number) => `#${value}`,
      width: '10%',
    },
    {
      key: 'reservationId',
      title: '예약번호',
      render: (value: number) => `#${value}`,
      width: '10%',
    },
    {
      key: 'amount',
      title: '금액',
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
      width: '15%',
    },
    {
      key: 'method',
      title: '결제수단',
      render: (value: PaymentMethod) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '12%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: PaymentStatus) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '12%',
    },
    {
      key: 'paidAt',
      title: '결제일시',
      render: (value: string) => formatDateTime(value),
      width: '18%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, payment: Payment) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            상세
          </Button>
          {payment.status === 'success' && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleRefund(payment.id);
              }}
            >
              환불
            </Button>
          )}
        </div>
      ),
      width: '18%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">결제 관리</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="결제번호, 예약번호로 검색"
          />

          <div className="flex gap-4">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">상태:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="success">성공</option>
                <option value="failed">실패</option>
                <option value="refunded">환불</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">결제수단:</label>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="card">카드</option>
                <option value="bank">계좌이체</option>
                <option value="virtual">가상계좌</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            총 {filteredPayments.length}개의 결제 내역
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={paginatedPayments} />
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
