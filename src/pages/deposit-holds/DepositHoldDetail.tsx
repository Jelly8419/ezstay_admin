import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { DepositHoldDetail, DepositHoldStatus, DepositAgreement, DepositAgreementStatus } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { depositHoldService } from '../../services/depositHoldService';

const STATUS_MAP: Record<DepositHoldStatus, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }> = {
  REQUESTED:      { variant: 'warning', label: '보류 신청' },
  APPROVED:       { variant: 'info',    label: '승인 완료' },
  REJECTED:       { variant: 'danger',  label: '보류 반려' },
  HOST_SUBMITTED: { variant: 'warning', label: '차감 내용 제출' },
  AGREED:         { variant: 'success', label: '게스트 동의' },
  AUTO_REFUNDED:  { variant: 'default', label: '자동 전액 반환' },
  REFUND_FAILED:  { variant: 'danger',  label: '환불 실패' },
};

const AGREEMENT_STATUS_MAP: Record<DepositAgreementStatus, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }> = {
  REQUESTED:     { variant: 'warning', label: '관리자 검토 대기' },
  APPROVED:      { variant: 'info',    label: '관리자 승인' },
  REJECTED:      { variant: 'danger',  label: '관리자 반려' },
  SUBMITTED:     { variant: 'warning', label: '제출됨 (게스트 동의 대기)' },
  ACCEPTED:      { variant: 'success', label: '게스트 동의 완료' },
  AUTO_RETURNED: { variant: 'default', label: '자동 전액 반환' },
};

const LOG_ACTOR_LABEL: Record<string, string> = {
  HOST: '호스트',
  GUEST: '게스트',
  ADMIN: '관리자',
  SYSTEM: '시스템',
};

type ModalType = 'approve' | 'reject' | 'retry' | null;

export default function DepositHoldDetailPage() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<DepositHoldDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadDetail = async () => {
    if (!contractId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await depositHoldService.getDepositHoldDetail(Number(contractId));
      setDetail(data);
    } catch {
      setError('보증금 보류 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDetail(); }, [contractId]);

  const handleApprove = async () => {
    if (!detail) return;
    try {
      setActionLoading(true);
      await depositHoldService.approveHold(detail.contractId);
      setModalType(null);
      loadDetail();
    } catch {
      alert('승인 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!detail) return;
    if (!rejectReason.trim()) { alert('반려 사유를 입력해주세요.'); return; }
    try {
      setActionLoading(true);
      await depositHoldService.rejectHold(detail.contractId, rejectReason);
      setModalType(null);
      setRejectReason('');
      loadDetail();
    } catch {
      alert('반려 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetryRefund = async () => {
    if (!detail) return;
    try {
      setActionLoading(true);
      await depositHoldService.retryRefund(detail.contractId);
      setModalType(null);
      loadDetail();
    } catch {
      alert('환불 재시도에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setActionLoading(false);
    }
  };

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
        <Button onClick={() => navigate('/deposit-holds')}>목록으로</Button>
      </div>
    );
  }

  const statusCfg = STATUS_MAP[detail.holdStatus];

  // 합의 이력에서 차감 정보가 있는 최신 항목
  const latestAgreementWithAmount = detail.depositAgreements.find(
    (a) => a.deductAmount != null
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/deposit-holds')}>← 목록</Button>
        <h1 className="text-2xl font-bold">보증금 보류 상세</h1>
        <span className="text-gray-400 font-mono">계약 #{detail.contractId}</span>
        <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
      </div>

      {/* 계약 정보 */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">계약 정보</h2>
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
          <div><span className="text-gray-500">체크인:</span> <span className="ml-2">{formatDate(detail.checkInDate)}</span></div>
          <div><span className="text-gray-500">체크아웃:</span> <span className="ml-2">{formatDate(detail.checkOutDate)}</span></div>
          <div><span className="text-gray-500">방:</span> <span className="ml-2">{detail.room.roomName}</span></div>
          <div><span className="text-gray-500">주소:</span> <span className="ml-2">{detail.room.address}</span></div>
        </div>
      </Card>

      {/* 게스트 / 호스트 */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <h2 className="text-base font-semibold mb-3">게스트</h2>
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-500">이름:</span> <span className="ml-2">{detail.guest.name}</span></div>
            <div><span className="text-gray-500">이메일:</span> <span className="ml-2">{detail.guest.email}</span></div>
            <div><span className="text-gray-500">연락처:</span> <span className="ml-2">{detail.guest.phoneNumber}</span></div>
          </div>
        </Card>
        <Card>
          <h2 className="text-base font-semibold mb-3">호스트</h2>
          <div className="space-y-1 text-sm">
            <div><span className="text-gray-500">이름:</span> <span className="ml-2">{detail.host.name}</span></div>
            <div><span className="text-gray-500">이메일:</span> <span className="ml-2">{detail.host.email}</span></div>
            <div><span className="text-gray-500">연락처:</span> <span className="ml-2">{detail.host.phoneNumber}</span></div>
          </div>
        </Card>
      </div>

      {/* 보증금 보류 정보 */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">보증금 보류 정보</h2>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">보증금</p>
            <p className="text-lg font-bold">{formatCurrency(detail.deposit)}</p>
          </div>
          <div className="p-3 bg-orange-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">차감 요청액</p>
            <p className="text-lg font-bold text-orange-600">
              {latestAgreementWithAmount ? formatCurrency(latestAgreementWithAmount.deductAmount!) : '-'}
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <p className="text-xs text-gray-500 mb-1">환불 예정액</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(detail.refundableDeposit)}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
          <div><span className="text-gray-500">보류 사유:</span> <span className="ml-2">{detail.holdReason}</span></div>
          <div><span className="text-gray-500">신청일:</span> <span className="ml-2">{formatDateTime(detail.holdRequestedAt)}</span></div>
          <div>
            <span className="text-gray-500">승인일:</span>
            <span className="ml-2">{detail.holdApprovedAt ? formatDateTime(detail.holdApprovedAt) : '-'}</span>
          </div>
        </div>
      </Card>

      {/* 합의 이력 */}
      {detail.depositAgreements.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">합의 이력</h2>
          <div className="space-y-4">
            {detail.depositAgreements.map((agreement: DepositAgreement, index: number) => {
              const cfg = AGREEMENT_STATUS_MAP[agreement.status];
              return (
                <div
                  key={agreement.id}
                  className={`border rounded-lg p-4 ${index === 0 ? 'border-gray-300 bg-gray-50' : 'border-gray-200'}`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    {index === 0 && (
                      <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded">최신</span>
                    )}
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    <span className="text-xs text-gray-400 ml-auto">신청: {formatDateTime(agreement.requestedAt)}</span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-500">보류 사유:</span> <span className="ml-2">{agreement.holdReason}</span></div>

                    {agreement.status === 'REJECTED' && agreement.rejectedReason && (
                      <div className="p-2.5 bg-red-50 rounded text-red-700">
                        <span className="font-medium">반려 사유:</span> {agreement.rejectedReason}
                        {agreement.rejectedAt && (
                          <span className="block text-xs text-red-500 mt-0.5">반려일시: {formatDateTime(agreement.rejectedAt)}</span>
                        )}
                      </div>
                    )}

                    {agreement.adminApprovedAt && (
                      <div><span className="text-gray-500">관리자 승인일:</span> <span className="ml-2">{formatDateTime(agreement.adminApprovedAt)}</span></div>
                    )}

                    {agreement.deductAmount != null && (
                      <div><span className="text-gray-500">차감 요청액:</span> <span className="ml-2 font-semibold text-orange-600">{formatCurrency(agreement.deductAmount)}</span></div>
                    )}

                    {agreement.agreementText && (
                      <div>
                        <span className="text-gray-500">합의 내용:</span>
                        <p className="mt-1 p-3 bg-white border border-gray-200 rounded">{agreement.agreementText}</p>
                      </div>
                    )}

                    {agreement.submittedAt && (
                      <div><span className="text-gray-500">제출일:</span> <span className="ml-2">{formatDateTime(agreement.submittedAt)}</span></div>
                    )}

                    {agreement.acceptedAt && (
                      <div><span className="text-gray-500">게스트 동의일:</span> <span className="ml-2">{formatDateTime(agreement.acceptedAt)}</span></div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 관리자 액션 — 보류 신청 대기 */}
      {detail.holdStatus === 'REQUESTED' && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">관리자 액션</h2>
          <div className="flex gap-3">
            <Button variant="primary" onClick={() => setModalType('approve')}>보류 승인</Button>
            <Button variant="danger" onClick={() => setModalType('reject')}>보류 반려</Button>
          </div>
        </Card>
      )}

      {/* 관리자 액션 — 보류 반려됨 */}
      {detail.holdStatus === 'REJECTED' && (() => {
        const latest = detail.depositAgreements[0];
        return (
          <Card>
            <h2 className="text-lg font-semibold mb-3">처리 결과</h2>
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 space-y-1">
              <p className="font-medium">보류 신청이 반려되었습니다.</p>
              {latest?.rejectedReason && (
                <p>반려 사유: {latest.rejectedReason}</p>
              )}
              {latest?.rejectedAt && (
                <p className="text-red-600">반려일시: {formatDateTime(latest.rejectedAt)}</p>
              )}
              <p className="text-gray-600 pt-1">호스트가 보류를 재신청할 수 있습니다. 퇴실 확인 카운트다운이 재개됩니다.</p>
            </div>
          </Card>
        );
      })()}

      {/* 관리자 액션 — 환불 실패 */}
      {detail.holdStatus === 'REFUND_FAILED' && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">관리자 액션</h2>
          <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700 mb-4">
            PG 환불 처리가 실패한 상태입니다. 환불을 재시도하거나, 상세 로그를 확인해 주세요.
          </div>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => setModalType('retry')}>환불 재시도</Button>
          </div>
        </Card>
      )}

      {/* 처리 로그 */}
      {detail.logs && detail.logs.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">처리 로그</h2>
          <div className="space-y-3">
            {detail.logs.map((log) => (
              <div key={log.id} className="flex items-start gap-4 text-sm border-l-2 border-gray-200 pl-4 py-1">
                <span className="text-gray-400 whitespace-nowrap">{formatDateTime(log.createdAt)}</span>
                <span className="font-medium text-gray-700 whitespace-nowrap">
                  {LOG_ACTOR_LABEL[log.changedBy] || log.changedBy}
                </span>
                <span className="text-gray-600">{log.reason}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 승인 모달 */}
      <Modal
        isOpen={modalType === 'approve'}
        onClose={() => setModalType(null)}
        title="보증금 보류 승인"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>취소</Button>
            <Button variant="primary" onClick={handleApprove} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '승인'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          계약 <strong>#{detail.contractId}</strong>의 보증금 보류 신청을 승인하시겠습니까?<br />
          승인 후 호스트가 차감 내용을 제출할 수 있으며, 합의 기한은 승인일로부터 10일입니다.
        </p>
      </Modal>

      {/* 반려 모달 */}
      <Modal
        isOpen={modalType === 'reject'}
        onClose={() => { setModalType(null); setRejectReason(''); }}
        title="보증금 보류 반려"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => { setModalType(null); setRejectReason(''); }}>취소</Button>
            <Button variant="danger" onClick={handleReject} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '반려'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            반려 시 퇴실 확인 카운트다운이 재개되며, 보증금 전액 자동 반환 흐름으로 전환됩니다.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              반려 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="반려 사유를 입력하세요"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 환불 재시도 모달 */}
      <Modal
        isOpen={modalType === 'retry'}
        onClose={() => setModalType(null)}
        title="PG 환불 재시도"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setModalType(null)}>취소</Button>
            <Button variant="danger" onClick={handleRetryRefund} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '환불 재시도'}
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            계약 <strong>#{detail.contractId}</strong>의 보증금 PG 환불이 실패한 상태입니다.
          </p>
          <div className="p-3 bg-red-50 rounded-lg text-sm text-red-700">
            환불을 재시도합니다. 성공 시 차감 확정(DEDUCTION_CONFIRMED) 또는 반환 확정(RETURN_CONFIRMED) 상태로 복원되며,
            재실패 시 환불 실패(REFUND_FAILED) 상태가 유지되고 실패 로그가 누적됩니다.
          </div>
        </div>
      </Modal>
    </div>
  );
}
