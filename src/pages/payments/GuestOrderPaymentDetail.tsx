import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { moveInCaseService } from '../../services/moveInCaseService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import type {
  MoveInGuestOrderDeliveryStatus,
  MoveInGuestOrderDetail,
  MoveInGuestOrderStatus,
} from '../../types';

const ORDER_STATUS_BADGE: Record<
  MoveInGuestOrderStatus,
  { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }
> = {
  PENDING:        { variant: 'warning', label: '결제 대기' },
  PAID:           { variant: 'success', label: '결제 완료' },
  PARTIAL_REFUND: { variant: 'info',    label: '부분 환불' },
  FULLY_REFUNDED: { variant: 'danger',  label: '전액 환불' },
  CANCELLED:     { variant: 'default', label: '취소' },
};

const DELIVERY_BADGE: Record<
  MoveInGuestOrderDeliveryStatus,
  { variant: 'default' | 'info' | 'success'; label: string }
> = {
  PENDING:    { variant: 'default', label: '배송 전' },
  IN_TRANSIT: { variant: 'info',    label: '배송 중' },
  DELIVERED:  { variant: 'success', label: '배송 완료' },
};

const PAYMENT_STATUS_BADGE: Record<
  string,
  { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }
> = {
  PAID:      { variant: 'success', label: '결제 완료' },
  REFUNDED:  { variant: 'danger',  label: '환불 완료' },
  FAILED:    { variant: 'danger',  label: '결제 실패' },
  CANCELLED: { variant: 'default', label: '결제 전 취소' },
  PENDING:   { variant: 'warning', label: '결제 대기' },
};

function formatPaymentMethod(method: string | null, easyPayProvider?: string | null) {
  if (!method) return '-';
  if (method === 'EASY_PAY' && easyPayProvider) {
    const labels: Record<string, string> = {
      KAKAOPAY: '카카오페이',
      KAKAO: '카카오페이',
      NAVER: '네이버페이',
      PAYCO: '페이코',
    };
    return labels[easyPayProvider] ?? '간편결제';
  }
  const labels: Record<string, string> = {
    CARD: '신용카드',
    CREDIT_CARD: '신용카드',
    VIRTUAL_ACCOUNT: '가상계좌',
    TRANSFER: '계좌이체',
    MOBILE: '휴대폰',
    EASY_PAY: '간편결제',
  };
  return labels[method] ?? method;
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-1.5">
      <div className="w-32 shrink-0 text-sm text-gray-500">{label}</div>
      <div className="flex-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

export default function GuestOrderPaymentDetail() {
  const { orderDbId } = useParams<{ orderDbId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || undefined;
  const navigate = useNavigate();

  const [detail, setDetail] = useState<MoveInGuestOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!orderDbId) return;
      const idNum = Number(orderDbId);
      if (!Number.isFinite(idNum)) {
        setError('잘못된 주문 ID입니다.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await moveInCaseService.getGuestOrderDetail(idNum);
        if (!cancelled) setDetail(res);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || '게스트 주문 결제 상세를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [orderDbId]);

  const handleBack = () => {
    if (from === 'orders') {
      navigate('/payments?tab=orders');
    } else if (from === 'logs') {
      navigate('/payments');
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="p-6 space-y-4">
        <Button variant="secondary" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-1 inline-block" />
          목록으로
        </Button>
        <Card className="p-6 text-center">
          <p className="text-red-500">{error || '데이터가 없습니다.'}</p>
        </Card>
      </div>
    );
  }

  const items = detail.items ?? [];
  const payments = detail.payments ?? [];

  const totalPaid = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + (p.amount ?? 0), 0);
  const totalRefunded = detail.refundedAmount ?? 0;
  const currentBalance = (detail.paidAmount ?? totalPaid) - totalRefunded;

  const statusCfg = ORDER_STATUS_BADGE[detail.status];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="secondary" onClick={handleBack}>
          ← 목록
        </Button>
        <h1 className="text-2xl font-bold">게스트 옵션 결제 상세</h1>
        <Badge variant="info">입주 준비 · 옵션</Badge>
        <span className="font-mono text-sm text-gray-500">{detail.orderId}</span>
        {detail.case && (
          <button
            type="button"
            onClick={() => navigate(`/move-in-cases/${detail.case.caseId}`)}
            className="ml-auto text-sm text-primary-600 hover:underline"
          >
            케이스 #{detail.case.caseId} 상세 →
          </button>
        )}
      </div>

      {/* 요약 */}
      <Card>
        <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">총 결제금액</p>
            <p className="text-xl font-bold">{formatCurrency(detail.paidAmount ?? totalPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">총 환불금액</p>
            <p className={`text-xl font-bold ${totalRefunded > 0 ? 'text-red-600' : ''}`}>
              {totalRefunded > 0 ? `-${formatCurrency(totalRefunded)}` : '₩0'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">현재 잔액</p>
            <p
              className={`text-xl font-bold ${
                currentBalance < 0 ? 'text-red-600' : 'text-primary-600'
              }`}
            >
              {formatCurrency(currentBalance)}
            </p>
          </div>
        </div>
      </Card>

      {/* 주문 정보 */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">주문 정보</h2>
        <InfoRow
          label="주문 상태"
          value={
            <Badge variant={statusCfg?.variant ?? 'default'}>
              {statusCfg?.label ?? detail.statusLabel ?? detail.status}
            </Badge>
          }
        />
        <InfoRow label="주문 유형" value={detail.orderType === 'INITIAL' ? '최초 주문' : '추가 주문'} />
        {detail.deliveryStatus && (
          <InfoRow
            label="배송 상태"
            value={
              <Badge variant={DELIVERY_BADGE[detail.deliveryStatus].variant}>
                {DELIVERY_BADGE[detail.deliveryStatus].label}
              </Badge>
            }
          />
        )}
        <InfoRow
          label="결제일"
          value={detail.paidAt ? formatDateTime(detail.paidAt) : '-'}
        />
        <InfoRow
          label="수정 가능 기한"
          value={detail.modifiableUntil ? formatDateTime(detail.modifiableUntil) : '-'}
        />
        {detail.case && (
          <>
            <InfoRow
              label="입주/퇴실"
              value={`${formatDate(detail.case.checkInDate)} ~ ${formatDate(detail.case.checkOutDate)}`}
            />
            <InfoRow
              label="임차인"
              value={`${detail.case.guestName} · ${detail.case.guestPhone}`}
            />
          </>
        )}
      </Card>

      {/* 주문 항목 */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">주문 항목 ({items.length}건)</h2>
        {items.length === 0 ? (
          <p className="text-gray-400 text-center py-8">주문 항목이 없습니다.</p>
        ) : (
          <div className="space-y-1">
            {items.map((it) => (
              <div
                key={it.id}
                className="flex items-center justify-between text-sm py-2 border-b last:border-b-0"
              >
                <span className="text-gray-900">
                  {it.optionName} × {it.quantity}
                  {it.status !== 'ACTIVE' && (
                    <span className="ml-2 text-xs text-red-600">({it.status})</span>
                  )}
                </span>
                <span className="text-gray-700">{formatCurrency(it.totalPrice)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 결제 시도 이력 */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">
          결제 시도 이력 ({payments.length}건)
        </h2>
        {payments.length === 0 ? (
          <p className="text-gray-400 text-center py-8">결제 시도가 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {payments.map((p) => {
              const cfg = PAYMENT_STATUS_BADGE[p.status];
              const isRefund = p.status === 'REFUNDED';
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-lg border ${
                    isRefund ? 'border-red-200 bg-red-50/50' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={cfg?.variant ?? 'default'}>
                        {cfg?.label ?? p.status}
                      </Badge>
                      <span className="font-mono text-xs text-gray-700">{p.orderId}</span>
                    </div>
                    <span className={`font-bold ${isRefund ? 'text-red-600' : 'text-gray-900'}`}>
                      {isRefund ? '-' : ''}
                      {formatCurrency(p.amount)}
                    </span>
                  </div>
                  <InfoRow
                    label="결제수단"
                    value={formatPaymentMethod(p.pgMethod, (p as any).easyPayProvider)}
                  />
                  {p.pgTid && (
                    <InfoRow
                      label="PG TID"
                      value={<span className="font-mono text-xs">{p.pgTid}</span>}
                    />
                  )}
                  {p.paidAt && <InfoRow label="결제일시" value={formatDateTime(p.paidAt)} />}
                  {p.failedAt && (
                    <InfoRow
                      label="실패일시"
                      value={
                        <div className="space-y-0.5">
                          <div>{formatDateTime(p.failedAt)}</div>
                          {p.failureReason && (
                            <div className="text-xs text-red-600">사유: {p.failureReason}</div>
                          )}
                        </div>
                      }
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
