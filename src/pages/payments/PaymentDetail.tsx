import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { PaymentOrderDetail, PaymentTimelineEvent } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { paymentService } from '../../services/paymentService';

const getContractStatusBadge = (status: string) => {
  const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }> = {
    PENDING_APPROVAL: { variant: 'warning', label: '계약 요청' },
    APPROVED: { variant: 'info', label: '계약 승인(결제 대기)' },
    REJECTED: { variant: 'danger', label: '계약 거절' },
    PAYMENT_COMPLETED: { variant: 'success', label: '결제 완료' },
    IN_PROGRESS: { variant: 'success', label: '임대 중' },
    COMPLETED: { variant: 'default', label: '계약 종료' },
    CANCELLED_BY_GUEST: { variant: 'danger', label: '게스트 취소' },
    CANCELLED_BY_HOST: { variant: 'danger', label: '호스트 취소' },
    CANCELLED_BY_ADMIN_WITH_REFUND: { variant: 'danger', label: '관리자 취소(환불)' },
    CANCELLED_BY_ADMIN_NO_REFUND: { variant: 'danger', label: '관리자 취소(미환불)' },
    REFUNDED: { variant: 'info', label: '환불' },
    APPROVAL_EXPIRED: { variant: 'default', label: '승인 만료' },
    PAYMENT_EXPIRED: { variant: 'default', label: '결제 만료' },
    CANCEL_REQUESTED: { variant: 'warning', label: '요청 취소' },
  };
  const config = map[status] || { variant: 'default' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getTimelineTypeBadge = (type: string) => {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
    '결제완료': { variant: 'success', label: '결제 완료' },
    'PAYMENT_COMPLETED': { variant: 'success', label: '결제 완료' },
    '부분취소': { variant: 'warning', label: '부분취소' },
    'PARTIAL_CANCEL': { variant: 'warning', label: '부분취소' },
    '전체취소': { variant: 'danger', label: '전체취소' },
    'FULL_CANCEL': { variant: 'danger', label: '전체취소' },
  };
  const config = map[type] || { variant: 'default' as const, label: type };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const isRefundEvent = (type: string) =>
  ['부분취소', 'PARTIAL_CANCEL', '전체취소', 'FULL_CANCEL'].includes(type);

export default function PaymentDetail() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<PaymentOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getPaymentDetail(contractId);
      setDetail(response);
    } catch (err) {
      console.error('결제 상세 로드 실패:', err);
      setError('결제 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetail();
  }, [contractId]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || '데이터를 찾을 수 없습니다.'}</p>
        <Button onClick={() => navigate('/payments')}>목록으로</Button>
      </div>
    );
  }

  const { contract, guest, host, room, summary, timeline = [] } = detail;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/payments')}>
          ← 목록
        </Button>
        <h1 className="text-2xl font-bold">결제 상세</h1>
      </div>

      {/* 주문번호 + 계약상태 */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">주문번호</p>
            <p className="text-xl font-bold font-mono">{contract.orderId}</p>
          </div>
          {getContractStatusBadge(contract.status)}
        </div>
      </Card>

      {/* 결제 요약 (계약+렌탈 합산) */}
      <Card>
        <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">총 결제금액</p>
            <p className="text-xl font-bold">{formatCurrency(summary.totalPaidAmount)}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">총 환불금액</p>
            <p className={`text-xl font-bold ${summary.totalRefundedAmount > 0 ? 'text-red-600' : ''}`}>
              {summary.totalRefundedAmount > 0 ? `-${formatCurrency(summary.totalRefundedAmount)}` : '₩0'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-500 mb-1">현재 유지금액</p>
            <p className={`text-xl font-bold ${summary.currentBalance < 0 ? 'text-red-600' : 'text-primary-600'}`}>
              {formatCurrency(summary.currentBalance)}
            </p>
          </div>
        </div>
      </Card>

      {/* 계약 정보 + 게스트/호스트/방 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">계약 정보</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">계약 상태</dt>
              <dd>{getContractStatusBadge(contract.status)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">결제수단</dt>
              <dd className="font-medium">{contract.paymentMethod}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">결제일시</dt>
              <dd>{contract.paidAt ? formatDateTime(contract.paidAt) : '-'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">입실</dt>
              <dd>{formatDate(contract.checkInDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">퇴실</dt>
              <dd>{formatDate(contract.checkOutDate)}</dd>
            </div>
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">임대료</dt>
                <dd>{formatCurrency(contract.rentalFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">관리비</dt>
                <dd>{formatCurrency(contract.maintenanceFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">청소비</dt>
                <dd>{formatCurrency(contract.cleaningFee)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">보증금</dt>
                <dd>{formatCurrency(contract.deposit)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">플랫폼 수수료</dt>
                <dd>{formatCurrency(contract.platformFee)}</dd>
              </div>
              <div className="flex justify-between border-t pt-2">
                <dt className="text-gray-900 font-semibold">최종 결제금액</dt>
                <dd className="font-bold text-primary-600">{formatCurrency(contract.finalTotalAmount)}</dd>
              </div>
            </div>
            <div className="pt-2">
              <Link
                to={`/contracts/${contract.id}`}
                className="text-primary-600 hover:underline text-sm"
              >
                계약 상세 보기 →
              </Link>
            </div>
          </dl>
        </Card>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-semibold mb-4">게스트</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">이름</dt>
                <dd>{guest.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">이메일</dt>
                <dd className="text-sm">{guest.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">전화번호</dt>
                <dd>{guest.phoneNumber}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">호스트</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">이름</dt>
                <dd>{host.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">이메일</dt>
                <dd className="text-sm">{host.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">전화번호</dt>
                <dd>{host.phoneNumber}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold mb-4">방</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">방 이름</dt>
                <dd>
                  <Link to={`/rooms/${room.id}`} className="text-primary-600 hover:underline">
                    {room.roomName}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">주소</dt>
                <dd className="text-sm text-right">{room.address}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      {/* 상세 내역 (타임라인) */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">[상세 내역]</h2>
        {timeline.length === 0 ? (
          <p className="text-gray-400 text-center py-8">결제/환불 내역이 없습니다.</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((event: PaymentTimelineEvent, idx: number) => {
              const refund = isRefundEvent(event.type);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    refund
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-green-200 bg-green-50/50'
                  }`}
                >
                  {/* 첫 줄: 일시 | 타입 | 금액 */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-sm font-medium ${refund ? 'text-red-600' : 'text-green-700'}`}>
                      {formatDateTime(event.occurredAt)}
                    </span>
                    <span className="text-gray-300">|</span>
                    {getTimelineTypeBadge(event.type)}
                    <span className="text-gray-300">|</span>
                    <span className={`font-bold ${refund ? 'text-red-600' : ''}`}>
                      {refund ? '-' : '+'}{formatCurrency(Math.abs(event.amount))}원
                    </span>
                  </div>

                  {/* 상세 내용 */}
                  {event.description && (
                    <p className="text-sm text-gray-700">
                      상세 내용: {event.description}
                    </p>
                  )}
                  {event.actor && (
                    <p className="text-sm text-gray-500">
                      처리주체: {event.actor}
                    </p>
                  )}
                  {event.pgStatus && (
                    <p className="text-sm text-gray-400">
                      PG 처리방식: {event.pgStatus}
                    </p>
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
