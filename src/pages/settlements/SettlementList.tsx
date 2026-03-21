import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Settlement, SettlementStatus, SettlementSummary, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { settlementService } from '../../services/settlementService';

const getStatusBadge = (status: SettlementStatus, label: string) => {
  const map: Record<SettlementStatus, 'warning' | 'info' | 'success' | 'danger' | 'default'> = {
    PENDING: 'warning',
    READY: 'info',
    PROCESSING: 'warning',
    COMPLETED: 'success',
    ON_HOLD: 'danger',
    FAILED: 'danger',
  };
  return <Badge variant={map[status]}>{label}</Badge>;
};

const STATUS_OPTIONS: { value: SettlementStatus | 'all'; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'PENDING', label: '정산 대기' },
  { value: 'READY', label: '지급 준비' },
  { value: 'COMPLETED', label: '정산 완료' },
  { value: 'ON_HOLD', label: '보류' },
];

export default function SettlementList() {
  const navigate = useNavigate();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [summary, setSummary] = useState<SettlementSummary | null>(null);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 20;

  const loadSettlements = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await settlementService.getSettlements({
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm }),
      });
      setSettlements(response.settlements || []);
      setSummary(response.summary || null);
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('정산 목록 로드 실패:', err);
      setError('정산 목록을 불러오는데 실패했습니다.');
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettlements();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadSettlements();
  };

  const handleHold = async (settlementId: number) => {
    const reason = prompt('보류 사유를 입력하세요:');
    if (!reason) return;
    try {
      await settlementService.hold(settlementId, reason);
      loadSettlements();
    } catch (err) {
      alert('정산 보류 처리에 실패했습니다.');
    }
  };

  const handleUnhold = async (settlementId: number) => {
    if (!confirm('보류를 해제하시겠습니까?')) return;
    try {
      await settlementService.unhold(settlementId);
      loadSettlements();
    } catch (err) {
      alert('보류 해제에 실패했습니다.');
    }
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
      key: 'hostName',
      title: '호스트',
      width: '12%',
      render: (value: string, row: Settlement) => (
        <div>
          <div>{value}</div>
          <div className="text-xs text-gray-400">{row.hostEmail}</div>
        </div>
      ),
    },
    {
      key: 'netAmount',
      title: '정산금액',
      width: '12%',
      render: (value: number) => <span className="font-semibold">{formatCurrency(value)}</span>,
    },
    {
      key: 'expectedDate',
      title: '정산 예정일',
      width: '11%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'checkInDate',
      title: '체크인',
      width: '11%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'status',
      title: '상태',
      width: '10%',
      render: (_: any, row: Settlement) => getStatusBadge(row.status, row.statusLabel),
    },
    {
      key: 'payout',
      title: '지급 상태',
      width: '10%',
      render: (value: Settlement['payout']) =>
        value ? (
          <button
            className="text-sm text-primary-600 hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/payouts/${value.id}`);
            }}
          >
            #{value.id} {value.status}
          </button>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: 'actions',
      title: '액션',
      width: '14%',
      render: (_: any, row: Settlement) => (
        <div className="flex gap-2">
          {(row.status === 'PENDING' || row.status === 'READY') && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleHold(row.id);
              }}
            >
              보류
            </Button>
          )}
          {row.status === 'ON_HOLD' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleUnhold(row.id);
              }}
            >
              보류해제
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">정산 관리</h1>
      </div>

      {summary && (
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <div className="text-center p-2">
              <div className="text-sm text-gray-500">정산 대기</div>
              <div className="text-2xl font-bold text-yellow-600">{summary.pendingCount}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center p-2">
              <div className="text-sm text-gray-500">지급 준비</div>
              <div className="text-2xl font-bold text-blue-600">{summary.readyCount}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center p-2">
              <div className="text-sm text-gray-500">정산 완료</div>
              <div className="text-2xl font-bold text-green-600">{summary.completedCount}</div>
            </div>
          </Card>
          <Card>
            <div className="text-center p-2">
              <div className="text-sm text-gray-500">보류</div>
              <div className="text-2xl font-bold text-red-600">{summary.onHoldCount}</div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleSearch}
            placeholder="호스트 이름/이메일로 검색"
          />
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value as SettlementStatus | 'all');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <div className="text-sm text-gray-600">
            총 {pagination?.total ?? settlements.length}개의 정산 내역
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
            <Button onClick={loadSettlements}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={settlements} />
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
