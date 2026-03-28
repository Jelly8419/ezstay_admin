import { useState, useEffect } from 'react';
import type {
  RentalRefundRequestBase,
  RentalRefundRequestDetail,
  RentalRefundRequestStatus,
  RetrievalStatus,
} from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/common/Pagination';
import { rentalRefundRequestService } from '../../services/rentalRefundRequestService';

// ─── 상태 매핑 ────────────────────────────────────────────────────────────────

const REQUEST_STATUS_MAP: Record<
  RentalRefundRequestStatus,
  { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }
> = {
  PENDING:  { variant: 'warning', label: '처리 대기' },
  APPROVED: { variant: 'success', label: '승인됨' },
  REJECTED: { variant: 'danger',  label: '거절됨' },
};

const RETRIEVAL_STATUS_MAP: Record<
  RetrievalStatus,
  { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }
> = {
  RETRIEVAL_PENDING: { variant: 'warning', label: '회수 준비중' },
  IN_RETRIEVAL:      { variant: 'info',    label: '회수중' },
  RETRIEVED:         { variant: 'success', label: '회수 완료' },
};

const STATUS_OPTIONS: { value: RentalRefundRequestStatus | 'all'; label: string }[] = [
  { value: 'all',      label: '전체' },
  { value: 'PENDING',  label: '처리 대기' },
  { value: 'APPROVED', label: '승인됨' },
  { value: 'REJECTED', label: '거절됨' },
];

const DELIVERY_STATUS_LABEL: Record<string, string> = {
  PENDING:    '배송 전',
  IN_TRANSIT: '배송 중',
  DELIVERED:  '배송 완료',
};

// ─── 타입 ─────────────────────────────────────────────────────────────────────

type ModalType = 'detail' | 'approve' | 'reject' | 'retrieval' | null;

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function RentalRefundList() {
  const [items, setItems] = useState<RentalRefundRequestBase[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<RentalRefundRequestStatus | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 20;

  // 상세 모달 상태
  const [modalType, setModalType] = useState<ModalType>(null);
  const [selectedItem, setSelectedItem] = useState<RentalRefundRequestBase | null>(null);
  const [detail, setDetail] = useState<RentalRefundRequestDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // 액션 상태
  const [actionLoading, setActionLoading] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [nextRetrievalStatus, setNextRetrievalStatus] = useState<RetrievalStatus | null>(null);

  // ── 목록 로드 ────────────────────────────────────────────────────────────────

  const loadList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await rentalRefundRequestService.getList({
        page: currentPage,
        limit: itemsPerPage,
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      setItems(res.items ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.totalPages ?? 1);
    } catch {
      setError('환불 요청 목록을 불러오는데 실패했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadList(); }, [currentPage, statusFilter]);

  // ── 상세 로드 ────────────────────────────────────────────────────────────────

  const openDetail = async (item: RentalRefundRequestBase) => {
    setSelectedItem(item);
    setDetail(null);
    setModalType('detail');
    try {
      setDetailLoading(true);
      const d = await rentalRefundRequestService.getDetail(item.id);
      setDetail(d);
    } catch {
      alert('상세 정보를 불러오는데 실패했습니다.');
      setModalType(null);
    } finally {
      setDetailLoading(false);
    }
  };

  // ── 모달 닫기 ────────────────────────────────────────────────────────────────

  const closeModal = () => {
    setModalType(null);
    setSelectedItem(null);
    setDetail(null);
    setAdminNotes('');
    setRejectReason('');
    setNextRetrievalStatus(null);
  };

  // ── 수거 상태 다음 단계 계산 ─────────────────────────────────────────────────

  const getNextRetrieval = (current: RetrievalStatus | null): RetrievalStatus | null => {
    if (current === 'RETRIEVAL_PENDING') return 'IN_RETRIEVAL';
    if (current === 'IN_RETRIEVAL')      return 'RETRIEVED';
    return null;
  };

  // ── 승인 처리 ────────────────────────────────────────────────────────────────

  const handleApprove = async () => {
    if (!selectedItem) return;
    try {
      setActionLoading(true);
      const res = await rentalRefundRequestService.approve(
        selectedItem.id,
        adminNotes.trim() || undefined
      );
      closeModal();
      const deduction = res.shippingDeduction > 0 ? `\n수거비 차감: ${formatCurrency(res.shippingDeduction)}` : '\n수거비 면제';
      const retrieval = res.retrievalStatus ? `\n수거 상태: ${RETRIEVAL_STATUS_MAP[res.retrievalStatus]?.label}` : '\n(배송 전 상품 — 수거 불필요)';
      alert(`환불 요청 승인 완료\n\n상품 금액: ${formatCurrency(res.itemTotalAmount)}${deduction}\n최종 환불: ${formatCurrency(res.finalRefundAmount)}${retrieval}`);
      loadList();
    } catch (err: any) {
      alert(err?.message || '승인 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── 거절 처리 ────────────────────────────────────────────────────────────────

  const handleReject = async () => {
    if (!selectedItem) return;
    if (!rejectReason.trim()) { alert('거절 사유를 입력해주세요.'); return; }
    try {
      setActionLoading(true);
      const res = await rentalRefundRequestService.reject(selectedItem.id, rejectReason.trim());
      closeModal();
      alert(`환불 요청 거절 완료\n\n거절 사유: ${res.rejectReason}\n복원된 아이템: ${res.restoredItemCount}개`);
      loadList();
    } catch (err: any) {
      alert(err?.message || '거절 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── 수거 상태 업데이트 ───────────────────────────────────────────────────────

  const handleUpdateRetrieval = async () => {
    if (!selectedItem || !nextRetrievalStatus) return;
    try {
      setActionLoading(true);
      const res = await rentalRefundRequestService.updateRetrieval(selectedItem.id, nextRetrievalStatus);
      // 상세 데이터 갱신
      const updated = await rentalRefundRequestService.getDetail(selectedItem.id);
      setDetail(updated);
      setNextRetrievalStatus(null);
      setModalType('detail');
      alert(`수거 상태 업데이트 완료: ${res.retrievalStatusLabel}`);
      loadList();
    } catch (err: any) {
      alert(err?.message || '수거 상태 업데이트에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── 테이블 컬럼 ──────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'id' as keyof RentalRefundRequestBase,
      title: '요청 ID',
      width: '7%',
      render: (value: RentalRefundRequestBase['id']) => (
        <span className="font-mono text-sm text-gray-700">#{value}</span>
      ),
    },
    {
      key: 'contract' as keyof RentalRefundRequestBase,
      title: '게스트',
      width: '10%',
      render: (value: RentalRefundRequestBase['contract']) => (
        <div>
          <div className="font-medium text-sm">{value.guest.name}</div>
          <div className="text-xs text-gray-500">{value.guest.nickname}</div>
        </div>
      ),
    },
    {
      key: 'rentalOrder' as keyof RentalRefundRequestBase,
      title: '주문번호',
      width: '13%',
      render: (value: RentalRefundRequestBase['rentalOrder']) => (
        <span className="font-mono text-xs text-gray-700">{value.orderId}</span>
      ),
    },
    {
      key: 'rentalOrder' as keyof RentalRefundRequestBase,
      title: '상품',
      width: '16%',
      render: (value: RentalRefundRequestBase['rentalOrder']) => {
        const names = value.items.map((i) => `${i.name} ×${i.quantity}`).join(', ');
        return (
          <span className="truncate block max-w-[140px] text-sm" title={names}>{names}</span>
        );
      },
    },
    {
      key: 'itemTotalAmount' as keyof RentalRefundRequestBase,
      title: '상품 금액',
      width: '10%',
      render: (value: number) => (
        <span className="font-semibold text-sm">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'finalRefundAmount' as keyof RentalRefundRequestBase,
      title: '최종 환불',
      width: '10%',
      render: (value: number, row: RentalRefundRequestBase) =>
        row.status === 'APPROVED' ? (
          <span className="font-semibold text-blue-600 text-sm">{formatCurrency(value)}</span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      key: 'retrievalStatus' as keyof RentalRefundRequestBase,
      title: '수거 상태',
      width: '10%',
      render: (value: RetrievalStatus | null) =>
        value ? (
          <Badge variant={RETRIEVAL_STATUS_MAP[value].variant}>
            {RETRIEVAL_STATUS_MAP[value].label}
          </Badge>
        ) : (
          <span className="text-gray-400 text-xs">-</span>
        ),
    },
    {
      key: 'createdAt' as keyof RentalRefundRequestBase,
      title: '요청일',
      width: '9%',
      render: (value: string) => formatDate(value),
    },
    {
      key: 'status' as keyof RentalRefundRequestBase,
      title: '상태',
      width: '9%',
      render: (value: RentalRefundRequestStatus) => (
        <Badge variant={REQUEST_STATUS_MAP[value].variant}>
          {REQUEST_STATUS_MAP[value].label}
        </Badge>
      ),
    },
    {
      key: 'id' as keyof RentalRefundRequestBase,
      title: '액션',
      width: '6%',
      render: (_: number, row: RentalRefundRequestBase) => (
        <Button
          size="sm"
          variant="secondary"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); openDetail(row); }}
        >
          상세
        </Button>
      ),
    },
  ];

  // ── 렌더 ─────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">옵션상품 환불 요청</h1>
      </div>

      {/* 필터 */}
      <Card>
        <div className="flex gap-3 items-center flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as RentalRefundRequestStatus | 'all');
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <div className="text-sm text-gray-600">총 {total}건</div>
        </div>
      </Card>

      {/* 테이블 */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadList}>다시 시도</Button>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-gray-500">환불 요청이 없습니다.</div>
        ) : (
          <Table<RentalRefundRequestBase>
            columns={columns}
            data={items}
            onRowClick={openDetail}
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

      {/* ── 상세 모달 ──────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalType === 'detail'}
        onClose={closeModal}
        title={`환불 요청 상세 #${selectedItem?.id}`}
        footer={
          detail && (
            <div className="flex justify-between items-center w-full">
              <div className="flex gap-2">
                {detail.status === 'PENDING' && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => setModalType('approve')}
                    >
                      승인
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setModalType('reject')}
                    >
                      거절
                    </Button>
                  </>
                )}
                {detail.status === 'APPROVED' && getNextRetrieval(detail.retrievalStatus) && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setNextRetrievalStatus(getNextRetrieval(detail.retrievalStatus));
                      setModalType('retrieval');
                    }}
                  >
                    수거 상태 업데이트
                  </Button>
                )}
              </div>
              <Button variant="secondary" onClick={closeModal}>닫기</Button>
            </div>
          )
        }
      >
        {detailLoading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : detail ? (
          <div className="space-y-5 text-sm">
            {/* 게스트 정보 */}
            <section>
              <h3 className="font-semibold text-gray-800 mb-2 pb-1 border-b">게스트 정보</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="text-gray-500">이름</div>
                <div>{detail.contract.guest.name} ({detail.contract.guest.nickname})</div>
                <div className="text-gray-500">이메일</div>
                <div>{detail.contract.guest.email}</div>
                <div className="text-gray-500">전화번호</div>
                <div>{detail.contract.guest.phoneNumber}</div>
                <div className="text-gray-500">계약 기간</div>
                <div>{formatDate(detail.contract.checkInDate)} ~ {formatDate(detail.contract.checkOutDate)}</div>
                <div className="text-gray-500">계약 번호</div>
                <div className="font-mono">{detail.contract.orderId}</div>
              </div>
            </section>

            {/* 주문/상품 정보 */}
            <section>
              <h3 className="font-semibold text-gray-800 mb-2 pb-1 border-b">주문 정보</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 mb-3">
                <div className="text-gray-500">주문번호</div>
                <div className="font-mono">{detail.rentalOrder.orderId}</div>
                <div className="text-gray-500">배송 상태</div>
                <div>{DELIVERY_STATUS_LABEL[detail.deliveryStatusSnapshot] ?? detail.deliveryStatusSnapshot}</div>
              </div>
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 text-gray-600">상품명</th>
                    <th className="text-center px-3 py-2 text-gray-600">수량</th>
                    <th className="text-right px-3 py-2 text-gray-600">금액</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.rentalOrder.items.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="text-center px-3 py-2">{item.quantity}</td>
                      <td className="text-right px-3 py-2">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            {/* 환불 금액 */}
            <section>
              <h3 className="font-semibold text-gray-800 mb-2 pb-1 border-b">환불 금액</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="text-gray-500">상품 금액</div>
                <div>{formatCurrency(detail.itemTotalAmount)}</div>
                <div className="text-gray-500">수거비 차감</div>
                <div>
                  {detail.status === 'APPROVED' ? (
                    formatCurrency(detail.shippingDeduction)
                  ) : detail.shippingDeductionWaivable ? (
                    <span className="text-green-600">면제 예정 (같은 계약 회수 기사 방문 예정)</span>
                  ) : detail.deliveryStatusSnapshot === 'PENDING' ? (
                    <span className="text-gray-400">없음 (배송 전)</span>
                  ) : (
                    <span className="text-orange-600">7,000원 차감 예정</span>
                  )}
                </div>
                <div className="text-gray-500 font-semibold">최종 환불 금액</div>
                <div className="font-semibold text-blue-600">
                  {detail.status === 'APPROVED'
                    ? formatCurrency(detail.finalRefundAmount)
                    : '-'}
                </div>
                <div className="text-gray-500">환불 가능 잔액</div>
                <div>{formatCurrency(detail.rentalOrder.payment.balanceAmount)}</div>
              </div>
            </section>

            {/* 수거 상태 */}
            {detail.retrievalStatus && (
              <section>
                <h3 className="font-semibold text-gray-800 mb-2 pb-1 border-b">수거 현황</h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                  <div className="text-gray-500">수거 상태</div>
                  <div>
                    <Badge variant={RETRIEVAL_STATUS_MAP[detail.retrievalStatus].variant}>
                      {RETRIEVAL_STATUS_MAP[detail.retrievalStatus].label}
                    </Badge>
                  </div>
                  {detail.retrievalStartedAt && (
                    <>
                      <div className="text-gray-500">수거 시작</div>
                      <div>{formatDateTime(detail.retrievalStartedAt)}</div>
                    </>
                  )}
                  {detail.retrievalCompletedAt && (
                    <>
                      <div className="text-gray-500">수거 완료</div>
                      <div>{formatDateTime(detail.retrievalCompletedAt)}</div>
                    </>
                  )}
                </div>
              </section>
            )}

            {/* 요청 정보 */}
            <section>
              <h3 className="font-semibold text-gray-800 mb-2 pb-1 border-b">요청 정보</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                <div className="text-gray-500">요청 상태</div>
                <div>
                  <Badge variant={REQUEST_STATUS_MAP[detail.status].variant}>
                    {REQUEST_STATUS_MAP[detail.status].label}
                  </Badge>
                </div>
                <div className="text-gray-500">취소 사유</div>
                <div>{detail.cancelReason}</div>
                {detail.rejectReason && (
                  <>
                    <div className="text-gray-500">거절 사유</div>
                    <div className="text-red-600">{detail.rejectReason}</div>
                  </>
                )}
                <div className="text-gray-500">요청일</div>
                <div>{formatDateTime(detail.createdAt)}</div>
                {detail.processedAt && (
                  <>
                    <div className="text-gray-500">처리일</div>
                    <div>{formatDateTime(detail.processedAt)}</div>
                  </>
                )}
              </div>
            </section>
          </div>
        ) : null}
      </Modal>

      {/* ── 승인 확인 모달 ─────────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalType === 'approve'}
        onClose={() => setModalType('detail')}
        title="환불 요청 승인"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType('detail')}>취소</Button>
            <Button variant="primary" onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '승인 확인'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4 text-sm">
          {detail && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">상품 금액</span>
                  <span className="font-semibold">{formatCurrency(detail.itemTotalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">수거비 차감</span>
                  {detail.shippingDeductionWaivable ? (
                    <span className="text-green-600 font-medium">면제 (같은 계약 회수 예정)</span>
                  ) : detail.deliveryStatusSnapshot === 'PENDING' ? (
                    <span className="text-gray-400">없음 (배송 전)</span>
                  ) : (
                    <span className="text-orange-600 font-medium">−{formatCurrency(7000)}</span>
                  )}
                </div>
                <div className="flex justify-between border-t pt-2 mt-1">
                  <span className="font-semibold">예상 환불 금액</span>
                  <span className="font-bold text-blue-600">
                    {detail.shippingDeductionWaivable || detail.deliveryStatusSnapshot === 'PENDING'
                      ? formatCurrency(detail.itemTotalAmount)
                      : formatCurrency(detail.itemTotalAmount - 7000)}
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-gray-700 mb-1">관리자 메모 (선택)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="처리 메모를 입력하세요"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* ── 거절 모달 ──────────────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={() => setModalType('detail')}
        title="환불 요청 거절"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType('detail')}>취소</Button>
            <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '거절 확인'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 text-sm">
          <p className="text-gray-600">
            거절 시 취소 요청된 아이템이 <strong>ACTIVE</strong> 상태로 복원됩니다.
          </p>
          <div>
            <label className="block text-gray-700 mb-1">
              거절 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="거절 사유를 입력해주세요"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* ── 수거 상태 업데이트 모달 ────────────────────────────────────────────── */}
      <Modal
        isOpen={modalType === 'retrieval'}
        onClose={() => setModalType('detail')}
        title="수거 상태 업데이트"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType('detail')}>취소</Button>
            <Button variant="primary" onClick={handleUpdateRetrieval} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '업데이트'}
            </Button>
          </div>
        }
      >
        <div className="text-sm space-y-3">
          {detail && nextRetrievalStatus && (
            <>
              <div className="flex items-center gap-3">
                <Badge variant={RETRIEVAL_STATUS_MAP[detail.retrievalStatus!].variant}>
                  {RETRIEVAL_STATUS_MAP[detail.retrievalStatus!].label}
                </Badge>
                <span className="text-gray-400">→</span>
                <Badge variant={RETRIEVAL_STATUS_MAP[nextRetrievalStatus].variant}>
                  {RETRIEVAL_STATUS_MAP[nextRetrievalStatus].label}
                </Badge>
              </div>
              <p className="text-gray-600">수거 상태를 업데이트하시겠습니까?</p>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
}
