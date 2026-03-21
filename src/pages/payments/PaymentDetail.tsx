import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { PaymentLog } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { paymentService } from '../../services/paymentService';

const getTransactionTypeBadge = (type: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    '결제완료': 'success',
    '부분취소': 'warning',
    '전체취소': 'danger',
  };
  return <Badge variant={map[type] || 'default'}>{type}</Badge>;
};

const isRefundEvent = (type: string) =>
  ['부분취소', '전체취소'].includes(type);

export default function PaymentDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const [searchParams] = useSearchParams();
  const type = searchParams.get('type') || undefined;
  const navigate = useNavigate();

  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [summary, setSummary] = useState<{
    contractPaidAmount?: number;
    hostBurdenPaidAmount?: number;
    totalPaidAmount?: number;
    totalRefundedAmount?: number;
    currentBalance?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDetail = async () => {
    if (!orderId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getPaymentDetail(orderId, type);
      const data = response as any;
      const timeline = data.logs || data.timeline || [];
      setLogs(timeline);
      setSummary(data.summary || null);
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

  // API summary 우선, 없으면 로컬 계산
  const totalPaid = summary?.totalPaidAmount ?? logs
    .filter((l) => !isRefundEvent(l.transactionType))
    .reduce((sum, l) => sum + l.amount, 0);
  const totalRefunded = summary?.totalRefundedAmount ?? logs
    .filter((l) => isRefundEvent(l.transactionType))
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);
  const currentBalance = summary?.currentBalance ?? (totalPaid - totalRefunded);
  const contractPaidAmount = summary?.contractPaidAmount;
  const hostBurdenPaidAmount = summary?.hostBurdenPaidAmount;

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
        <Button onClick={() => navigate('/payments')}>목록으로</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/payments')}>
          ← 목록
        </Button>
        <h1 className="text-2xl font-bold">결제 상세</h1>
        <span className="font-mono text-gray-500">{orderId}</span>
        {type && (
          <Badge variant="info">{type === 'contract' ? '계약' : '렌탈'}</Badge>
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
                  className={`p-4 rounded-lg border ${
                    refund
                      ? 'border-red-200 bg-red-50/50'
                      : 'border-green-200 bg-green-50/50'
                  }`}
                >
                  {/* 첫 줄: 일시 | 거래유형 | 금액 */}
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

                  {/* 상세 정보 */}
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
    </div>
  );
}
