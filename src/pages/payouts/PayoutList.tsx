import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { PayoutListItem, PayoutStatus, PayoutType, RecipientType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { payoutService } from '../../services/payoutService';

const getStatusBadge = (status: PayoutStatus, label: string) => {
  const map: Record<PayoutStatus, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
    PENDING: 'default',
    PAYABLE: 'info',
    PROCESSING: 'warning',
    COMPLETED: 'success',
    FAILED: 'danger',
    CANCELLED: 'default',
  };
  return <Badge variant={map[status]}>{label}</Badge>;
};

const PAYOUT_TYPE_OPTIONS: { value: PayoutType | 'all'; label: string }[] = [
  { value: 'all', label: '전체 유형' },
  { value: 'CONTRACT_SETTLEMENT', label: '계약 정산' },
  { value: 'GUEST_PENALTY', label: '게스트 취소 위약금' },
  { value: 'DEPOSIT_DEDUCTION', label: '보증금 차감' },
  { value: 'HOST_CANCELLATION_COMPENSATION', label: '호스트 귀책 취소 보상' },
];

const STATUS_OPTIONS: { value: PayoutStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체 상태' },
  { value: 'PENDING', label: '지급 대기' },
  { value: 'PAYABLE', label: '지급 가능' },
  { value: 'PROCESSING', label: '처리 중' },
  { value: 'COMPLETED', label: '지급 완료' },
  { value: 'FAILED', label: '지급 실패' },
  { value: 'CANCELLED', label: '취소됨' },
];

const RECIPIENT_TYPE_OPTIONS: { value: RecipientType | 'all'; label: string }[] = [
  { value: 'all', label: '전체 수령인' },
  { value: 'HOST', label: '호스트' },
  { value: 'GUEST', label: '게스트' },
];

export default function PayoutList() {
  const navigate = useNavigate();
  const [payouts, setPayouts] = useState<PayoutListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PayoutStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<PayoutType | 'all'>('all');
  const [recipientFilter, setRecipientFilter] = useState<RecipientType | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const itemsPerPage = 20;

  const loadPayouts = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);
      const response = await payoutService.getPayouts({
        page,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { payoutType: typeFilter }),
        ...(recipientFilter !== 'all' && { recipientType: recipientFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(searchTerm && { search: searchTerm }),
      });
      setPayouts(response.payouts);
      setTotal(response.total);
    } catch (err) {
      console.error('지급 목록 로드 실패:', err);
      setError('지급 목록을 불러오는데 실패했습니다.');
      setPayouts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayouts(currentPage);
  }, [currentPage, statusFilter, typeFilter, recipientFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadPayouts(1);
  };

  const columns = [
    {
      key: 'id',
      title: 'ID',
      width: '6%',
      render: (value: number) => <span className="text-gray-500 text-sm">#{value}</span>,
    },
    {
      key: 'contractId',
      title: '계약 ID',
      width: '8%',
      render: (value: number) => <span className="text-sm">#{value}</span>,
    },
    {
      key: 'payoutTypeLabel',
      title: '지급 유형',
      width: '16%',
    },
    {
      key: 'recipientName',
      title: '수령인',
      width: '10%',
      render: (value: string | null, row: PayoutListItem) => (
        <div>
          <div>{value || '-'}</div>
          <div className="text-xs text-gray-400">{row.recipientType === 'HOST' ? '호스트' : '게스트'}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '금액',
      width: '12%',
      render: (value: number) => <span className="font-semibold">{formatCurrency(value)}</span>,
    },
    {
      key: 'status',
      title: '상태',
      width: '11%',
      render: (_: any, row: PayoutListItem) => getStatusBadge(row.status, row.statusLabel),
    },
    {
      key: 'payableAfter',
      title: '지급 가능일',
      width: '11%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'processedAt',
      title: '처리일',
      width: '11%',
      render: (value: string | null) => (value ? formatDate(value) : '-'),
    },
    {
      key: 'actions',
      title: '',
      width: '8%',
      render: (_: any, row: PayoutListItem) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            navigate(`/payouts/${row.id}`);
          }}
        >
          상세
        </Button>
      ),
    },
  ];

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">지급 관리</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleSearch}
            placeholder="수령인 이름 또는 닉네임으로 검색"
          />

          <div className="flex flex-wrap gap-3 items-center">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as PayoutStatus | 'all'); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value as PayoutType | 'all'); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {PAYOUT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <select
              value={recipientFilter}
              onChange={(e) => { setRecipientFilter(e.target.value as RecipientType | 'all'); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {RECIPIENT_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>

            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">지급가능일</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <Button variant="secondary" size="sm" onClick={handleSearch}>적용</Button>
            </div>
          </div>

          <div className="text-sm text-gray-600">총 {total}개의 지급 내역</div>
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
            <Button onClick={() => loadPayouts()}>다시 시도</Button>
          </div>
        ) : (
          <Table
            columns={columns}
            data={payouts}
            onRowClick={(row) => navigate(`/payouts/${row.id}`)}
          />
        )}
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
