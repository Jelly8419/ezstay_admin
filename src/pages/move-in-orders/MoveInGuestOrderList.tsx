import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Table } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { Pagination } from '../../components/common/Pagination';
import { moveInCaseService } from '../../services/moveInCaseService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import type {
  MoveInGuestOrderMonitorItem,
  MoveInGuestOrderDetail,
  MoveInGuestOrderListParams,
  MoveInGuestOrderStatus,
  MoveInGuestOrderDeliveryStatus,
  MoveInGuestOrderType,
} from '../../types';
import {
  GUEST_ORDER_STATUS_CONFIG,
  GUEST_ORDER_STATUS_OPTIONS,
  GUEST_ORDER_DELIVERY_CONFIG,
  GUEST_ORDER_DELIVERY_OPTIONS,
  GUEST_ORDER_TYPE_OPTIONS,
  GUEST_ORDER_DELIVERY_TRANSITIONS,
} from '../move-in-cases/moveInCaseLabels';

const DEFAULT_LIMIT = 20;

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-1.5">
      <div className="w-28 shrink-0 text-sm text-gray-500">{label}</div>
      <div className="flex-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

export default function MoveInGuestOrderList() {
  const navigate = useNavigate();

  const [items, setItems] = useState<MoveInGuestOrderMonitorItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 필터
  const [status, setStatus] = useState<MoveInGuestOrderStatus | 'all'>('all');
  const [deliveryStatus, setDeliveryStatus] = useState<
    MoveInGuestOrderDeliveryStatus | 'all'
  >('all');
  const [orderType, setOrderType] = useState<MoveInGuestOrderType | 'all'>(
    'all'
  );
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // 상세 모달
  const [detail, setDetail] = useState<MoveInGuestOrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // 배송 갱신
  const [deliverySaving, setDeliverySaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: MoveInGuestOrderListParams = {
        page,
        limit: DEFAULT_LIMIT,
      };
      if (status !== 'all') params.status = status;
      if (deliveryStatus !== 'all') params.deliveryStatus = deliveryStatus;
      if (orderType !== 'all') params.orderType = orderType;
      if (search.trim()) params.search = search.trim();

      const res = await moveInCaseService.getGuestOrders(params);
      setItems(res.items);
      setTotal(res.pagination.total);
      setTotalPages(res.pagination.totalPages);
    } catch (e: any) {
      setError(e?.message || '목록 조회에 실패했습니다.');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [page, status, deliveryStatus, orderType, search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleResetFilters = () => {
    setStatus('all');
    setDeliveryStatus('all');
    setOrderType('all');
    setSearchInput('');
    setSearch('');
    setPage(1);
  };

  const openDetail = async (orderDbId: number) => {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const res = await moveInCaseService.getGuestOrderDetail(orderDbId);
      setDetail(res);
    } catch (e: any) {
      setDetailError(e?.message || '상세 조회에 실패했습니다.');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailError(null);
    setDetailLoading(false);
  };

  const handleUpdateDelivery = async (
    next: MoveInGuestOrderDeliveryStatus
  ) => {
    if (!detail) return;
    const note = window.prompt(
      `배송 상태를 "${GUEST_ORDER_DELIVERY_CONFIG[next].label}"(으)로 변경합니다.\n메모를 입력하세요 (선택, 비워도 됨).`
    );
    if (note === null) return; // 취소
    setDeliverySaving(true);
    try {
      const trimmed = note.trim();
      const orderId = detail.id;
      await moveInCaseService.updateGuestOrderDelivery(orderId, {
        deliveryStatus: next,
        ...(trimmed === '' ? {} : { note: trimmed }),
      });
      // PATCH 응답 형태가 GET 상세와 다를 수 있어 상세를 다시 조회
      const fresh = await moveInCaseService.getGuestOrderDetail(orderId);
      setDetail(fresh);
      await load();
    } catch (e: any) {
      alert(e?.message || '배송 상태 변경에 실패했습니다.');
    } finally {
      setDeliverySaving(false);
    }
  };

  const columns = [
    {
      key: 'orderId',
      title: '주문번호',
      render: (_: any, r: MoveInGuestOrderMonitorItem) => (
        <div>
          <div className="font-mono text-xs text-gray-900">{r.orderId}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {r.orderType === 'INITIAL' ? '최초 주문' : '추가 주문'}
          </div>
        </div>
      ),
    },
    {
      key: 'case',
      title: '케이스 / 임차인',
      render: (_: any, r: MoveInGuestOrderMonitorItem) => (
        <div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/move-in-cases/${r.case.caseId}`);
            }}
            className="font-medium text-primary-600 hover:underline"
          >
            케이스 #{r.case.caseId}
          </button>
          <div className="text-xs text-gray-500 mt-0.5">
            {r.case.guestName} · {r.case.guestPhone}
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      title: '금액',
      render: (_: any, r: MoveInGuestOrderMonitorItem) => (
        <div className="text-sm">
          <div className="text-gray-900">{formatCurrency(r.totalAmount)}</div>
          {r.refundedAmount > 0 && (
            <div className="text-xs text-red-600 mt-0.5">
              환불 {formatCurrency(r.refundedAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      title: '주문 상태',
      render: (_: any, r: MoveInGuestOrderMonitorItem) => {
        const cfg = GUEST_ORDER_STATUS_CONFIG[r.status];
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'deliveryStatus',
      title: '배송 상태',
      render: (_: any, r: MoveInGuestOrderMonitorItem) => {
        if (!r.deliveryStatus)
          return <span className="text-gray-400">-</span>;
        const cfg = GUEST_ORDER_DELIVERY_CONFIG[r.deliveryStatus];
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      key: 'paidAt',
      title: '결제일',
      render: (_: any, r: MoveInGuestOrderMonitorItem) => (
        <span className="text-xs text-gray-700">
          {r.paidAt ? formatDateTime(r.paidAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      title: '관리',
      width: '100px',
      render: (_: any, r: MoveInGuestOrderMonitorItem) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            openDetail(r.id);
          }}
        >
          상세
        </Button>
      ),
    },
  ];

  const detailDeliveryTransitions =
    detail && detail.deliveryStatus
      ? GUEST_ORDER_DELIVERY_TRANSITIONS[detail.deliveryStatus]
      : [];

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">
        총 {total.toLocaleString('ko-KR')}건의 주문
      </p>

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
              placeholder="주문번호, 임차인 이름/전화 검색"
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <Button onClick={handleSearch}>검색</Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              주문 상태
            </label>
            <select
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value as MoveInGuestOrderStatus | 'all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {GUEST_ORDER_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              배송 상태
            </label>
            <select
              value={deliveryStatus}
              onChange={(e) => {
                setPage(1);
                setDeliveryStatus(
                  e.target.value as MoveInGuestOrderDeliveryStatus | 'all'
                );
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {GUEST_ORDER_DELIVERY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              주문 유형
            </label>
            <select
              value={orderType}
              onChange={(e) => {
                setPage(1);
                setOrderType(e.target.value as MoveInGuestOrderType | 'all');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {GUEST_ORDER_TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
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
            <Table<MoveInGuestOrderMonitorItem>
              columns={columns}
              data={items}
              onRowClick={(r) => openDetail(r.id)}
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

      <Modal
        isOpen={detailLoading || detail !== null || detailError !== null}
        onClose={closeDetail}
        title="주문 상세"
        size="xl"
      >
        {detailLoading ? (
          <div className="py-12 text-center text-gray-500">불러오는 중...</div>
        ) : detailError ? (
          <div className="py-6 text-center text-red-600 text-sm">
            {detailError}
          </div>
        ) : detail ? (
          <div className="space-y-5">
            {/* 주문 기본 */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-sm font-semibold text-gray-900">
                  {detail.orderId}
                </span>
                <Badge variant={GUEST_ORDER_STATUS_CONFIG[detail.status].variant}>
                  {GUEST_ORDER_STATUS_CONFIG[detail.status].label}
                </Badge>
                {detail.deliveryStatus && (
                  <Badge
                    variant={
                      GUEST_ORDER_DELIVERY_CONFIG[detail.deliveryStatus].variant
                    }
                  >
                    {GUEST_ORDER_DELIVERY_CONFIG[detail.deliveryStatus].label}
                  </Badge>
                )}
              </div>
              <InfoRow
                label="케이스"
                value={
                  <button
                    type="button"
                    onClick={() =>
                      navigate(`/move-in-cases/${detail.case.caseId}`)
                    }
                    className="text-primary-600 hover:underline"
                  >
                    케이스 #{detail.case.caseId}
                  </button>
                }
              />
              <InfoRow
                label="임차인"
                value={`${detail.case.guestName} · ${detail.case.guestPhone}`}
              />
              <InfoRow
                label="입주/퇴실"
                value={`${formatDate(detail.case.checkInDate)} ~ ${formatDate(
                  detail.case.checkOutDate
                )}`}
              />
              <InfoRow
                label="주문 금액"
                value={formatCurrency(detail.totalAmount)}
              />
              <InfoRow
                label="환불 금액"
                value={
                  detail.refundedAmount > 0
                    ? formatCurrency(detail.refundedAmount)
                    : '-'
                }
              />
              <InfoRow
                label="결제일"
                value={detail.paidAt ? formatDateTime(detail.paidAt) : '-'}
              />
              <InfoRow
                label="수정 가능 기한"
                value={
                  detail.modifiableUntil
                    ? formatDateTime(detail.modifiableUntil)
                    : '-'
                }
              />
            </div>

            {/* 배송 상태 변경 */}
            {detail.deliveryStatus && (
              <div className="border-t pt-4">
                <div className="text-sm font-semibold text-gray-900 mb-2">
                  배송 상태 변경
                </div>
                {detailDeliveryTransitions.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    더 이상 변경 가능한 상태가 없습니다.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {detailDeliveryTransitions.map((next) => (
                      <Button
                        key={next}
                        size="sm"
                        variant="secondary"
                        disabled={deliverySaving}
                        onClick={() => handleUpdateDelivery(next)}
                      >
                        → {GUEST_ORDER_DELIVERY_CONFIG[next].label}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 주문 항목 */}
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                주문 항목
              </div>
              <div className="space-y-1">
                {(detail.items ?? []).map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between text-sm py-1"
                  >
                    <span className="text-gray-900">
                      {it.optionName} × {it.quantity}
                      {it.status !== 'ACTIVE' && (
                        <span className="ml-2 text-xs text-red-600">
                          ({it.status})
                        </span>
                      )}
                    </span>
                    <span className="text-gray-700">
                      {formatCurrency(it.totalPrice)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 결제 내역 */}
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                결제 내역
              </div>
              <div className="space-y-2">
                {(detail.payments ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-gray-700">
                      {p.pgMethod || '-'} · {p.status}
                    </span>
                    <span className="text-gray-900">
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 로그 */}
            <div className="border-t pt-4">
              <div className="text-sm font-semibold text-gray-900 mb-2">
                변경 이력
              </div>
              {(detail.logs ?? []).length === 0 ? (
                <p className="text-sm text-gray-500">이력이 없습니다.</p>
              ) : (
                <div className="space-y-2">
                  {(detail.logs ?? []).map((log) => (
                    <div
                      key={log.id}
                      className="text-sm border-l-2 border-gray-200 pl-3 py-0.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-gray-900 font-medium">
                          {log.action}
                        </span>
                        <span className="text-xs text-gray-400">
                          {log.actor}
                        </span>
                        {log.amountChange !== 0 && (
                          <span
                            className={`text-xs ${
                              log.amountChange < 0
                                ? 'text-red-600'
                                : 'text-green-600'
                            }`}
                          >
                            {log.amountChange > 0 ? '+' : ''}
                            {formatCurrency(log.amountChange)}
                          </span>
                        )}
                      </div>
                      {log.description && (
                        <div className="text-xs text-gray-600 mt-0.5">
                          {log.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-0.5">
                        {formatDateTime(log.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
