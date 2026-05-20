import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { moveInCaseService } from '../../services/moveInCaseService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import type {
  CleaningPaymentAttempt,
  CleaningPaymentDetail as CleaningPaymentDetailType,
} from '../../types';

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

function statusBadge(status: string, statusLabel: string) {
  const cfg = PAYMENT_STATUS_BADGE[status];
  return (
    <Badge variant={cfg?.variant ?? 'default'}>
      {cfg?.label ?? statusLabel ?? status}
    </Badge>
  );
}

function formatPaymentMethod(method: string | null, easyPayProvider: string | null) {
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

function PaymentAttemptCard({ p }: { p: CleaningPaymentAttempt }) {
  const isRefund = p.status === 'REFUNDED';
  const isFailed = p.status === 'FAILED';
  return (
    <div
      className={`p-4 rounded-lg border ${
        isRefund
          ? 'border-red-200 bg-red-50/50'
          : isFailed
          ? 'border-red-200 bg-red-50/30'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <div className="flex items-center gap-2">
          {statusBadge(p.status, p.statusLabel)}
          <span className="font-mono text-xs text-gray-700">{p.orderId}</span>
        </div>
        <span className={`font-bold ${isRefund ? 'text-red-600' : 'text-gray-900'}`}>
          {isRefund ? '-' : ''}
          {formatCurrency(p.amount)}
        </span>
      </div>
      <InfoRow label="결제수단" value={formatPaymentMethod(p.pgMethod, p.easyPayProvider)} />
      {p.pgTid && <InfoRow label="PG TID" value={<span className="font-mono text-xs">{p.pgTid}</span>} />}
      {p.paidAt && <InfoRow label="결제일시" value={formatDateTime(p.paidAt)} />}
      {p.refundedAt && (
        <InfoRow
          label="환불일시"
          value={
            <div className="space-y-0.5">
              <div>{formatDateTime(p.refundedAt)}</div>
              {p.refundReason && (
                <div className="text-xs text-gray-500">사유: {p.refundReason}</div>
              )}
            </div>
          }
        />
      )}
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
}

export default function CleaningPaymentDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const [searchParams] = useSearchParams();
  const from = searchParams.get('from') || undefined;
  const navigate = useNavigate();

  const [detail, setDetail] = useState<CleaningPaymentDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!caseId) return;
      const idNum = Number(caseId);
      if (!Number.isFinite(idNum)) {
        setError('잘못된 케이스 ID입니다.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const res = await moveInCaseService.getCleaningPaymentDetail(idNum);
        if (!cancelled) setDetail(res);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || '청소 결제 상세를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [caseId]);

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

  const { case: caseInfo, payments, cleaningRefund, serviceTasks } = detail;
  const totalPaid = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalRefunded = payments
    .filter((p) => p.status === 'REFUNDED')
    .reduce((sum, p) => sum + p.amount, 0);
  const currentBalance = totalPaid - totalRefunded;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="secondary" onClick={handleBack}>
          ← 목록
        </Button>
        <h1 className="text-2xl font-bold">청소 결제 상세</h1>
        <Badge variant="info">입주 준비 · 청소</Badge>
        <span className="text-sm text-gray-500">케이스 #{caseInfo.id}</span>
        <button
          type="button"
          onClick={() => navigate(`/move-in-cases/${caseInfo.id}`)}
          className="ml-auto text-sm text-primary-600 hover:underline"
        >
          케이스 상세 보기 →
        </button>
      </div>

      {/* 요약 */}
      <Card>
        <div className="grid grid-cols-3 gap-6 p-4 bg-gray-50 rounded-lg">
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

      {/* 케이스 정보 */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">케이스 정보</h2>
        <InfoRow
          label="청소 상태"
          value={
            <Badge
              variant={caseInfo.cleaningStatus === 'PAID' ? 'success' : 'default'}
            >
              {caseInfo.cleaningStatus}
            </Badge>
          }
        />
        <InfoRow label="청소비" value={formatCurrency(caseInfo.cleaningFee)} />
        <InfoRow
          label="청소 결제일"
          value={
            caseInfo.cleaningPaidAt ? formatDateTime(caseInfo.cleaningPaidAt) : '-'
          }
        />
        <InfoRow
          label="청소 희망 일시"
          value={
            caseInfo.cleaningDate
              ? `${formatDate(caseInfo.cleaningDate)}${
                  caseInfo.cleaningTime ? ` ${caseInfo.cleaningTime}` : ''
                }`
              : '-'
          }
        />
        <InfoRow
          label="입주/퇴실"
          value={`${formatDate(caseInfo.checkInDate)} ~ ${formatDate(
            caseInfo.checkOutDate
          )}`}
        />
        <InfoRow
          label="호스트"
          value={`${caseInfo.host?.name ?? '-'} · ${caseInfo.host?.phone ?? '-'}`}
        />
        <InfoRow
          label="임차인"
          value={`${caseInfo.guest?.name ?? '-'} · ${caseInfo.guest?.phone ?? '-'}`}
        />
        <InfoRow
          label="방 주소"
          value={
            <div className="space-y-0.5">
              <div>{caseInfo.room?.address ?? '-'}</div>
              {caseInfo.room?.detailAddress && (
                <div className="text-xs text-gray-500">
                  {caseInfo.room.detailAddress}
                </div>
              )}
            </div>
          }
        />
        {caseInfo.adminMemo && (
          <InfoRow label="관리자 메모" value={caseInfo.adminMemo} />
        )}
      </Card>

      {/* 환불 정책 */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">환불 정책</h2>
        <InfoRow
          label="환불 가능"
          value={
            <Badge variant={cleaningRefund.canRefund ? 'success' : 'default'}>
              {cleaningRefund.canRefund ? '가능' : '불가'}
            </Badge>
          }
        />
        <InfoRow
          label="환불 금액"
          value={formatCurrency(cleaningRefund.refundAmount)}
        />
        <InfoRow
          label="공제 금액"
          value={
            cleaningRefund.deduction > 0
              ? `-${formatCurrency(cleaningRefund.deduction)}`
              : '₩0'
          }
        />
        {cleaningRefund.reason && (
          <InfoRow label="사유" value={cleaningRefund.reason} />
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
            {payments.map((p) => (
              <PaymentAttemptCard key={p.paymentId} p={p} />
            ))}
          </div>
        )}
      </Card>

      {/* 관련 청소 작업 */}
      <Card>
        <h2 className="text-lg font-semibold mb-3">
          청소 작업 ({serviceTasks.length}건)
        </h2>
        {serviceTasks.length === 0 ? (
          <p className="text-gray-400 text-center py-8">자동 생성된 청소 작업이 없습니다.</p>
        ) : (
          <div className="space-y-2">
            {serviceTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded border border-gray-200 flex items-center gap-3"
              >
                <Badge variant="info">{task.taskType}</Badge>
                <Badge variant="default">{task.status}</Badge>
                <span className="text-sm text-gray-700">
                  {formatDate(task.referenceDate)} · 수량 {task.quantity}
                </span>
                {task.issueNote && (
                  <span className="text-xs text-red-600 ml-2">{task.issueNote}</span>
                )}
                <span className="ml-auto text-xs text-gray-400">
                  {formatDateTime(task.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
