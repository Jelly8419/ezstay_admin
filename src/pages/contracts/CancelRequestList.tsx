import { useState, useEffect } from 'react';
import type { CancelRequestContract, RequesterRole, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { SearchBar } from '../../components/common/SearchBar';
import { reservationService } from '../../services/reservationService';

type ActionType = 'approve' | 'reject' | null;

export default function CancelRequestList() {
  const [contracts, setContracts] = useState<CancelRequestContract[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<RequesterRole | 'all'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [actionType, setActionType] = useState<ActionType>(null);
  const [selected, setSelected] = useState<CancelRequestContract | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reservationService.getCancelRequests({
        page: currentPage,
        limit: 20,
        ...(roleFilter !== 'all' && { requesterRole: roleFilter }),
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      setContracts(response.contracts || []);
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('취소 요청 목록 로드 실패:', err);
      setError('취소 요청 목록을 불러오는데 실패했습니다.');
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentPage, roleFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadData();
  };

  const closeModal = () => {
    setActionType(null);
    setSelected(null);
    setAdminNote('');
  };

  const handleApprove = async () => {
    if (!selected) return;
    try {
      setActionLoading(true);
      await reservationService.approveCancelRequest(selected.contractId, { withRefund: false, adminNote: adminNote || undefined });
      closeModal();
      loadData();
    } catch {
      alert('승인 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selected) return;
    try {
      setActionLoading(true);
      await reservationService.rejectCancelRequest(selected.contractId, { adminNote: adminNote || undefined });
      closeModal();
      loadData();
    } catch {
      alert('거절 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'contractId',
      title: '계약 ID',
      width: '7%',
      render: (value: number) => (
        <span className="font-mono text-sm text-gray-700">#{value}</span>
      ),
    },
    {
      key: 'requesterRole',
      title: '요청자',
      width: '8%',
      render: (value: RequesterRole) => (
        <Badge variant={value === 'HOST' ? 'info' : 'success'}>
          {value === 'HOST' ? '호스트' : '게스트'}
        </Badge>
      ),
    },
    {
      key: 'guest',
      title: '게스트',
      width: '12%',
      render: (value: CancelRequestContract['guest']) => (
        <div>
          <div className="font-medium text-sm">{value.name}</div>
          <div className="text-xs text-gray-400">{value.email}</div>
        </div>
      ),
    },
    {
      key: 'host',
      title: '호스트',
      width: '10%',
      render: (value: CancelRequestContract['host']) => (
        <div>
          <div className="font-medium text-sm">{value.name}</div>
          <div className="text-xs text-gray-400">{value.email}</div>
        </div>
      ),
    },
    {
      key: 'room',
      title: '방',
      width: '14%',
      render: (value: CancelRequestContract['room']) => (
        <span className="truncate block max-w-[120px] text-sm" title={value.roomName}>
          {value.roomName}
        </span>
      ),
    },
    {
      key: 'cancelReason',
      title: '취소 사유',
      width: '18%',
      render: (value: string) => (
        <span className="truncate block max-w-[160px] text-sm text-gray-600" title={value}>
          {value}
        </span>
      ),
    },
    {
      key: 'finalTotalAmount',
      title: '계약 금액',
      width: '10%',
      render: (value: number) => (
        <span className="font-semibold text-sm">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'requestedAt',
      title: '요청일',
      width: '10%',
      render: (value: string) => (
        <span className="text-sm">{formatDate(value)}</span>
      ),
    },
    {
      key: 'actions',
      title: '액션',
      width: '11%',
      render: (_: unknown, contract: CancelRequestContract) => (
        <div className="flex gap-1">
          <Button
            size="sm"
            variant="primary"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelected(contract);
              setActionType('approve');
            }}
          >
            승인
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation();
              setSelected(contract);
              setActionType('reject');
            }}
          >
            거절
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">취소 요청 관리</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">기간:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value as RequesterRole | 'all');
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">요청자 전체</option>
              <option value="GUEST">게스트</option>
              <option value="HOST">호스트</option>
            </select>
            <div className="flex-1 min-w-[220px]">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                placeholder="게스트 이름 또는 이메일 검색"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            총 {pagination?.total ?? contracts.length}건
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
            <Button onClick={loadData}>다시 시도</Button>
          </div>
        ) : contracts.length === 0 ? (
          <div className="text-center py-12 text-gray-500">취소 요청 내역이 없습니다.</div>
        ) : (
          <Table<CancelRequestContract> columns={columns} data={contracts} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* 승인 모달 */}
      <Modal
        isOpen={actionType === 'approve'}
        onClose={closeModal}
        title="취소 요청 승인"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="primary" onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '승인'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="p-3 bg-yellow-50 rounded-lg text-sm text-yellow-800">
            <strong>주의:</strong> 승인은 상태 변경만 처리합니다. 실제 PG 환불은 관리자가 별도 수동 처리해야 합니다.
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">
              계약 <strong>#{selected?.contractId}</strong>의 취소 요청을 승인하시겠습니까?
            </div>
            <div className="text-sm text-gray-500">
              요청자: {selected?.requesterRole === 'HOST' ? '호스트' : '게스트'} &nbsp;|&nbsp;
              게스트: {selected?.guest.name}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">관리자 메모 (선택)</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              placeholder="예: 사유 확인 후 승인"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 거절 모달 */}
      <Modal
        isOpen={actionType === 'reject'}
        onClose={closeModal}
        title="취소 요청 거절"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '거절'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="text-sm text-gray-600">
            계약 <strong>#{selected?.contractId}</strong>의 취소 요청을 거절하시겠습니까?
            <br />
            거절 시 계약 상태는 <strong>IN_PROGRESS(임대 중)</strong>으로 원복됩니다.
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">관리자 메모 (선택)</label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              placeholder="예: 사유 불충분으로 거절"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
