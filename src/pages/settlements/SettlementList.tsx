import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Settlement, SettlementStatus, SettlementSummary, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
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

type ModalType = 'hold' | 'unhold' | 'adjust' | 'note' | null;

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
  const [actionLoading, setActionLoading] = useState(false);
  const itemsPerPage = 20;

  // 모달 상태
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [modalInput, setModalInput] = useState('');
  const [modalReason, setModalReason] = useState('');
  const [modalAmount, setModalAmount] = useState('');

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

  const openModal = (type: ModalType, settlement: Settlement) => {
    setSelectedSettlement(settlement);
    setModalType(type);
    setModalInput('');
    setModalReason('');
    setModalAmount(String(settlement.netAmount));
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSettlement(null);
    setModalInput('');
    setModalReason('');
    setModalAmount('');
  };

  const handleHold = async () => {
    if (!selectedSettlement || !modalInput.trim()) {
      alert('보류 사유를 입력해주세요.');
      return;
    }
    try {
      setActionLoading(true);
      await settlementService.hold(selectedSettlement.id, modalInput);
      closeModal();
      loadSettlements();
    } catch {
      alert('정산 보류 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnhold = async () => {
    if (!selectedSettlement) return;
    try {
      setActionLoading(true);
      await settlementService.unhold(selectedSettlement.id, modalInput || undefined);
      closeModal();
      loadSettlements();
    } catch {
      alert('보류 해제에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdjust = async () => {
    if (!selectedSettlement) return;
    const amount = Number(modalAmount);
    if (!modalAmount || isNaN(amount) || amount <= 0) {
      alert('올바른 금액을 입력해주세요.');
      return;
    }
    if (!modalReason.trim()) {
      alert('조정 사유를 입력해주세요.');
      return;
    }
    try {
      setActionLoading(true);
      await settlementService.adjust(selectedSettlement.id, amount, modalReason);
      closeModal();
      loadSettlements();
    } catch {
      alert('금액 조정에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoteUpdate = async () => {
    if (!selectedSettlement || !modalInput.trim()) {
      alert('메모 내용을 입력해주세요.');
      return;
    }
    try {
      setActionLoading(true);
      await settlementService.updateNote(selectedSettlement.id, modalInput);
      closeModal();
      loadSettlements();
    } catch {
      alert('메모 수정에 실패했습니다.');
    } finally {
      setActionLoading(false);
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
      width: '13%',
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
      width: '11%',
      render: (value: number) => <span className="font-semibold">{formatCurrency(value)}</span>,
    },
    {
      key: 'expectedDate',
      title: '정산 예정일',
      width: '10%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'checkInDate',
      title: '체크인',
      width: '10%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'status',
      title: '상태',
      width: '9%',
      render: (_: any, row: Settlement) => getStatusBadge(row.status, row.statusLabel),
    },
    {
      key: 'payout',
      title: '지급',
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
            #{value.id} <Badge variant="default">{value.status}</Badge>
          </button>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: 'actions',
      title: '액션',
      width: '18%',
      render: (_: any, row: Settlement) => (
        <div className="flex gap-1 flex-wrap">
          {(row.status === 'PENDING' || row.status === 'READY') && (
            <>
              <Button
                variant="danger"
                size="sm"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal('hold', row); }}
              >
                보류
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal('adjust', row); }}
              >
                금액조정
              </Button>
            </>
          )}
          {row.status === 'ON_HOLD' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal('unhold', row); }}
            >
              보류해제
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal('note', row); }}
          >
            메모
          </Button>
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
              onChange={(e) => { setStatusFilter(e.target.value as SettlementStatus | 'all'); setCurrentPage(1); }}
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
          <Table columns={columns} data={settlements} onRowClick={(row) => navigate(`/settlements/${row.id}`)} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* 보류 모달 */}
      <Modal
        isOpen={modalType === 'hold'}
        onClose={closeModal}
        title="정산 보류 처리"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="danger" onClick={handleHold} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '보류 처리'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <strong>#{selectedSettlement?.id}</strong> 정산을 보류합니다. 연결된 Payout도 함께 취소됩니다.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              보류 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              rows={3}
              placeholder="보류 사유를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 보류 해제 모달 */}
      <Modal
        isOpen={modalType === 'unhold'}
        onClose={closeModal}
        title="정산 보류 해제"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="primary" onClick={handleUnhold} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '보류 해제'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            <strong>#{selectedSettlement?.id}</strong> 정산의 보류를 해제합니다.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">메모 (선택)</label>
            <textarea
              value={modalInput}
              onChange={(e) => setModalInput(e.target.value)}
              rows={3}
              placeholder="해제 사유 또는 메모"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 금액 조정 모달 */}
      <Modal
        isOpen={modalType === 'adjust'}
        onClose={closeModal}
        title="정산 금액 수동 조정"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="primary" onClick={handleAdjust} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '조정 적용'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-gray-50 rounded-lg text-sm">
            <span className="text-gray-500">현재 정산금액: </span>
            <span className="font-bold">{formatCurrency(selectedSettlement?.netAmount ?? 0)}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              조정 금액 (원) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={modalAmount}
              onChange={(e) => setModalAmount(e.target.value)}
              placeholder="예: 1000000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              조정 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={modalReason}
              onChange={(e) => setModalReason(e.target.value)}
              rows={3}
              placeholder="금액 조정 사유를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 메모 수정 모달 */}
      <Modal
        isOpen={modalType === 'note'}
        onClose={closeModal}
        title="메모 수정"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="primary" onClick={handleNoteUpdate} disabled={actionLoading}>
              {actionLoading ? '저장 중...' : '저장'}
            </Button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메모 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={modalInput}
            onChange={(e) => setModalInput(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Modal>
    </div>
  );
}
