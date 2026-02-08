import { useState, useEffect } from 'react';
import type { Settlement, SettlementStatus, SettlementSummary, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { settlementService } from '../../services/settlementService';
import { Download } from 'lucide-react';

const getStatusBadge = (status: string, label?: string) => {
  const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info' }> = {
    pending: { variant: 'warning' },
    completed: { variant: 'success' },
    on_hold: { variant: 'danger' },
  };
  const config = map[status] || { variant: 'default' as const };
  return <Badge variant={config.variant}>{label || status}</Badge>;
};

export default function SettlementList() {
  const [settlements, setSettlements] = useState<(Settlement & { id: number })[]>([]);
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
      // Table 컴포넌트가 id 필드를 요구하므로 contractId를 id로 매핑
      const mapped = (response.settlements || []).map(s => ({ ...s, id: s.contractId }));
      setSettlements(mapped);
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

  const handleComplete = async (contractId: number) => {
    if (!confirm('정말 이 정산을 완료하시겠습니까?')) return;
    try {
      await settlementService.complete(contractId);
      loadSettlements();
    } catch (err) {
      alert('정산 완료 처리에 실패했습니다.');
    }
  };

  const handleHold = async (contractId: number) => {
    const reason = prompt('보류 사유를 입력하세요:');
    if (!reason) return;
    try {
      await settlementService.hold(contractId, reason);
      loadSettlements();
    } catch (err) {
      alert('정산 보류 처리에 실패했습니다.');
    }
  };

  const handleExport = async () => {
    try {
      await settlementService.exportExcel({
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
    } catch (err) {
      alert('엑셀 다운로드에 실패했습니다.');
    }
  };

  const columns = [
    {
      key: 'contractNumber',
      title: '계약번호',
      render: (value: string) => value || '-',
      width: '10%',
    },
    {
      key: 'host',
      title: '호스트',
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
      key: 'guestName',
      title: '게스트',
      width: '8%',
    },
    {
      key: 'settlementAmount',
      title: '정산금액',
      render: (value: any) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
      width: '12%',
    },
    {
      key: 'settlementDate',
      title: '정산예정일',
      render: (value: string) => formatDate(value),
      width: '10%',
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, settlement: any) => getStatusBadge(settlement.status, settlement.statusLabel),
      width: '9%',
    },
    {
      key: 'settlementCompletedAt',
      title: '완료일',
      render: (value: string | null) => value ? formatDate(value) : '-',
      width: '10%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, settlement: any) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            상세
          </Button>
          {settlement.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleComplete(settlement.contractId);
                }}
              >
                완료
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  handleHold(settlement.contractId);
                }}
              >
                보류
              </Button>
            </>
          )}
        </div>
      ),
      width: '18%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">정산 관리</h1>
        <Button variant="secondary" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          엑셀 내보내기
        </Button>
      </div>

      {/* 정산 요약 */}
      {summary && (
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <div className="text-center p-2">
              <div className="text-sm text-gray-500">정산 대기</div>
              <div className="text-2xl font-bold text-yellow-600">{summary.pendingCount}</div>
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
              <option value="all">전체</option>
              <option value="pending">정산 예정</option>
              <option value="completed">정산 완료</option>
              <option value="on_hold">보류</option>
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
