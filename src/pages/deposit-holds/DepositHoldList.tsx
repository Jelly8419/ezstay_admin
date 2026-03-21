import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { DepositHold, DepositHoldStatus, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { depositHoldService } from '../../services/depositHoldService';
import { SearchBar } from '../../components/common/SearchBar';

const STATUS_MAP: Record<DepositHoldStatus, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }> = {
  REQUESTED:      { variant: 'warning', label: '보류 신청' },
  APPROVED:       { variant: 'info',    label: '승인 완료' },
  HOST_SUBMITTED: { variant: 'warning', label: '차감 내용 제출' },
  AGREED:         { variant: 'success', label: '게스트 동의' },
  AUTO_REFUNDED:  { variant: 'default', label: '자동 전액 반환' },
  REFUND_FAILED:  { variant: 'danger',  label: '환불 실패' },
};

const getStatusBadge = (status: DepositHoldStatus) => {
  const cfg = STATUS_MAP[status] || { variant: 'default' as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
};

const STATUS_OPTIONS: { value: DepositHoldStatus | 'all'; label: string }[] = [
  { value: 'all',            label: '전체' },
  { value: 'REQUESTED',      label: '보류 신청' },
  { value: 'APPROVED',       label: '승인 완료' },
  { value: 'HOST_SUBMITTED', label: '차감 내용 제출' },
  { value: 'AGREED',         label: '게스트 동의' },
  { value: 'AUTO_REFUNDED',  label: '자동 전액 반환' },
  { value: 'REFUND_FAILED',  label: '환불 실패' },
];

type ModalType = 'approve' | 'reject' | 'force' | 'retry' | null;

export default function DepositHoldList() {
  const navigate = useNavigate();
  const [holds, setHolds] = useState<DepositHold[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [statusFilter, setStatusFilter] = useState<DepositHoldStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 20;

  // 모달
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedHold, setSelectedHold] = useState<DepositHold | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [forceContractId, setForceContractId] = useState('');
  const [forceReason, setForceReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const loadHolds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await depositHoldService.getDepositHolds({
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { hostName: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });
      setHolds(response.holds || []);
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('보증금 보류 목록 로드 실패:', err);
      setError('보증금 보류 목록을 불러오는데 실패했습니다.');
      setHolds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHolds();
  }, [currentPage, statusFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadHolds();
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedHold(null);
    setRejectReason('');
    setForceContractId('');
    setForceReason('');
  };

  const handleApprove = async () => {
    if (!selectedHold) return;
    try {
      setActionLoading(true);
      await depositHoldService.approveHold(selectedHold.contractId);
      closeModal();
      loadHolds();
    } catch {
      alert('승인 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedHold) return;
    if (!rejectReason.trim()) { alert('반려 사유를 입력해주세요.'); return; }
    try {
      setActionLoading(true);
      await depositHoldService.rejectHold(selectedHold.contractId, rejectReason);
      closeModal();
      loadHolds();
    } catch {
      alert('반려 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceHold = async () => {
    if (!forceContractId) { alert('계약 ID를 입력해주세요.'); return; }
    if (!forceReason.trim()) { alert('강제 보류 사유를 입력해주세요.'); return; }
    try {
      setActionLoading(true);
      await depositHoldService.forceHold(Number(forceContractId), forceReason);
      closeModal();
      loadHolds();
    } catch {
      alert('강제 반환보류 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryRefund = async () => {
    if (!selectedHold) return;
    try {
      setActionLoading(true);
      await depositHoldService.retryRefund(selectedHold.contractId);
      closeModal();
      loadHolds();
    } catch {
      alert('환불 재시도에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setActionLoading(false);
    }
  };

  const columns = [
    {
      key: 'contractId',
      title: '계약 ID',
      width: '8%',
      render: (value: number) => (
        <button
          className="text-primary-600 hover:underline font-mono text-sm"
          onClick={(e) => { e.stopPropagation(); navigate(`/deposit-holds/${value}`); }}
        >
          #{value}
        </button>
      ),
    },
    {
      key: 'room',
      title: '방',
      width: '16%',
      render: (value: DepositHold['room']) => (
        <span className="truncate block max-w-[140px]" title={value?.roomName}>{value?.roomName || '-'}</span>
      ),
    },
    {
      key: 'guest',
      title: '게스트',
      width: '10%',
      render: (value: DepositHold['guest']) => value?.name || '-',
    },
    {
      key: 'host',
      title: '호스트',
      width: '10%',
      render: (value: DepositHold['host']) => value?.name || '-',
    },
    {
      key: 'deposit',
      title: '보증금',
      width: '10%',
      render: (value: number) => <span className="font-semibold">{formatCurrency(value)}</span>,
    },
    {
      key: 'deductRequestAmount',
      title: '차감 요청액',
      width: '10%',
      render: (value: number | null) =>
        value != null ? <span className="text-orange-600 font-semibold">{formatCurrency(value)}</span> : <span className="text-gray-400">-</span>,
    },
    {
      key: 'holdReason',
      title: '사유',
      width: '16%',
      render: (value: string) => (
        <span className="truncate block max-w-[140px]" title={value}>{value}</span>
      ),
    },
    {
      key: 'holdStatus',
      title: '상태',
      width: '10%',
      render: (value: DepositHoldStatus) => getStatusBadge(value),
    },
    {
      key: 'holdRequestedAt',
      title: '신청일',
      width: '9%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'actions',
      title: '액션',
      width: '11%',
      render: (_: any, hold: DepositHold) => (
        <div className="flex gap-1">
          {hold.holdStatus === 'REQUESTED' && (
            <>
              <Button size="sm" variant="primary"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedHold(hold); setModalType('approve'); }}>
                승인
              </Button>
              <Button size="sm" variant="secondary"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedHold(hold); setModalType('reject'); }}>
                반려
              </Button>
            </>
          )}
          {hold.holdStatus === 'REFUND_FAILED' && (
            <Button size="sm" variant="danger"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); setSelectedHold(hold); setModalType('retry'); }}>
              환불 재시도
            </Button>
          )}
          {!['REQUESTED'].includes(hold.holdStatus) && (
            <Button size="sm" variant="secondary"
              onClick={(e: React.MouseEvent) => { e.stopPropagation(); navigate(`/deposit-holds/${hold.contractId}`); }}>
              상세
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">보증금 보류 관리</h1>
        <Button variant="danger" onClick={() => setModalType('force')}>강제 반환보류</Button>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">기간:</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
              <span className="text-gray-400">~</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm" />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as DepositHoldStatus | 'all'); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <div className="flex-1 min-w-[220px]">
              <SearchBar value={searchTerm} onChange={setSearchTerm} onSearch={handleSearch} placeholder="호스트명 검색" />
            </div>
          </div>
          <div className="text-sm text-gray-600">총 {pagination?.total ?? holds.length}건</div>
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
            <Button onClick={loadHolds}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={holds} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
      )}

      {/* 승인 모달 */}
      <Modal
        isOpen={modalType === 'approve'}
        onClose={closeModal}
        title="보증금 보류 승인"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="primary" onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '승인'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          계약 <strong>#{selectedHold?.contractId}</strong>의 보증금 보류 신청을 승인하시겠습니까?<br />
          승인 후 호스트가 차감 내용을 제출할 수 있으며, 합의 기한은 승인일로부터 10일입니다.
        </p>
      </Modal>

      {/* 반려 모달 */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={closeModal}
        title="보증금 보류 반려"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '반려'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            반려 시 퇴실 확인 카운트다운이 재개되며, 보증금 전액 자동 반환 흐름으로 전환됩니다.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              반려 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="반려 사유를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 강제 반환보류 모달 */}
      <Modal
        isOpen={modalType === 'force'}
        onClose={closeModal}
        title="강제 반환보류"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="danger" onClick={handleForceHold} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '강제 반환보류'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">호스트 신청 없이 관리자가 직접 보류 처리합니다. 이후 일반 보류와 동일한 절차(합의 10일)로 진행됩니다.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              계약 ID <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={forceContractId}
              onChange={(e) => setForceContractId(e.target.value)}
              placeholder="계약 ID를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              보류 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={forceReason}
              onChange={(e) => setForceReason(e.target.value)}
              rows={3}
              placeholder="강제 보류 사유를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 환불 재시도 모달 */}
      <Modal
        isOpen={modalType === 'retry'}
        onClose={closeModal}
        title="PG 환불 재시도"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="danger" onClick={handleRetryRefund} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '환불 재시도'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            계약 <strong>#{selectedHold?.contractId}</strong>의 보증금 PG 환불이 실패한 상태입니다.
          </p>
          <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
            환불을 재시도합니다. 성공 시 정상 상태로 복원되며, 재실패 시 실패 로그가 누적됩니다.
          </div>
        </div>
      </Modal>
    </div>
  );
}
