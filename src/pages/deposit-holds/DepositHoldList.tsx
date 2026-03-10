import { useState, useEffect } from 'react';
import type { DepositHold, DepositHoldStatus, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDate } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { depositHoldService } from '../../services/depositHoldService';

const getStatusBadge = (status: string) => {
  const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }> = {
    PENDING: { variant: 'warning', label: '대기중' },
    APPROVED: { variant: 'success', label: '승인' },
    REJECTED: { variant: 'danger', label: '거절' },
    RELEASED: { variant: 'info', label: '반환완료' },
  };
  const config = map[status] || { variant: 'default' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default function DepositHoldList() {
  const [holds, setHolds] = useState<DepositHold[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [statusFilter, setStatusFilter] = useState<DepositHoldStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [selectedHold, setSelectedHold] = useState<DepositHold | null>(null);
  const [modalType, setModalType] = useState<'approve' | 'reject' | 'force' | null>(null);
  const [forceContractId, setForceContractId] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const itemsPerPage = 20;

  const loadHolds = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await depositHoldService.getDepositHolds({
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      setHolds(response.depositHolds || []);
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

  const handleApprove = async () => {
    if (!selectedHold) return;
    try {
      setActionLoading(true);
      await depositHoldService.approveHold(selectedHold.contractId);
      alert('보증금 보류가 승인되었습니다.');
      closeModal();
      loadHolds();
    } catch (err: any) {
      alert(err?.message || '승인 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedHold) return;
    try {
      setActionLoading(true);
      await depositHoldService.rejectHold(selectedHold.contractId);
      alert('보증금 보류가 거절되었습니다.');
      closeModal();
      loadHolds();
    } catch (err: any) {
      alert(err?.message || '거절 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceHold = async () => {
    if (!forceContractId) {
      alert('계약 ID를 입력해주세요.');
      return;
    }
    try {
      setActionLoading(true);
      await depositHoldService.forceHold(Number(forceContractId));
      alert('강제 반환보류가 처리되었습니다.');
      closeModal();
      loadHolds();
    } catch (err: any) {
      alert(err?.message || '강제 반환보류 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedHold(null);
    setForceContractId('');
  };

  const columns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: number) => `#${value}`,
      width: '6%',
    },
    {
      key: 'contractId',
      title: '계약 ID',
      render: (value: number) => `#${value}`,
      width: '8%',
    },
    {
      key: 'contractRoom',
      title: '방',
      render: (_: any, hold: DepositHold) => (hold as any).contract?.room?.roomName || '-',
      width: '15%',
    },
    {
      key: 'contractGuest',
      title: '게스트',
      render: (_: any, hold: DepositHold) => (hold as any).contract?.guest?.name || '-',
      width: '10%',
    },
    {
      key: 'holdAmount',
      title: '보류 금액',
      render: (value: number) => <span className="font-semibold">{formatCurrency(value)}</span>,
      width: '12%',
    },
    {
      key: 'reason',
      title: '사유',
      render: (value: string) => (
        <span className="truncate block max-w-[200px]" title={value}>{value}</span>
      ),
      width: '17%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: string) => getStatusBadge(value),
      width: '10%',
    },
    {
      key: 'createdAt',
      title: '생성일',
      render: (value: string) => formatDate(value),
      width: '10%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, hold: DepositHold) => (
        <div className="flex gap-1">
          {hold.status === 'PENDING' && (
            <>
              <Button size="sm" variant="primary" onClick={() => { setSelectedHold(hold); setModalType('approve'); }}>
                승인
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { setSelectedHold(hold); setModalType('reject'); }}>
                거절
              </Button>
            </>
          )}
        </div>
      ),
      width: '12%',
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
          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value as DepositHoldStatus | 'all'); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">전체</option>
              <option value="PENDING">대기중</option>
              <option value="APPROVED">승인</option>
              <option value="REJECTED">거절</option>
              <option value="RELEASED">반환완료</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            총 {pagination?.total ?? holds.length}건
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
            <Button onClick={loadHolds}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={holds} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
      )}

      {/* Approve Confirm */}
      {modalType === 'approve' && selectedHold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">보증금 보류 승인</h3>
            <p className="text-sm text-gray-600 mb-4">
              계약 #{selectedHold.contractId} - {formatCurrency(selectedHold.holdAmount)} 보류를 승인하시겠습니까?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={closeModal}>취소</Button>
              <Button variant="primary" onClick={handleApprove} disabled={actionLoading}>
                {actionLoading ? '처리중...' : '승인'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Confirm */}
      {modalType === 'reject' && selectedHold && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">보증금 보류 거절</h3>
            <p className="text-sm text-gray-600 mb-4">
              계약 #{selectedHold.contractId} - {formatCurrency(selectedHold.holdAmount)} 보류를 거절하시겠습니까?
            </p>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={closeModal}>취소</Button>
              <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
                {actionLoading ? '처리중...' : '거절'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Force Hold Modal */}
      {modalType === 'force' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">강제 반환보류</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">계약 ID *</label>
              <input type="number" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                value={forceContractId} onChange={(e) => setForceContractId(e.target.value)} placeholder="계약 ID를 입력하세요" />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={closeModal}>취소</Button>
              <Button variant="danger" onClick={handleForceHold} disabled={actionLoading}>
                {actionLoading ? '처리중...' : '강제 반환보류'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
