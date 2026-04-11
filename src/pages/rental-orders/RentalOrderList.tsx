import { useState, useEffect } from 'react';
import type { RentalOrder, RentalOrderStatus, DeliveryStatus } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/common/Pagination';
import { rentalOrderService } from '../../services/rentalOrderService';

// ─── 상태 매핑 ────────────────────────────────────────────────────────────────

const DELIVERY_STATUS_MAP: Record<
  DeliveryStatus,
  { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }
> = {
  PENDING:    { variant: 'default', label: '배송 전' },
  IN_TRANSIT: { variant: 'info',    label: '배송 중' },
  DELIVERED:  { variant: 'success', label: '배송 완료' },
};

const ORDER_STATUS_MAP: Record<
  RentalOrderStatus,
  { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }
> = {
  PENDING:         { variant: 'default', label: '미결제' },
  PAID:            { variant: 'success', label: '결제 완료' },
  PARTIAL_REFUND:  { variant: 'info',    label: '부분 환불' },
  FULLY_REFUNDED:  { variant: 'danger',  label: '전액 환불' },
  CANCELLED:       { variant: 'danger',  label: '취소' },
};

const DELIVERY_FILTER_OPTIONS: { value: DeliveryStatus | 'all'; label: string }[] = [
  { value: 'all',        label: '전체' },
  { value: 'PENDING',    label: '배송 전' },
  { value: 'IN_TRANSIT', label: '배송 중' },
  { value: 'DELIVERED',  label: '배송 완료' },
];

const ORDER_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'all',        label: '전체' },
  { value: 'INITIAL',    label: 'INITIAL' },
  { value: 'ADDITIONAL', label: 'ADDITIONAL' },
];

const DELIVERY_STATUS_BUTTONS: { value: DeliveryStatus; label: string }[] = [
  { value: 'PENDING',    label: '배송 전' },
  { value: 'IN_TRANSIT', label: '배송 중' },
  { value: 'DELIVERED',  label: '배송 완료' },
];

// ─── 배송 변경 가능 여부 ──────────────────────────────────────────────────────

const canUpdateDelivery = (order: RentalOrder) =>
  order.status === 'PAID' || order.status === 'PARTIAL_REFUND';

// ─── 컴포넌트 ─────────────────────────────────────────────────────────────────

export default function RentalOrderList() {
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryStatus | 'all'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 20;

  // 배송 상태 변경 모달
  const [selectedOrder, setSelectedOrder] = useState<RentalOrder | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryStatus | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── 목록 로드 ────────────────────────────────────────────────────────────────

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await rentalOrderService.getRentalOrders({
        page: currentPage,
        limit: itemsPerPage,
        ...(deliveryFilter !== 'all' && { deliveryStatus: deliveryFilter }),
        ...(orderTypeFilter !== 'all' && { orderType: orderTypeFilter }),
        sortOrder: 'DESC',
      });
      setOrders(res.orders ?? []);
      setTotal(res.pagination?.total ?? 0);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch {
      setError('렌탈 주문 목록을 불러오는데 실패했습니다.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrders(); }, [currentPage, deliveryFilter, orderTypeFilter]);

  // ── 모달 열기/닫기 ───────────────────────────────────────────────────────────

  const openModal = (order: RentalOrder) => {
    setSelectedOrder(order);
    setSelectedDelivery(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedOrder(null);
    setSelectedDelivery(null);
  };

  // ── 배송 상태 변경 ───────────────────────────────────────────────────────────

  const handleUpdateDelivery = async () => {
    if (!selectedOrder || !selectedDelivery) return;
    try {
      setActionLoading(true);
      await rentalOrderService.updateDeliveryStatus(selectedOrder.id, selectedDelivery);
      closeModal();
      alert(`배송 상태가 "${DELIVERY_STATUS_MAP[selectedDelivery].label}"(으)로 변경되었습니다.`);
      loadOrders();
    } catch (err: any) {
      alert(err?.message || '배송 상태 변경에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── 테이블 컬럼 ──────────────────────────────────────────────────────────────

  const columns = [
    {
      key: 'orderId' as keyof RentalOrder,
      title: '주문번호',
      width: '14%',
      render: (value: string) => (
        <span className="font-mono text-xs text-gray-700">{value}</span>
      ),
    },
    {
      key: 'orderType' as keyof RentalOrder,
      title: '유형',
      width: '9%',
      render: (value: string) => (
        <Badge variant={value === 'INITIAL' ? 'info' : 'warning'}>
          {value === 'INITIAL' ? '최초' : '추가'}
        </Badge>
      ),
    },
    {
      key: 'contract' as keyof RentalOrder,
      title: '게스트',
      width: '10%',
      render: (value: RentalOrder['contract']) => (
        <div>
          <div className="text-sm font-medium">{value.guest.name}</div>
          <div className="text-xs text-gray-500">{value.guest.nickname}</div>
        </div>
      ),
    },
    {
      key: 'contract_room' as keyof RentalOrder,
      title: '방',
      width: '13%',
      render: (_: any, record: RentalOrder) => (
        <span className="text-sm truncate block max-w-[110px]" title={record.contract.room.roomName}>
          {record.contract.room.roomName}
        </span>
      ),
    },
    {
      key: 'items' as keyof RentalOrder,
      title: '상품',
      width: '16%',
      render: (value: RentalOrder['items']) => {
        const names = value.map((i) => `${i.name} ×${i.quantity}`).join(', ');
        return (
          <span className="text-sm truncate block max-w-[130px]" title={names}>{names}</span>
        );
      },
    },
    {
      key: 'totalAmount' as keyof RentalOrder,
      title: '금액',
      width: '9%',
      render: (value: number) => (
        <span className="font-semibold text-sm">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status' as keyof RentalOrder,
      title: '결제 상태',
      width: '9%',
      render: (value: RentalOrderStatus) => {
        const cfg = ORDER_STATUS_MAP[value] ?? { variant: 'default' as const, label: value };
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'deliveryStatus' as keyof RentalOrder,
      title: '배송 상태',
      width: '9%',
      render: (value: DeliveryStatus) => {
        const cfg = DELIVERY_STATUS_MAP[value] ?? { variant: 'default' as const, label: value };
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'paidAt' as keyof RentalOrder,
      title: '결제일',
      width: '8%',
      render: (value: string | null) => value ? formatDate(value) : '-',
    },
    {
      key: 'id' as keyof RentalOrder,
      title: '액션',
      width: '8%',
      render: (_: number, row: RentalOrder) =>
        canUpdateDelivery(row) ? (
          <Button
            size="sm"
            variant="secondary"
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); openModal(row); }}
          >
            상태 변경
          </Button>
        ) : (
          <span className="text-xs text-gray-400">변경 불가</span>
        ),
    },
  ];

  // ── 렌더 ─────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">배송 상태 관리</h1>
      </div>

      {/* 필터 */}
      <Card>
        <div className="flex gap-3 items-center flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">배송 상태:</span>
            <select
              value={deliveryFilter}
              onChange={(e) => { setDeliveryFilter(e.target.value as DeliveryStatus | 'all'); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {DELIVERY_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 whitespace-nowrap">주문 유형:</span>
            <select
              value={orderTypeFilter}
              onChange={(e) => { setOrderTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              {ORDER_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div className="text-sm text-gray-500 ml-auto">총 {total}건</div>
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
            <Button onClick={loadOrders}>다시 시도</Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-gray-500">렌탈 주문이 없습니다.</div>
        ) : (
          <Table<RentalOrder> columns={columns} data={orders} />
        )}
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      {/* ── 배송 상태 변경 모달 ────────────────────────────────────────────────── */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title="배송 상태 변경"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button
              variant="primary"
              onClick={handleUpdateDelivery}
              disabled={!selectedDelivery || actionLoading}
            >
              {actionLoading ? '처리 중...' : '변경 확인'}
            </Button>
          </div>
        }
      >
        {selectedOrder && (
          <div className="space-y-4 text-sm">
            {/* 주문 요약 */}
            <div className="bg-gray-50 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between">
                <span className="text-gray-500">주문번호</span>
                <span className="font-mono text-xs">{selectedOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">게스트</span>
                <span>{selectedOrder.contract.guest.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">현재 배송 상태</span>
                <Badge variant={(DELIVERY_STATUS_MAP[selectedOrder.deliveryStatus] ?? { variant: 'default' as const }).variant}>
                  {(DELIVERY_STATUS_MAP[selectedOrder.deliveryStatus] ?? { label: selectedOrder.deliveryStatus }).label}
                </Badge>
              </div>
              {selectedOrder.deliveredAt && (
                <div className="flex justify-between">
                  <span className="text-gray-500">배송 완료일</span>
                  <span>{formatDateTime(selectedOrder.deliveredAt)}</span>
                </div>
              )}
            </div>

            {/* 상태 선택 */}
            <div>
              <p className="text-gray-700 mb-2 font-medium">변경할 상태 선택</p>
              <div className="flex gap-2">
                {DELIVERY_STATUS_BUTTONS.map((btn) => {
                  const isCurrent = selectedOrder.deliveryStatus === btn.value;
                  const isSelected = selectedDelivery === btn.value;
                  return (
                    <button
                      key={btn.value}
                      disabled={isCurrent}
                      onClick={() => setSelectedDelivery(btn.value)}
                      className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors
                        ${isCurrent
                          ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                          : isSelected
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-primary-400 hover:bg-primary-50'
                        }`}
                    >
                      {btn.label}
                      {isCurrent && <span className="block text-xs mt-0.5">(현재)</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DELIVERED 선택 시 안내 */}
            {selectedDelivery === 'DELIVERED' && (
              <p className="text-xs text-blue-600 bg-blue-50 rounded px-3 py-2">
                배송 완료로 변경 시 delivered_at이 자동으로 기록됩니다.
              </p>
            )}

            {/* 제약 조건 안내 */}
            <p className="text-xs text-gray-400">
              * PAID 또는 PARTIAL_REFUND 상태 주문만 변경 가능합니다.
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
