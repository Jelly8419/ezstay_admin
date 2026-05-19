import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Pagination } from '../../components/common/Pagination';
import { moveInCaseService } from '../../services/moveInCaseService';
import { formatCurrency, formatDateTime } from '../../utils/format';
import type {
  MoveInRefundRequestListItem,
  MoveInRefundRequestListParams,
  MoveInRefundRequestStatus,
} from '../../types';
import {
  REFUND_REQUEST_STATUS_CONFIG,
  REFUND_REQUEST_STATUS_OPTIONS,
} from '../move-in-cases/moveInCaseLabels';

const DEFAULT_LIMIT = 20;

export default function MoveInRefundList() {
  const navigate = useNavigate();

  const [items, setItems] = useState<MoveInRefundRequestListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [status, setStatus] = useState<MoveInRefundRequestStatus | 'all'>(
    'all'
  );
  const [caseIdInput, setCaseIdInput] = useState('');
  const [caseId, setCaseId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // 처리 중인 요청 id
  const [processingId, setProcessingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: MoveInRefundRequestListParams = {
        page,
        limit: DEFAULT_LIMIT,
      };
      if (status !== 'all') params.status = status;
      if (caseId != null) params.caseId = caseId;

      const res = await moveInCaseService.getRefundRequests(params);
      setItems(res.items);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (e: any) {
      setError(e?.message || '목록 조회에 실패했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, caseId]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApplyCaseId = () => {
    const trimmed = caseIdInput.trim();
    setPage(1);
    if (trimmed === '') {
      setCaseId(null);
      return;
    }
    const n = Number(trimmed);
    if (!Number.isInteger(n) || n <= 0) {
      alert('케이스 ID는 양의 정수여야 합니다.');
      return;
    }
    setCaseId(n);
  };

  const handleResetFilters = () => {
    setStatus('all');
    setCaseIdInput('');
    setCaseId(null);
    setPage(1);
  };

  const handleApprove = async (requestId: number) => {
    if (
      !window.confirm(
        '반품 요청을 승인하시겠습니까?\n승인 시 왕복배송비 7,000원 차감 후 환불 처리됩니다.'
      )
    )
      return;
    setProcessingId(requestId);
    try {
      const res = await moveInCaseService.approveRefundRequest(requestId);
      alert(
        `반품이 승인되었습니다.\n` +
          `항목 합계 ${formatCurrency(res.itemTotalAmount)} − ` +
          `수거비 ${formatCurrency(res.shippingDeduction)} = ` +
          `환불 ${formatCurrency(res.finalRefundAmount)}`
      );
      await load();
    } catch (e: any) {
      alert(e?.message || '반품 승인에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    const reason = window.prompt(
      '반품 요청을 거절합니다. 거절 사유를 입력하세요 (선택, 비워도 됨).'
    );
    if (reason === null) return;
    setProcessingId(requestId);
    try {
      const trimmed = reason.trim();
      await moveInCaseService.rejectRefundRequest(
        requestId,
        trimmed === '' ? undefined : trimmed
      );
      alert('반품 요청이 거절되었습니다.');
      await load();
    } catch (e: any) {
      alert(e?.message || '반품 거절에 실패했습니다.');
    } finally {
      setProcessingId(null);
    }
  };

  const columns = [
    {
      key: 'id',
      title: '번호',
      width: '70px',
      render: (value: number) => (
        <span className="text-gray-700">{value}</span>
      ),
    },
    {
      key: 'case',
      title: '케이스 / 임차인',
      render: (_: any, r: MoveInRefundRequestListItem) => (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/move-in-cases/${r.caseId}`);
            }}
            className="font-medium text-primary-600 hover:underline"
          >
            케이스 #{r.caseId}
          </button>
          <div className="text-xs text-gray-500 mt-0.5">
            {r.case.guestName} · {r.case.guestPhone}
          </div>
        </div>
      ),
    },
    {
      key: 'order',
      title: '주문',
      render: (_: any, r: MoveInRefundRequestListItem) => (
        <div className="text-sm text-gray-700">
          <div className="font-mono text-xs">{r.order.orderId}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {r.order.deliveryStatus || '-'}
          </div>
        </div>
      ),
    },
    {
      key: 'returnReason',
      title: '반품 사유',
      render: (_: any, r: MoveInRefundRequestListItem) => (
        <div>
          <div className="text-sm text-gray-700">
            {r.returnReason || '-'}
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {r.targetItems && r.targetItems.length > 0
              ? `부분 반품 ${r.targetItems.length}건`
              : '전체 반품'}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '환불액',
      render: (_: any, r: MoveInRefundRequestListItem) => (
        <div className="text-sm">
          {r.status === 'PENDING' ? (
            <span className="text-gray-700">
              최대 {formatCurrency(r.itemTotalAmount)}
              <span className="text-xs text-gray-400">
                {' '}
                (승인 시 확정)
              </span>
            </span>
          ) : (
            <span className="text-gray-900">
              {formatCurrency(r.finalRefundAmount)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '상태',
      render: (_: any, r: MoveInRefundRequestListItem) => {
        const cfg = REFUND_REQUEST_STATUS_CONFIG[r.status];
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'createdAt',
      title: '요청일',
      render: (value: string) => (
        <span className="text-xs text-gray-700">{formatDateTime(value)}</span>
      ),
    },
    {
      key: 'actions',
      title: '처리',
      width: '150px',
      render: (_: any, r: MoveInRefundRequestListItem) => {
        if (r.status !== 'PENDING') {
          return <span className="text-xs text-gray-400">처리 완료</span>;
        }
        const isProcessing = processingId === r.id;
        return (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleApprove(r.id);
              }}
              disabled={isProcessing}
            >
              {isProcessing ? '처리 중' : '승인'}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleReject(r.id);
              }}
              disabled={isProcessing}
            >
              거절
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        총 {total.toLocaleString('ko-KR')}건의 반품 요청
      </p>

      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              처리 상태
            </label>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(
                  e.target.value as MoveInRefundRequestStatus | 'all'
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {REFUND_REQUEST_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              케이스 ID
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={caseIdInput}
                onChange={(e) => setCaseIdInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyCaseId();
                }}
                placeholder="예: 33"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Button size="sm" onClick={handleApplyCaseId}>
                적용
              </Button>
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
            <Table<MoveInRefundRequestListItem>
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
