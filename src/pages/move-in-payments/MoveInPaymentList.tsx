import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/common/Pagination';
import { moveInCaseService } from '../../services/moveInCaseService';
import { formatCurrency, formatDateTime } from '../../utils/format';
import type {
  MoveInPaymentItem,
  MoveInPaymentListParams,
  MoveInPaymentType,
  MoveInPaymentStatus,
} from '../../types';
import {
  PAYMENT_TYPE_LABEL,
  PAYMENT_TYPE_OPTIONS,
  PAYMENT_STATUS_CONFIG,
  PAYMENT_STATUS_OPTIONS,
} from '../move-in-cases/moveInCaseLabels';

const DEFAULT_LIMIT = 20;

export default function MoveInPaymentList() {
  const navigate = useNavigate();

  const [items, setItems] = useState<MoveInPaymentItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [breakdown, setBreakdown] = useState<{
    cleaning: number;
    guest_option: number;
  }>({ cleaning: 0, guest_option: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [type, setType] = useState<MoveInPaymentType | 'all'>('all');
  const [status, setStatus] = useState<MoveInPaymentStatus | 'all'>('all');
  const [paidFrom, setPaidFrom] = useState('');
  const [paidTo, setPaidTo] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: MoveInPaymentListParams = {
        page,
        limit: DEFAULT_LIMIT,
      };
      if (type !== 'all') params.type = type;
      if (status !== 'all') params.status = status;
      if (paidFrom) params.paidFrom = paidFrom;
      if (paidTo) params.paidTo = paidTo;
      if (search.trim()) params.search = search.trim();

      const res = await moveInCaseService.getPayments(params);
      setItems(res.items);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
      setBreakdown(res.breakdown);
    } catch (e: any) {
      setError(e?.message || '목록 조회에 실패했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, type, status, paidFrom, paidTo, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleResetFilters = () => {
    setType('all');
    setStatus('all');
    setPaidFrom('');
    setPaidTo('');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const columns = [
    {
      key: 'type',
      title: '종류',
      width: '90px',
      render: (_: any, r: MoveInPaymentItem) => (
        <span className="text-sm text-gray-700">
          {PAYMENT_TYPE_LABEL[r.type]}
        </span>
      ),
    },
    {
      key: 'orderId',
      title: '주문번호',
      render: (_: any, r: MoveInPaymentItem) => (
        <div>
          <div className="font-mono text-xs text-gray-900">{r.orderId}</div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/move-in-cases/${r.caseId}`);
            }}
            className="text-xs text-primary-600 hover:underline mt-0.5"
          >
            케이스 #{r.caseId}
          </button>
        </div>
      ),
    },
    {
      key: 'payer',
      title: '결제자',
      render: (_: any, r: MoveInPaymentItem) => (
        <div>
          <div className="text-sm text-gray-900">
            {r.payer.name}
            <span className="text-xs text-gray-400 ml-1">
              {r.payer.role === 'host' ? '임대인' : '임차인'}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">{r.payer.phone}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '금액',
      render: (_: any, r: MoveInPaymentItem) => (
        <span className="text-sm text-gray-900">
          {formatCurrency(r.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, r: MoveInPaymentItem) => {
        const cfg = PAYMENT_STATUS_CONFIG[r.status];
        return (
          <div>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
            {r.status === 'FAILED' && r.failureReason && (
              <div className="text-xs text-red-600 mt-1 max-w-[180px] truncate">
                {r.failureReason}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'pg',
      title: 'PG',
      render: (_: any, r: MoveInPaymentItem) => (
        <div className="text-xs text-gray-500">
          <div>{r.pgProvider || '-'}</div>
          <div>{r.pgMethod || '-'}</div>
        </div>
      ),
    },
    {
      key: 'paidAt',
      title: '결제일',
      render: (_: any, r: MoveInPaymentItem) => (
        <span className="text-xs text-gray-700">
          {r.paidAt
            ? formatDateTime(r.paidAt)
            : r.failedAt
              ? `실패 ${formatDateTime(r.failedAt)}`
              : '-'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-gray-500">
        <span>총 {total.toLocaleString('ko-KR')}건</span>
        <span>청소 결제 {breakdown.cleaning.toLocaleString('ko-KR')}건</span>
        <span>
          옵션 결제 {breakdown.guest_option.toLocaleString('ko-KR')}건
        </span>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSearch();
              }}
              placeholder="주문번호, 케이스ID, 임대인/임차인 이름·전화 검색"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button onClick={handleSearch}>검색</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              결제 종류
            </label>
            <select
              value={type}
              onChange={(e) => {
                setPage(1);
                setType(e.target.value as MoveInPaymentType | 'all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PAYMENT_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              결제 상태
            </label>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as MoveInPaymentStatus | 'all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {PAYMENT_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              결제일 범위
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={paidFrom}
                onChange={(e) => {
                  setPage(1);
                  setPaidFrom(e.target.value);
                }}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <span className="text-gray-400 text-sm">~</span>
              <input
                type="date"
                value={paidTo}
                onChange={(e) => {
                  setPage(1);
                  setPaidTo(e.target.value);
                }}
                className="flex-1 px-2 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-3">
          <Button variant="secondary" size="sm" onClick={handleResetFilters}>
            필터 초기화
          </Button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700 text-sm">{error}</p>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="text-center py-12 text-gray-500">불러오는 중...</div>
        ) : (
          <>
            <Table<MoveInPaymentItem>
              columns={columns}
              data={items}
              onRowClick={(r) => navigate(`/move-in-cases/${r.caseId}`)}
            />
            {totalPages > 1 && (
              <div className="p-4 border-t">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
