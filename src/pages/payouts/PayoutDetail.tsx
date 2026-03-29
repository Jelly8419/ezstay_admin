import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import type { PayoutDetail as PayoutDetailType, PayoutStatus } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { payoutService } from '../../services/payoutService';

const getStatusBadge = (status: PayoutStatus, label: string) => {
  const map: Record<PayoutStatus, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
    PENDING: 'default',
    PAYABLE: 'info',
    PROCESSING: 'warning',
    COMPLETED: 'success',
    FAILED: 'danger',
    CANCELLED: 'default',
  };
  return <Badge variant={map[status]}>{label}</Badge>;
};

type ModalType = 'execute' | 'fail' | 'cancel' | 'retry' | 'note' | null;

export default function PayoutDetail() {
  const { payoutId } = useParams<{ payoutId: string }>();
  const navigate = useNavigate();

  const [payout, setPayout] = useState<PayoutDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalNote, setModalNote] = useState('');
  const [modalFailReason, setModalFailReason] = useState('');

  const loadPayout = async () => {
    if (!payoutId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await payoutService.getPayout(Number(payoutId));
      setPayout(response);
    } catch (err) {
      console.error('지급 상세 로드 실패:', err);
      setError('지급 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayout();
  }, [payoutId]);

  const closeModal = () => {
    setModalType(null);
    setModalNote('');
    setModalFailReason('');
  };

  const handleExecute = async () => {
    if (!payout) return;
    try {
      setActionLoading(true);
      await payoutService.execute(payout.id, modalNote || undefined);
      closeModal();
      await loadPayout();
    } catch (err) {
      alert('지급 실행에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleFail = async () => {
    if (!payout) return;
    if (!modalFailReason.trim()) {
      alert('실패 사유를 입력해주세요.');
      return;
    }
    try {
      setActionLoading(true);
      await payoutService.fail(payout.id, modalFailReason);
      closeModal();
      await loadPayout();
    } catch (err) {
      alert('실패 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!payout) return;
    try {
      setActionLoading(true);
      await payoutService.cancel(payout.id, modalNote || undefined);
      closeModal();
      await loadPayout();
    } catch (err) {
      alert('지급 취소에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRetry = async () => {
    if (!payout) return;
    try {
      setActionLoading(true);
      await payoutService.retry(payout.id);
      closeModal();
      await loadPayout();
    } catch (err) {
      alert('재시도 처리에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoteUpdate = async () => {
    if (!payout) return;
    if (!modalNote.trim()) {
      alert('메모 내용을 입력해주세요.');
      return;
    }
    try {
      setActionLoading(true);
      await payoutService.updateNote(payout.id, modalNote);
      closeModal();
      await loadPayout();
    } catch (err) {
      alert('메모 수정에 실패했습니다.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !payout) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500 mb-4">{error || '지급 정보를 찾을 수 없습니다.'}</p>
        <Button onClick={() => navigate('/payouts')}>목록으로</Button>
      </div>
    );
  }

  const canExecute = payout.status === 'PAYABLE';
  const canFail = payout.status === 'PAYABLE' || payout.status === 'PROCESSING';
  const canCancel = payout.status === 'PENDING' || payout.status === 'PAYABLE' || payout.status === 'FAILED';
  const canRetry = payout.status === 'FAILED';
  const canEditNote = payout.status !== 'COMPLETED' && payout.status !== 'CANCELLED';

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/payouts')}
            className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </button>
          <h1 className="text-2xl font-bold">지급 #{payout.id}</h1>
          {getStatusBadge(payout.status, payout.statusLabel)}
        </div>

        <div className="flex gap-2">
          {canExecute && (
            <Button variant="primary" onClick={() => setModalType('execute')}>
              지급 실행
            </Button>
          )}
          {canRetry && (
            <Button variant="primary" onClick={() => setModalType('retry')}>
              재시도
            </Button>
          )}
          {canFail && (
            <Button variant="danger" onClick={() => setModalType('fail')}>
              실패 처리
            </Button>
          )}
          {canCancel && (
            <Button variant="danger" onClick={() => setModalType('cancel')}>
              지급 취소
            </Button>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">기본 정보</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">지급 유형</span>
            <p className="mt-1 font-medium">{payout.payoutTypeLabel}</p>
            {payout.payoutTypeDescription && (
              <p className="mt-0.5 text-xs text-gray-400">{payout.payoutTypeDescription}</p>
            )}
          </div>
          <div>
            <span className="text-gray-500">수령인 유형</span>
            <p className="mt-1 font-medium">{payout.recipientType === 'HOST' ? '호스트' : '게스트'}</p>
          </div>
          <div>
            <span className="text-gray-500">지급 금액</span>
            <p className="mt-1 font-bold text-lg text-primary-600">{formatCurrency(payout.amount)}</p>
          </div>
          <div>
            <span className="text-gray-500">지급 가능일 (payableAfter)</span>
            <p className="mt-1 font-medium">{formatDate(payout.payableAfter)}</p>
          </div>
          <div>
            <span className="text-gray-500">처리 완료 시각</span>
            <p className="mt-1">{payout.processedAt ? formatDateTime(payout.processedAt) : '-'}</p>
          </div>
          <div>
            <span className="text-gray-500">처리 관리자</span>
            <p className="mt-1">{payout.processedByAdmin ? payout.processedByAdmin.name : '-'}</p>
          </div>
          {payout.failureReason && (
            <div className="col-span-2">
              <span className="text-gray-500">실패 사유</span>
              <p className="mt-1 text-red-600 font-medium">{payout.failureReason}</p>
            </div>
          )}
          <div>
            <span className="text-gray-500">생성 시각</span>
            <p className="mt-1">{formatDateTime(payout.createdAt)}</p>
          </div>
          <div>
            <span className="text-gray-500">최종 수정</span>
            <p className="mt-1">{formatDateTime(payout.updatedAt)}</p>
          </div>
        </div>
      </Card>

      {/* 계좌 정보 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">계좌 정보</h2>
          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">생성 시점 스냅샷</span>
        </div>
        {payout.bankName ? (
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">은행</span>
              <p className="mt-1 font-medium">{payout.bankName}</p>
            </div>
            <div>
              <span className="text-gray-500">계좌번호</span>
              <p className="mt-1 font-medium font-mono">{payout.accountNumber}</p>
            </div>
            <div>
              <span className="text-gray-500">예금주</span>
              <p className="mt-1 font-medium">{payout.accountHolder}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">등록된 계좌 정보가 없습니다. 재시도 시 최신 계좌 정보로 갱신됩니다.</p>
        )}
      </Card>

      {/* 수령인 정보 */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">수령인 정보</h2>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">이름</span>
            <p className="mt-1 font-medium">{payout.recipient.name}</p>
          </div>
          <div>
            <span className="text-gray-500">닉네임</span>
            <p className="mt-1">{payout.recipient.nickname}</p>
          </div>
          <div>
            <span className="text-gray-500">전화번호</span>
            <p className="mt-1">{payout.recipient.phoneNumber}</p>
          </div>
        </div>
      </Card>

      {/* 계약 정보 */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">계약 정보 <span className="text-sm text-gray-400 font-normal">#{payout.contractId}</span></h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">체크인</span>
            <p className="mt-1">{formatDate(payout.contract.checkInDate)}</p>
          </div>
          <div>
            <span className="text-gray-500">체크아웃</span>
            <p className="mt-1">{formatDate(payout.contract.checkOutDate)}</p>
          </div>
          <div>
            <span className="text-gray-500">임대료</span>
            <p className="mt-1">{formatCurrency(payout.contract.rentalFee)}</p>
          </div>
          <div>
            <span className="text-gray-500">관리비</span>
            <p className="mt-1">{formatCurrency(payout.contract.maintenanceFee)}</p>
          </div>
          <div>
            <span className="text-gray-500">청소비</span>
            <p className="mt-1">{formatCurrency(payout.contract.cleaningFee)}</p>
          </div>
          <div>
            <span className="text-gray-500">최종 합계</span>
            <p className="mt-1 font-bold">{formatCurrency(payout.contract.finalTotalAmount)}</p>
          </div>
        </div>
      </Card>

      {/* 연관 정산 정보 */}
      {payout.settlement && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">연관 정산 정보 <span className="text-sm text-gray-400 font-normal">#{payout.settlementId}</span></h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">정산 상태</span>
              <p className="mt-1">{payout.settlement.status}</p>
            </div>
            <div>
              <span className="text-gray-500">정산 순액</span>
              <p className="mt-1 font-medium">{formatCurrency(payout.settlement.netAmount)}</p>
            </div>
            <div>
              <span className="text-gray-500">정산 예정일</span>
              <p className="mt-1">{formatDate(payout.settlement.expectedDate)}</p>
            </div>
            <div>
              <span className="text-gray-500">지급 가능일</span>
              <p className="mt-1">{formatDate(payout.settlement.payoutAvailableDate)}</p>
            </div>
          </div>
        </Card>
      )}

      {/* 관리자 메모 */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">관리자 메모</h2>
          {canEditNote && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setModalNote(payout.note || '');
                setModalType('note');
              }}
            >
              수정
            </Button>
          )}
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-wrap min-h-[40px]">
          {payout.note || <span className="text-gray-400">메모 없음</span>}
        </p>
      </Card>

      {/* 상태 변경 이력 */}
      {payout.statusHistory && payout.statusHistory.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">상태 변경 이력</h2>
          <div className="space-y-0">
            {payout.statusHistory.map((h, idx) => (
              <div key={h.id} className="flex gap-4 text-sm">
                <div className="flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-primary-500 mt-1 flex-shrink-0" />
                  {idx < payout.statusHistory.length - 1 && (
                    <div className="w-px flex-1 bg-gray-200 my-1" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{h.toStatus}</span>
                    {h.fromStatus && (
                      <span className="text-xs text-gray-400">← {h.fromStatus}</span>
                    )}
                    <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                      {h.changedBy === 'ADMIN' ? `관리자 ${h.adminName ?? ''}` : '시스템'}
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{formatDateTime(h.createdAt)}</div>
                  {h.note && <div className="text-xs text-gray-600 mt-1">{h.note}</div>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* 지급 실행 모달 */}
      <Modal
        isOpen={modalType === 'execute'}
        onClose={closeModal}
        title="지급 실행 확인"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="primary" onClick={handleExecute} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '지급 실행'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-amber-800">
              이체를 완료한 후 실행하세요. <strong>지급 완료 후에는 되돌릴 수 없습니다.</strong>
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">처리 메모 (선택)</label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="예: 이체 완료 - 국민은행 123-456-789"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 실패 처리 모달 */}
      <Modal
        isOpen={modalType === 'fail'}
        onClose={closeModal}
        title="지급 실패 처리"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="danger" onClick={handleFail} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '실패 처리'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">실패 처리 후 재시도(retry)로 다시 시도할 수 있습니다.</p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              실패 사유 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={modalFailReason}
              onChange={(e) => setModalFailReason(e.target.value)}
              placeholder="예: 계좌번호 오류로 이체 반송"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 취소 모달 */}
      <Modal
        isOpen={modalType === 'cancel'}
        onClose={closeModal}
        title="지급 취소 확인"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>닫기</Button>
            <Button variant="danger" onClick={handleCancel} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '영구 취소'}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">
              <strong>취소 후에는 되돌릴 수 없습니다.</strong> 계속 진행하시겠습니까?
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">취소 사유 메모 (선택)</label>
            <textarea
              value={modalNote}
              onChange={(e) => setModalNote(e.target.value)}
              placeholder="예: 계약 분쟁으로 인한 지급 보류"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </Modal>

      {/* 재시도 모달 */}
      <Modal
        isOpen={modalType === 'retry'}
        onClose={closeModal}
        title="지급 재시도"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="primary" onClick={handleRetry} disabled={actionLoading}>
              {actionLoading ? '처리 중...' : '재시도'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          수령인의 <strong>현재 등록된 최신 계좌 정보</strong>로 재스냅샷 후 지급 가능(PAYABLE) 상태로 전환됩니다.
          계좌 정보를 먼저 수정한 뒤 재시도하세요.
        </p>
      </Modal>

      {/* 메모 수정 모달 */}
      <Modal
        isOpen={modalType === 'note'}
        onClose={closeModal}
        title="메모 수정"
        footer={
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>취소</Button>
            <Button variant="primary" onClick={handleNoteUpdate} disabled={actionLoading}>
              {actionLoading ? '저장 중...' : '저장'}
            </Button>
          </div>
        }
      >
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            메모 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={modalNote}
            onChange={(e) => setModalNote(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </Modal>
    </div>
  );
}
