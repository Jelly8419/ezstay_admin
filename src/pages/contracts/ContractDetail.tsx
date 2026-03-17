import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import type { ReservationDetail, PaymentTimelineEvent } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { reservationService } from '../../services/reservationService';

const getStatusBadge = (status: string) => {
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

// 강제 취소 가능 상태
const FORCE_CANCEL_STATUSES = [
  'PENDING_APPROVAL', 'APPROVED', 'PAYMENT_COMPLETED', 'IN_PROGRESS', 'CANCEL_REQUESTED',
];

// 호스트 취소 요청 승인/거절 가능 상태
const CANCEL_REQUEST_STATUSES = ['IN_PROGRESS', 'CANCEL_REQUESTED'];

export default function ContractDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showForceCancelModal, setShowForceCancelModal] = useState(false);
  const [showApproveCancelModal, setShowApproveCancelModal] = useState(false);
  const [showRejectCancelModal, setShowRejectCancelModal] = useState(false);

  // Form states
  const [cancelReason, setCancelReason] = useState('');
  const [withRefund, setWithRefund] = useState(true);
  const [adminNote, setAdminNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const contractId = Number(id);

  const loadDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reservationService.getReservationDetail(contractId);
      setDetail(response);
    } catch (err) {
      console.error('예약 상세 로드 실패:', err);
      setError('예약 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contractId) loadDetail();
  }, [contractId]);

  const handleForceCancel = async () => {
    if (!cancelReason.trim()) return alert('취소 사유를 입력해주세요.');
    try {
      setActionLoading(true);
      await reservationService.forceCancel(contractId, {
        reason: cancelReason,
        withRefund,
      });
      alert('강제 취소가 완료되었습니다.');
      setShowForceCancelModal(false);
      setCancelReason('');
      loadDetail();
    } catch (err: any) {
      alert(err?.message || '강제 취소 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveCancelRequest = async () => {
    try {
      setActionLoading(true);
      await reservationService.approveCancelRequest(contractId, {
        withRefund,
        adminNote: adminNote || undefined,
      });
      alert('호스트 취소 요청이 승인되었습니다.');
      setShowApproveCancelModal(false);
      setAdminNote('');
      loadDetail();
    } catch (err: any) {
      alert(err?.message || '취소 요청 승인 실패');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectCancelRequest = async () => {
    try {
      setActionLoading(true);
      await reservationService.rejectCancelRequest(contractId, {
        adminNote: adminNote || undefined,
      });
      alert('호스트 취소 요청이 거절되었습니다.');
      setShowRejectCancelModal(false);
      setAdminNote('');
      loadDetail();
    } catch (err: any) {
      alert(err?.message || '취소 요청 거절 실패');
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
        <Button onClick={() => navigate('/contracts')}>목록으로</Button>
      </div>
    );
  }

  const canForceCancel = FORCE_CANCEL_STATUSES.includes(detail.status);
  const canHandleCancelRequest = CANCEL_REQUEST_STATUSES.includes(detail.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="secondary" onClick={() => navigate('/contracts')}>
            ← 목록
          </Button>
          <h1 className="text-2xl font-bold">예약 상세</h1>
          <span className="text-gray-500">#{detail.id}</span>
          {getStatusBadge(detail.status)}
        </div>
        <div className="flex gap-2">
          {canHandleCancelRequest && (
            <>
              <Button
                variant="primary"
                onClick={() => { setWithRefund(true); setAdminNote(''); setShowApproveCancelModal(true); }}
              >
                취소 요청 승인
              </Button>
              <Button
                variant="secondary"
                onClick={() => { setAdminNote(''); setShowRejectCancelModal(true); }}
              >
                취소 요청 거절
              </Button>
            </>
          )}
          {canForceCancel && (
            <Button
              variant="danger"
              onClick={() => { setCancelReason(''); setWithRefund(true); setShowForceCancelModal(true); }}
            >
              강제 취소
            </Button>
          )}
        </div>
      </div>

      {/* 기본 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-semibold mb-4">예약 정보</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">계약번호</dt>
              <dd className="font-medium">{detail.orderId}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">입실</dt>
              <dd>{formatDate(detail.checkInDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">퇴실</dt>
              <dd>{formatDate(detail.checkOutDate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">숙박일수</dt>
              <dd>{detail.totalDays}일</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">결제일시</dt>
              <dd>{detail.paidAt ? formatDateTime(detail.paidAt) : '-'}</dd>
            </div>
          </dl>
        </Card>

        <Card>
          <h2 className="text-lg font-semibold mb-4">금액 정보</h2>
          <dl className="space-y-3">
            <div className="flex justify-between">
              <dt className="text-gray-500">임대료</dt>
              <dd>{formatCurrency(detail.rentalFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">관리비</dt>
              <dd>{formatCurrency(detail.maintenanceFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">
                {detail.room?.ezService?.cleaningService ? '청소비(이지서비스)' : '청소비'}
              </dt>
              <dd>{formatCurrency(detail.cleaningFee)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-500">보증금</dt>
              <dd>{formatCurrency(detail.deposit)}</dd>
            </div>
            {(() => {
              let items: Array<{ id?: number; name: string; price: number; quantity: number }> = [];
              try {
                if (detail.rentalItems) {
                  const parsed = typeof detail.rentalItems === 'string'
                    ? JSON.parse(detail.rentalItems)
                    : detail.rentalItems;
                  if (Array.isArray(parsed)) items = parsed;
                }
              } catch { /* 파싱 실패 시 무시 */ }

              if (items.length === 0) return null;
              return (
                <>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">렌탈 용품</dt>
                    <dd>{formatCurrency(detail.rentalItemsFee)}</dd>
                  </div>
                  <div className="pl-3 space-y-1">
                    {items.map((item, idx) => (
                      <div key={item.id ?? idx} className="flex justify-between text-sm">
                        <dt className="text-gray-400">
                          {item.name} × {item.quantity}
                        </dt>
                        <dd className="text-gray-500">{formatCurrency(item.price * item.quantity)}</dd>
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
            {detail.discountAmount > 0 && (
              <div className="flex justify-between">
                <dt className="text-gray-500">할인</dt>
                <dd className="text-green-600">-{formatCurrency(detail.discountAmount)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-gray-500">플랫폼 수수료</dt>
              <dd>{formatCurrency(detail.platformFee)}</dd>
            </div>
            <div className="flex justify-between border-t pt-3">
              <dt className="text-gray-900 font-semibold">최종 결제 금액</dt>
              <dd className="text-lg font-bold text-primary-600">{formatCurrency(detail.finalTotalAmount)}</dd>
            </div>
          </dl>
        </Card>
      </div>

      {/* 게스트 / 호스트 / 방 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {detail.guest && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">게스트</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">이름</dt>
                <dd>{detail.guest.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">닉네임</dt>
                <dd>{detail.guest.nickname || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">이메일</dt>
                <dd className="text-sm">{detail.guest.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">전화번호</dt>
                <dd>{detail.guest.phoneNumber}</dd>
              </div>
            </dl>
          </Card>
        )}

        {detail.host && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">호스트</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">이름</dt>
                <dd>{detail.host.name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">닉네임</dt>
                <dd>{detail.host.nickname || '-'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">이메일</dt>
                <dd className="text-sm">{detail.host.email}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">전화번호</dt>
                <dd>{detail.host.phoneNumber}</dd>
              </div>
            </dl>
          </Card>
        )}

        {detail.room && (
          <Card>
            <h2 className="text-lg font-semibold mb-4">방</h2>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-gray-500">방 이름</dt>
                <dd>
                  <Link
                    to={`/rooms/${detail.room.id}`}
                    className="text-primary-600 hover:underline"
                  >
                    {detail.room.roomName}
                  </Link>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">주소</dt>
                <dd className="text-sm text-right">{detail.room.address}</dd>
              </div>
              {detail.room.detailAddress && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">상세주소</dt>
                  <dd className="text-sm text-right">{detail.room.detailAddress}</dd>
                </div>
              )}
            </dl>
          </Card>
        )}
      </div>

      {/* 결제/환불 타임라인 */}
      {detail.timeline && detail.timeline.length > 0 && (
        <Card>
          <h2 className="text-lg font-semibold mb-4">결제/환불 내역</h2>
          <div className="space-y-4">
            {detail.timeline.map((event: PaymentTimelineEvent, idx: number) => {
              const isRefund = ['부분취소', 'PARTIAL_CANCEL', '전체취소', 'FULL_CANCEL'].includes(event.type);
              return (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border ${
                    isRefund ? 'border-red-200 bg-red-50/50' : 'border-green-200 bg-green-50/50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-sm font-medium ${isRefund ? 'text-red-600' : 'text-green-700'}`}>
                      {formatDateTime(event.occurredAt)}
                    </span>
                    <span className="text-gray-300">|</span>
                    <Badge variant={isRefund ? (event.type.includes('부분') || event.type.includes('PARTIAL') ? 'warning' : 'danger') : 'success'}>
                      {event.type}
                    </Badge>
                    <span className="text-gray-300">|</span>
                    <span className={`font-bold ${isRefund ? 'text-red-600' : ''}`}>
                      {isRefund ? '-' : '+'}{formatCurrency(Math.abs(event.amount))}
                    </span>
                  </div>
                  {event.description && (
                    <p className="text-sm text-gray-700">상세: {event.description}</p>
                  )}
                  {event.actor && (
                    <p className="text-sm text-gray-500">처리주체: {event.actor}</p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* 강제 취소 모달 */}
      {showForceCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">관리자 강제 취소</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">취소 사유 *</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="강제 취소 사유를 입력해주세요"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="withRefund"
                  checked={withRefund}
                  onChange={(e) => setWithRefund(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="withRefund" className="text-sm">환불 포함</label>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setShowForceCancelModal(false)}>취소</Button>
              <Button variant="danger" onClick={handleForceCancel} disabled={actionLoading}>
                {actionLoading ? '처리중...' : '강제 취소 실행'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 호스트 취소 승인 모달 */}
      {showApproveCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">호스트 취소 요청 승인</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="withRefundApprove"
                  checked={withRefund}
                  onChange={(e) => setWithRefund(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="withRefundApprove" className="text-sm">환불 포함</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">관리자 메모</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="관리자 메모 (선택)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setShowApproveCancelModal(false)}>닫기</Button>
              <Button variant="primary" onClick={handleApproveCancelRequest} disabled={actionLoading}>
                {actionLoading ? '처리중...' : '승인'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 호스트 취소 거절 모달 */}
      {showRejectCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">호스트 취소 요청 거절</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">거절 사유</label>
                <textarea
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  rows={3}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="거절 사유 (선택)"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="secondary" onClick={() => setShowRejectCancelModal(false)}>닫기</Button>
              <Button variant="danger" onClick={handleRejectCancelRequest} disabled={actionLoading}>
                {actionLoading ? '처리중...' : '거절'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
