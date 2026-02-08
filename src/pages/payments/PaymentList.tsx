import { useState, useEffect } from 'react';
import type { Payment, PaymentStatus, PaymentMethod, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { paymentService } from '../../services/paymentService';

const getPaymentStatusBadge = (status: string) => {
  const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }> = {
    READY: { variant: 'default', label: '준비' },
    IN_PROGRESS: { variant: 'warning', label: '진행중' },
    DONE: { variant: 'success', label: '완료' },
    CANCELED: { variant: 'danger', label: '취소' },
    PARTIAL_CANCELED: { variant: 'warning', label: '부분취소' },
    ABORTED: { variant: 'danger', label: '중단' },
    EXPIRED: { variant: 'default', label: '만료' },
  };
  const config = map[status] || { variant: 'default' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getPaymentMethodLabel = (method: string) => {
  const map: Record<string, string> = {
    CARD: '카드',
    VIRTUAL_ACCOUNT: '가상계좌',
    TRANSFER: '계좌이체',
    MOBILE: '휴대폰',
    EASY_PAY: '간편결제',
  };
  return map[method] || method;
};

export default function PaymentList() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 20;

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getPayments({
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(methodFilter !== 'all' && { method: methodFilter }),
        ...(searchTerm && { search: searchTerm }),
      });
      setPayments(response.payments || []);
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('결제 목록 로드 실패:', err);
      setError('결제 목록을 불러오는데 실패했습니다.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [currentPage, statusFilter, methodFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadPayments();
  };

  const columns = [
    {
      key: 'id',
      title: '결제번호',
      render: (value: number) => `#${value}`,
      width: '7%',
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
      width: '13%',
    },
    {
      key: 'totalAmount',
      title: '결제금액',
      render: (value: any) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
      width: '12%',
    },
    {
      key: 'balanceAmount',
      title: '잔액',
      render: (value: any) => formatCurrency(value),
      width: '10%',
    },
    {
      key: 'method',
      title: '결제수단',
      render: (value: string) => getPaymentMethodLabel(value),
      width: '10%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: string) => getPaymentStatusBadge(value),
      width: '10%',
    },
    {
      key: 'approvedAt',
      title: '승인일시',
      render: (value: string | null) => value ? formatDateTime(value) : '-',
      width: '13%',
    },
    {
      key: 'actions',
      title: '액션',
      render: () => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            상세
          </Button>
        </div>
      ),
      width: '10%',
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
            onSearch={handleSearch}
            placeholder="결제번호, 계약번호, paymentKey, orderId로 검색"
          />

          <div className="flex gap-4">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">상태:</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as PaymentStatus | 'all');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="READY">준비</option>
                <option value="IN_PROGRESS">진행중</option>
                <option value="DONE">완료</option>
                <option value="CANCELED">취소</option>
                <option value="PARTIAL_CANCELED">부분취소</option>
                <option value="ABORTED">중단</option>
                <option value="EXPIRED">만료</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">결제수단:</label>
              <select
                value={methodFilter}
                onChange={(e) => {
                  setMethodFilter(e.target.value as PaymentMethod | 'all');
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="CARD">카드</option>
                <option value="VIRTUAL_ACCOUNT">가상계좌</option>
                <option value="TRANSFER">계좌이체</option>
                <option value="MOBILE">휴대폰</option>
                <option value="EASY_PAY">간편결제</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            총 {pagination?.total ?? payments.length}개의 결제 내역
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
            <Button onClick={loadPayments}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={payments} />
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
