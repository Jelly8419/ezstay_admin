import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type {
  PaymentLog,
  AdminRefundType,
  AdminRefundItems,
  AdminRefundRentalItem,
} from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { paymentService } from '../../services/paymentService';
import { refundService } from '../../services/refundService';
import { rentalOrderService } from '../../services/rentalOrderService';

const getTransactionTypeBadge = (type: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    '결제완료': 'success',
    '부분취소': 'warning',
    '전체취소': 'danger',
  };
  return <Badge variant={map[type] || 'default'}>{type}</Badge>;
};

const isRefundEvent = (type: string) => ['부분취소', '전체취소'].includes(type);

// ADDITIONAL 렌탈 주문인지 판별 (type 쿼리파라미터 우선, orderType/productType 폴백)
const isAdditionalRental = (type: string | undefined, productType: string) =>
  type === 'rental' || productType === 'rental' || productType === '렌탈';

const REFUND_TYPE_LABELS: Record<AdminRefundType, string> = {
  FULL: '전체 환불',
  PARTIAL_ITEMS: '항목별 입력',
};

const CONTRACT_ITEMS_LABELS: Array<{ key: keyof Omit<AdminRefundItems, 'rentalItems'>; label: string }> = [
  { key: 'rentalFee', label: '임대료' },
  { key: 'maintenanceFee', label: '관리비' },
  { key: 'cleaningFee', label: '청소비' },
  { key: 'platformFee', label: '플랫폼 수수료' },
  { key: 'deposit', label: '보증금' },
];

interface RentalItemEntry {
  id: number;
  name: string;
  quantity: number;
  totalPrice: number;
}

export default function PaymentDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || undefined;
  const from = searchParams.get('from') || undefined;
  const navigate = useNavigate();

  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [summary, setSummary] = useState<{
    contractPaidAmount?: number;
    hostBurdenPaidAmount?: number;
    totalPaidAmount?: number;
    totalRefundedAmount?: number;
    currentBalance?: number;
  } | null>(null);
  const [contractId, setContractId] = useState<number | null>(null);
  const [rentalOrderId, setRentalOrderId] = useState<string | null>(null);
  const [productType, setProductType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 환불 모달 states
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundType, setRefundType] = useState<AdminRefundType>('FULL');
  const [refundReason, setRefundReason] = useState('');
  // 계약 결제 항목별 금액 (계약/계약+렌탈 타입)
  const [contractItemAmounts, setContractItemAmounts] = useState<
    Partial<Record<keyof Omit<AdminRefundItems, 'rentalItems'>, string>>
  >({});
  // 아이템별 환불 금액 (계약의 INITIAL 렌탈 아이템 또는 ADDITIONAL 아이템 공용)
  const [rentalItemEntries, setRentalItemEntries] = useState<RentalItemEntry[]>([]);
  const [rentalItemAmounts, setRentalItemAmounts] = useState<Record<number, string>>({});
  const [itemsLoading, setItemsLoading] = useState(false);
  const [refundLoading, setRefundLoading] = useState(false);

  const loadDetail = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await paymentService.getPaymentDetail(orderId, type) as any;

      // 타임라인: 렌탈은 type 필드, 계약은 type 필드 (transactionType 폴백)
      const timeline = (data.timeline || []).map((item: any) => ({
        ...item,
        transactionType: item.transactionType ?? item.type ?? '',
        paymentMethod: item.paymentMethod ?? item.method ?? '',
      }));
      setLogs(timeline);

      // summary: 계약은 summary 필드, 렌탈은 rentalOrder에서 직접 계산
      if (data.summary) {
        setSummary(data.summary);
      } else if (data.rentalOrder) {
        setSummary({
          totalPaidAmount: data.rentalOrder.paidAmount ?? data.rentalOrder.totalAmount ?? 0,
          totalRefundedAmount: data.rentalOrder.refundedAmount ?? 0,
          currentBalance: (data.rentalOrder.paidAmount ?? data.rentalOrder.totalAmount ?? 0) - (data.rentalOrder.refundedAmount ?? 0),
        });
      } else {
        setSummary(null);
      }

      setContractId(data.contract?.id ?? null);
      // 렌탈: rentalOrder.orderId, 계약: null
      setRentalOrderId(data.rentalOrder?.orderId ?? null);
      setProductType(data.orderType ?? '');
    } catch (err) {
      console.error('결제 상세 로드 실패:', err);
      setError('결제 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [orderId, type]);

  const totalPaid = summary?.totalPaidAmount ?? logs
    .filter((l) => !isRefundEvent(l.transactionType))
    .reduce((sum, l) => sum + l.amount, 0);
  const totalRefunded = summary?.totalRefundedAmount ?? logs
    .filter((l) => isRefundEvent(l.transactionType))
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);
  const currentBalance = summary?.currentBalance ?? (totalPaid - totalRefunded);
  const contractPaidAmount = summary?.contractPaidAmount;
  const hostBurdenPaidAmount = summary?.hostBurdenPaidAmount;

  const isAdditional = isAdditionalRental(type, productType);

  // PARTIAL_ITEMS 아이템 목록 로드
  // - ADDITIONAL: getRentalOrderDetail로 활성 아이템 로드
  // - 계약/계약+렌탈: getRentalHistory로 INITIAL 활성 아이템 로드
  const loadItemEntries = async () => {
    try {
      setItemsLoading(true);
      if (isAdditional && rentalOrderId) {
        const detail = await rentalOrderService.getRentalOrderDetail(rentalOrderId);
        const activeItems: RentalItemEntry[] = detail.order.items
          .filter((item) => item.status === 'ACTIVE')
          .map((item) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
          }));
        setRentalItemEntries(activeItems);
      } else if (contractId) {
        const history = await rentalOrderService.getRentalHistory(contractId);
        const activeItems: RentalItemEntry[] = history.orders
          .filter((o) => o.orderType === 'INITIAL')
          .flatMap((o) =>
            o.items
              .filter((item) => item.status === 'ACTIVE')
              .map((item) => ({
                id: item.id,
                name: item.name,
                quantity: item.quantity,
                totalPrice: item.totalPrice,
              }))
          );
        setRentalItemEntries(activeItems);
      }
    } catch {
      setRentalItemEntries([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const openRefundModal = async () => {
    setRefundType('FULL');
    setRefundReason('');
    setContractItemAmounts({});
    setRentalItemAmounts({});
    setRentalItemEntries([]);
    setShowRefundModal(true);
    // PARTIAL_ITEMS 탭 진입 시 미리 로드하기 위해 바로 호출
    await loadItemEntries();
  };

  const getRefundValidationError = (): string | null => {
    if (!refundReason.trim()) return '환불 사유를 입력해주세요.';
    if (refundType === 'PARTIAL_ITEMS') {
      if (isAdditional) {
        if (!Object.values(rentalItemAmounts).some((v) => Number(v) > 0))
          return '환불할 아이템 금액을 1개 이상 입력해주세요.';
      } else {
        const hasContract = CONTRACT_ITEMS_LABELS.some(({ key }) => Number(contractItemAmounts[key] || 0) > 0);
        const hasRental = Object.values(rentalItemAmounts).some((v) => Number(v) > 0);
        if (!hasContract && !hasRental) return '환불할 항목 금액을 1개 이상 입력해주세요.';
      }
    }
    return null;
  };

  const handleRefund = async () => {
    const validationError = getRefundValidationError();
    if (validationError) return;
    try {
      setRefundLoading(true);

      if (isAdditional && rentalOrderId) {
        // ── ADDITIONAL 렌탈 주문 환불 ──
        const items: AdminRefundRentalItem[] = Object.entries(rentalItemAmounts)
          .filter(([, v]) => Number(v) > 0)
          .map(([itemId, v]) => ({ rentalOrderItemId: Number(itemId), refundAmount: Number(v) }));

        const result = await refundService.rentalRefund(rentalOrderId, {
          refundType,
          refundReason: refundReason.trim(),
          ...(refundType === 'PARTIAL_ITEMS' && { items }),
        });

        setShowRefundModal(false);
        let msg = `렌탈 환불 처리 완료\n\n환불 금액: ${formatCurrency(result.refundAmount)}`;
        if (result.cancelledItems && result.cancelledItems.length > 0) {
          const lines = result.cancelledItems.map((i) => `  ${i.name}: ${formatCurrency(i.refundAmount)}`);
          msg += `\n\n[취소된 아이템]\n${lines.join('\n')}`;
        }
        alert(msg);
      } else if (contractId) {
        // ── 계약 결제 환불 (INITIAL 렌탈 포함) ──
        const items: AdminRefundItems = {};
        if (refundType === 'PARTIAL_ITEMS') {
          CONTRACT_ITEMS_LABELS.forEach(({ key }) => {
            const val = Number(contractItemAmounts[key] || 0);
            if (val > 0) items[key] = val;
          });
          const rentalArr: AdminRefundRentalItem[] = Object.entries(rentalItemAmounts)
            .filter(([, v]) => Number(v) > 0)
            .map(([itemId, v]) => ({ rentalOrderItemId: Number(itemId), refundAmount: Number(v) }));
          if (rentalArr.length > 0) items.rentalItems = rentalArr;
        }

        const result = await refundService.adminRefund(contractId, {
          refundType,
          refundReason: refundReason.trim(),
          ...(refundType === 'PARTIAL_ITEMS' && { items }),
        });

        setShowRefundModal(false);
        let msg = `환불 처리 완료\n\n총 환불 금액: ${formatCurrency(result.totalRefundAmount)}`;
        if (result.contractItems) {
          const lines = CONTRACT_ITEMS_LABELS
            .filter(({ key }) => (result.contractItems as any)[key] > 0)
            .map(({ key, label }) => `  ${label}: ${formatCurrency((result.contractItems as any)[key])}`);
          if (lines.length > 0) msg += `\n\n[계약 항목]\n${lines.join('\n')}`;
        }
        if (result.cancelledRentalItems && result.cancelledRentalItems.length > 0) {
          const lines = result.cancelledRentalItems.map((i) => `  ${i.name}: ${formatCurrency(i.refundAmount)}`);
          msg += `\n\n[렌탈 아이템]\n${lines.join('\n')}`;
        }
        if (result.warning) msg += `\n\n⚠️ ${result.warning}`;
        alert(msg);
      }

      loadDetail();
    } catch (err: any) {
      const status = err?.status || err?.response?.status;
      if (status === 502) {
        alert('PG 결제 취소 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요. (DB는 원복됨)');
      } else {
        alert(err?.message || '환불 처리 실패');
      }
    } finally {
      setRefundLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={() => navigate(from === 'orders' ? '/payments?tab=orders' : '/payments')}>목록으로</Button>
      </div>
    );
  }

  const canRefund = currentBalance > 0 && (isAdditional ? !!rentalOrderId : !!contractId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate(from === 'orders' ? '/payments?tab=orders' : '/payments')}>
            ← 목록
          </Button>
          <h1 className="text-2xl font-bold">결제 상세</h1>
          <span className="font-mono text-gray-500">{orderId}</span>
          {type && (
            <Badge variant="info">{type === 'contract' ? '계약' : '렌탈'}</Badge>
          )}
          {isAdditional && <Badge variant="warning">ADDITIONAL 렌탈</Badge>}
        </div>
        {canRefund && (
          <Button variant="primary" onClick={openRefundModal}>
            환불 처리
          </Button>
        )}
      </div>

      {/* 결제 요약 */}
      <Card>
        <div className={`grid gap-6 p-4 bg-gray-50 rounded-lg ${contractPaidAmount != null ? 'grid-cols-5' : 'grid-cols-3'}`}>
          {contractPaidAmount != null && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">계약 결제금액</p>
              <p className="text-xl font-bold">{formatCurrency(contractPaidAmount)}</p>
            </div>
          )}
          {hostBurdenPaidAmount != null && hostBurdenPaidAmount > 0 && (
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-1">호스트 부담금</p>
              <p className="text-xl font-bold text-orange-600">{formatCurrency(hostBurdenPaidAmount)}</p>
            </div>
          )}
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">총 결제금액</p>
            <p className="text-xl font-bold">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">총 환불금액</p>
            <p className={`text-xl font-bold ${totalRefunded > 0 ? 'text-red-600' : ''}`}>
              {totalRefunded > 0 ? `-${formatCurrency(totalRefunded)}` : '₩0'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">현재 잔액</p>
            <p className={`text-xl font-bold ${currentBalance < 0 ? 'text-red-600' : 'text-primary-600'}`}>
              {formatCurrency(currentBalance)}
            </p>
          </div>
        </div>
      </Card>

      {/* 결제/취소 타임라인 */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">결제/취소 내역</h2>
        {logs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">해당 주문의 결제/취소 내역이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {logs.map((log, idx) => {
              const refund = isRefundEvent(log.transactionType);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${refund ? 'border-red-200 bg-red-50/50' : 'border-green-200 bg-green-50/50'}`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-sm font-medium ${refund ? 'text-red-600' : 'text-green-700'}`}>
                      {formatDateTime(log.occurredAt)}
                    </span>
                    <span className="text-gray-300">|</span>
                    {getTransactionTypeBadge(log.transactionType)}
                    <span className="text-gray-300">|</span>
                    <span className={`font-bold ${refund ? 'text-red-600' : ''}`}>
                      {refund ? '' : '+'}{formatCurrency(log.amount)}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-600">
                    <span>상품: {log.productType}</span>
                    <span>결제수단: {log.paymentMethod}</span>
                    {log.userName && <span>이용자: {log.userName}</span>}
                    {log.roomName && <span>방: {log.roomName}</span>}
                    {log.actor && <span>처리주체: {log.actor}</span>}
                    {log.rentalOrderId && <span>렌탈주문: {log.rentalOrderId}</span>}
                    {log.paymentKey && (
                      <span className="font-mono text-xs text-gray-400">PG: {log.paymentKey}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ── 환불 처리 모달 ── */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-1">
              {isAdditional ? 'ADDITIONAL 렌탈 환불 처리' : '환불 처리'}
            </h3>
            <p className="text-xs text-gray-500 mb-4">
              현재 잔액: <span className="font-semibold text-primary-600">{formatCurrency(currentBalance)}</span>
              {isAdditional
                ? ' — rental_payments 결제건 환불 (계약 상태 변경 없음)'
                : ' — 계약 결제 및 INITIAL 렌탈 주문에 대해 환불을 처리합니다.'}
            </p>

            <div className="space-y-5">
              {/* 환불 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">환불 유형 *</label>
                <div className="space-y-2">
                  {(Object.keys(REFUND_TYPE_LABELS) as AdminRefundType[]).map((t) => (
                    <label key={t} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="refundType"
                        value={t}
                        checked={refundType === t}
                        onChange={() => {
                          setRefundType(t);
                          setContractItemAmounts({});
                          setRentalItemAmounts({});
                        }}
                        className="mt-0.5"
                      />
                      <div>
                        <span className="text-sm font-medium">{REFUND_TYPE_LABELS[t]}</span>
                        {t === 'FULL' && (
                          <p className="text-xs text-gray-400">
                            {isAdditional
                              ? 'rental_payments 잔액 전체 + 활성 아이템 전체 취소'
                              : '계약 결제 잔액 전체 + INITIAL 렌탈 활성 아이템 전체 환불'}
                          </p>
                        )}
                        {t === 'PARTIAL_ITEMS' && (
                          <p className="text-xs text-gray-400">
                            {isAdditional
                              ? '아이템별 환불 금액 지정'
                              : '계약 항목별 금액 지정 + INITIAL 렌탈 아이템 개별 지정'}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* PARTIAL_ITEMS */}
              {refundType === 'PARTIAL_ITEMS' && (
                <div className="space-y-4">
                  {/* 계약 항목 — ADDITIONAL이 아닐 때만 표시 */}
                  {!isAdditional && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">계약 항목별 환불 금액</p>
                      <div className="space-y-2">
                        {CONTRACT_ITEMS_LABELS.map(({ key, label }) => (
                          <div key={key} className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 w-28 shrink-0">{label}</span>
                            <input
                              type="number"
                              min={0}
                              className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                              value={contractItemAmounts[key] ?? ''}
                              onChange={(e) =>
                                setContractItemAmounts((prev) => ({ ...prev, [key]: e.target.value }))
                              }
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-400">원</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 렌탈 아이템 목록 */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      {isAdditional ? '렌탈 아이템 환불' : 'INITIAL 렌탈 아이템 환불'}
                      {itemsLoading && (
                        <span className="ml-2 text-xs text-gray-400">불러오는 중...</span>
                      )}
                    </p>
                    {!itemsLoading && rentalItemEntries.length === 0 && (
                      <p className="text-xs text-gray-400 py-2">환불 가능한 아이템이 없습니다.</p>
                    )}
                    {!itemsLoading && rentalItemEntries.length > 0 && (
                      <div className="space-y-2">
                        {rentalItemEntries.map((item) => (
                          <div key={item.id} className="flex items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-gray-600 truncate block">
                                {item.name} × {item.quantity}
                              </span>
                              <span className="text-xs text-gray-400">
                                최대 {formatCurrency(item.totalPrice)}
                              </span>
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={item.totalPrice}
                              className="w-28 border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
                              value={rentalItemAmounts[item.id] ?? ''}
                              onChange={(e) =>
                                setRentalItemAmounts((prev) => ({ ...prev, [item.id]: e.target.value }))
                              }
                              placeholder="0"
                            />
                            <span className="text-sm text-gray-400">원</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">* 입력하지 않은 항목은 환불되지 않습니다.</p>
                </div>
              )}

              {/* 환불 사유 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">환불 사유 *</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="환불 사유를 입력해주세요"
                />
              </div>
            </div>

            {getRefundValidationError() && (
              <p className="mt-4 text-sm text-red-500">{getRefundValidationError()}</p>
            )}
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="secondary" onClick={() => setShowRefundModal(false)} disabled={refundLoading}>
                닫기
              </Button>
              <Button
                variant="primary"
                onClick={handleRefund}
                disabled={refundLoading}
              >
                {refundLoading ? '처리중...' : '환불 실행'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
