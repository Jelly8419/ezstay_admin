import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  FileText,
  Home,
  Send,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { moveInCaseService } from '../../services/moveInCaseService';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/format';
import type {
  MoveInCaseDetail as MoveInCaseDetailType,
  MoveInGuestOrder,
} from '../../types';
import {
  CLEANING_STATUS_CONFIG,
  PAYMENT_REQUEST_STATUS_CONFIG,
  getGroupStatusBadge,
} from './moveInCaseLabels';

// ──────────────────────────────────────────────────────────
// 결제 정보 라인 헬퍼
// ──────────────────────────────────────────────────────────

function PaymentInfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 py-1.5">
      <div className="w-24 shrink-0 text-sm text-gray-500">{label}</div>
      <div className="flex-1 text-sm text-gray-900">{value}</div>
    </div>
  );
}

// 주문 묶음에서 항목 요약 문자열 만들기
function summarizeOrderItems(orders: MoveInGuestOrder[]): string {
  const labels: string[] = [];
  for (const order of orders) {
    for (const item of order.items) {
      if (item.status !== 'ACTIVE') continue;
      labels.push(`${item.optionName} ${item.quantity}개`);
    }
  }
  return labels.length > 0 ? labels.join(', ') : '-';
}

// 주문 묶음 총액(활성/결제완료 기준)
function sumOrderAmounts(orders: MoveInGuestOrder[]): number {
  return orders.reduce((sum, o) => sum + (o.paidAmount ?? o.totalAmount ?? 0), 0);
}

// 주문 묶음에서 대표 결제 정보(첫 번째 PAID order 의 첫 payment 또는 첫 order)
function pickRepresentativePayment(orders: MoveInGuestOrder[]) {
  const paid = orders.find((o) => o.status === 'PAID');
  const target = paid ?? orders[0];
  if (!target) return null;
  const pay = target.payments[0];
  return {
    paymentMethod: target.paymentMethod ?? pay?.pgMethod ?? null,
    paidAt: target.paidAt ?? pay?.paidAt ?? null,
    pgTid: pay?.pgTid ?? null,
  };
}

// ──────────────────────────────────────────────────────────

export default function MoveInCaseDetail() {
  const { caseId } = useParams<{ caseId: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<MoveInCaseDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 메모 편집
  const [memoEditing, setMemoEditing] = useState(false);
  const [memoDraft, setMemoDraft] = useState('');
  const [memoSaving, setMemoSaving] = useState(false);

  // 재발송
  const [resending, setResending] = useState(false);

  // 비밀번호 표시 토글
  const [showPasswords, setShowPasswords] = useState(false);

  const load = useCallback(async () => {
    if (!caseId) return;
    const id = Number(caseId);
    if (!Number.isInteger(id)) {
      setError('잘못된 케이스 ID 입니다.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await moveInCaseService.getCaseDetail(id);
      setData(res);
      setMemoDraft(res.adminMemo ?? '');
    } catch (e: any) {
      setError(e?.message || '상세 조회에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    load();
  }, [load]);

  // ─── 핸들러 ───

  const handleSaveMemo = async () => {
    if (!data) return;
    setMemoSaving(true);
    try {
      const next = memoDraft.trim() === '' ? null : memoDraft;
      const res = await moveInCaseService.updateCase(data.id, {
        adminMemo: next,
      });
      setData(res);
      setMemoDraft(res.adminMemo ?? '');
      setMemoEditing(false);
    } catch (e: any) {
      alert(e?.message || '메모 저장에 실패했습니다.');
    } finally {
      setMemoSaving(false);
    }
  };

  const handleCancelMemo = () => {
    setMemoDraft(data?.adminMemo ?? '');
    setMemoEditing(false);
  };

  const handleResend = async () => {
    if (!data) return;
    if (!window.confirm('결제 요청 알림톡을 재발송하시겠습니까?')) return;
    setResending(true);
    try {
      const res = await moveInCaseService.resendPaymentRequest(data.id);
      if (res._note) {
        alert(`경고: ${res._note}`);
      } else {
        alert('결제 요청이 재발송되었습니다.');
      }
      await load();
    } catch (e: any) {
      alert(e?.message || '재발송에 실패했습니다.');
    } finally {
      setResending(false);
    }
  };

  const handleCopyLink = async () => {
    if (!data?.paymentRequest.link) return;
    try {
      await navigator.clipboard.writeText(data.paymentRequest.link);
      alert('결제 링크가 복사되었습니다.');
    } catch {
      alert('복사에 실패했습니다.');
    }
  };

  // ─── 렌더 ───

  if (loading) {
    return <div className="p-6 text-center text-gray-500">불러오는 중...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-red-700 text-sm">{error || '데이터가 없습니다.'}</p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            onClick={() => navigate('/move-in-cases')}
          >
            목록으로
          </Button>
        </Card>
      </div>
    );
  }

  const cleaningCfg = CLEANING_STATUS_CONFIG[data.cleaning.status];
  const amenityBadge = getGroupStatusBadge(data.amenity.status);
  const beddingBadge = getGroupStatusBadge(data.bedding.status);
  const paymentReqCfg = PAYMENT_REQUEST_STATUS_CONFIG[data.paymentRequest.status];

  const roomComposition = [
    data.room.roomCount != null ? `방 ${data.room.roomCount}개` : null,
    data.room.livingRoomCount != null
      ? `거실 ${data.room.livingRoomCount}개`
      : null,
    data.room.bathroomCount != null
      ? `화장실 ${data.room.bathroomCount}개`
      : null,
  ]
    .filter(Boolean)
    .join(', ');

  const amenityRep = pickRepresentativePayment(data.amenity.orders);
  const beddingRep = pickRepresentativePayment(data.bedding.orders);

  return (
    <div className="p-6 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => navigate('/move-in-cases')}
        >
          <ArrowLeft className="w-4 h-4 inline mr-1" />
          목록
        </Button>
        <h1 className="text-xl font-bold text-gray-900">
          입주 준비 케이스 #{data.id}
        </h1>
      </div>

      {/* 상단: 방 정보 + 임대인 + 임차인 */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 방 정보 */}
          <div className="md:col-span-1">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                <Home className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <div className="text-xs text-gray-500">방 정보</div>
                <div className="font-semibold text-gray-900 mt-0.5">
                  {data.room.roomName || data.room.address}
                </div>
                {data.room.detailAddress && (
                  <div className="text-xs text-gray-500 mt-0.5">
                    {data.room.address}, {data.room.detailAddress}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-1 text-sm">
              <PaymentInfoRow label="주소" value={data.room.address} />
              {data.room.areaPyeong != null && (
                <PaymentInfoRow label="평수" value={`${data.room.areaPyeong}평`} />
              )}
              {roomComposition && (
                <PaymentInfoRow label="방 구성" value={roomComposition} />
              )}
            </div>
          </div>

          {/* 임대인 */}
          <div>
            <div className="text-xs text-gray-500">임대인</div>
            <div className="font-semibold text-gray-900 mt-0.5">
              {data.host.name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {data.host.phoneNumber}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{data.host.email}</div>
          </div>

          {/* 임차인 */}
          <div>
            <div className="text-xs text-gray-500">임차인</div>
            <div className="font-semibold text-gray-900 mt-0.5">
              {data.guest.name}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {data.guest.phoneNumber}
            </div>
            {data.guest.email && (
              <div className="text-xs text-gray-500 mt-0.5">
                {data.guest.email}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* 계약 기간 / 등록 정보 */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">
              계약 기간
            </div>
            <PaymentInfoRow
              label="입주일"
              value={formatDate(data.period.checkInDate)}
            />
            <PaymentInfoRow
              label="퇴실일"
              value={formatDate(data.period.checkOutDate)}
            />
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900 mb-3">
              등록 정보
            </div>
            <PaymentInfoRow
              label="등록일"
              value={formatDateTime(data.createdAt)}
            />
            <PaymentInfoRow
              label="최종 수정일"
              value={
                data.lastModified?.at
                  ? formatDateTime(data.lastModified.at)
                  : '-'
              }
            />
            <PaymentInfoRow
              label="수정자"
              value={data.lastModified?.admin?.name ?? '-'}
            />
          </div>
        </div>
      </Card>

      {/* 비밀번호 (공동현관 / 도어락) */}
      {(data.room.commonEntrancePassword || data.room.doorLockPassword) && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold text-gray-900">
              출입 비밀번호
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPasswords((v) => !v)}
            >
              {showPasswords ? (
                <>
                  <EyeOff className="w-4 h-4 inline mr-1" />
                  숨기기
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 inline mr-1" />
                  표시
                </>
              )}
            </Button>
          </div>
          <PaymentInfoRow
            label="공동현관"
            value={
              showPasswords
                ? data.room.commonEntrancePassword || '-'
                : '••••••'
            }
          />
          <PaymentInfoRow
            label="도어락"
            value={
              showPasswords ? data.room.doorLockPassword || '-' : '••••••'
            }
          />
        </Card>
      )}

      {/* A. 청소 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-base font-semibold text-gray-900">A. 청소</div>
          <Badge variant={cleaningCfg.variant}>{cleaningCfg.label}</Badge>
        </div>
        <PaymentInfoRow label="신청 상태" value={cleaningCfg.label} />
        <PaymentInfoRow label="청소 금액" value={formatCurrency(data.cleaning.fee)} />
        <PaymentInfoRow
          label="희망 일자"
          value={
            data.cleaning.desiredDate
              ? formatDate(data.cleaning.desiredDate)
              : '-'
          }
        />
        <PaymentInfoRow
          label="희망 시간"
          value={
            data.cleaning.desiredTime
              ? data.cleaning.desiredTime.slice(0, 5)
              : '-'
          }
        />
        <PaymentInfoRow
          label="결제 마감"
          value={
            data.cleaning.paymentDeadline
              ? formatDateTime(data.cleaning.paymentDeadline)
              : '-'
          }
        />
        {data.cleaning.payment && (
          <>
            <PaymentInfoRow
              label="결제 수단"
              value={data.cleaning.payment.pgMethod || '-'}
            />
            <PaymentInfoRow
              label="결제 일시"
              value={
                data.cleaning.payment.paidAt
                  ? formatDateTime(data.cleaning.payment.paidAt)
                  : '-'
              }
            />
            <PaymentInfoRow
              label="결제 번호"
              value={
                <span className="font-mono text-xs text-gray-700">
                  {data.cleaning.payment.pgTid || '-'}
                </span>
              }
            />
          </>
        )}
      </Card>

      {/* B. 입주용품 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-base font-semibold text-gray-900">
            B. 입주용품
          </div>
          {amenityBadge ? (
            <Badge variant={amenityBadge.variant}>{amenityBadge.label}</Badge>
          ) : (
            <span className="text-xs text-gray-400">미신청</span>
          )}
        </div>
        {data.amenity.orders.length === 0 ? (
          <div className="text-sm text-gray-500">신청된 입주용품이 없습니다.</div>
        ) : (
          <>
            <PaymentInfoRow
              label="요청 항목"
              value={summarizeOrderItems(data.amenity.orders)}
            />
            <PaymentInfoRow
              label="금액"
              value={formatCurrency(sumOrderAmounts(data.amenity.orders))}
            />
            <PaymentInfoRow
              label="결제 마감"
              value={
                data.amenity.paymentDeadline
                  ? formatDateTime(data.amenity.paymentDeadline)
                  : '-'
              }
            />
            {amenityRep && (
              <>
                <PaymentInfoRow
                  label="결제 수단"
                  value={amenityRep.paymentMethod || '-'}
                />
                <PaymentInfoRow
                  label="결제 일시"
                  value={
                    amenityRep.paidAt ? formatDateTime(amenityRep.paidAt) : '-'
                  }
                />
                <PaymentInfoRow
                  label="결제 번호"
                  value={
                    <span className="font-mono text-xs text-gray-700">
                      {amenityRep.pgTid || '-'}
                    </span>
                  }
                />
              </>
            )}
          </>
        )}
      </Card>

      {/* C. 침구류 대여 */}
      <Card>
        <div className="flex items-center gap-2 mb-3">
          <div className="text-base font-semibold text-gray-900">
            C. 침구류 대여
          </div>
          {beddingBadge ? (
            <Badge variant={beddingBadge.variant}>{beddingBadge.label}</Badge>
          ) : (
            <span className="text-xs text-gray-400">미신청</span>
          )}
        </div>
        {data.bedding.orders.length === 0 ? (
          <div className="text-sm text-gray-500">신청된 침구류가 없습니다.</div>
        ) : (
          <>
            <PaymentInfoRow
              label="요청 항목"
              value={summarizeOrderItems(data.bedding.orders)}
            />
            <PaymentInfoRow
              label="금액"
              value={formatCurrency(sumOrderAmounts(data.bedding.orders))}
            />
            <PaymentInfoRow
              label="결제 마감"
              value={
                data.bedding.paymentDeadline
                  ? formatDateTime(data.bedding.paymentDeadline)
                  : '-'
              }
            />
            {beddingRep && (
              <>
                <PaymentInfoRow
                  label="결제 수단"
                  value={beddingRep.paymentMethod || '-'}
                />
                <PaymentInfoRow
                  label="결제 일시"
                  value={
                    beddingRep.paidAt ? formatDateTime(beddingRep.paidAt) : '-'
                  }
                />
                <PaymentInfoRow
                  label="결제 번호"
                  value={
                    <span className="font-mono text-xs text-gray-700">
                      {beddingRep.pgTid || '-'}
                    </span>
                  }
                />
              </>
            )}
          </>
        )}
      </Card>

      {/* 요청 / 링크 정보 */}
      <Card>
        <div className="text-base font-semibold text-gray-900 mb-3">
          요청 / 링크 정보
        </div>
        <PaymentInfoRow
          label="요청 상태"
          value={<Badge variant={paymentReqCfg.variant}>{paymentReqCfg.label}</Badge>}
        />
        <PaymentInfoRow
          label="요청 링크"
          value={
            data.paymentRequest.link ? (
              <div className="flex items-center gap-2">
                <a
                  href={data.paymentRequest.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline text-sm break-all"
                >
                  {data.paymentRequest.link}
                </a>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="text-gray-400 hover:text-gray-600"
                  title="링크 복사"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            ) : (
              '-'
            )
          }
        />
        <PaymentInfoRow
          label="알림톡"
          value={
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">
                {data.paymentRequest.sentAt
                  ? `${formatDateTime(data.paymentRequest.sentAt)} (${data.paymentRequest.resendCount + 1}회)`
                  : '발송 이력 없음'}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleResend}
                disabled={resending}
              >
                <Send className="w-4 h-4 inline mr-1" />
                {resending ? '발송 중...' : '요청 재발송'}
              </Button>
            </div>
          }
        />
        {data.paymentRequest.lastResentAt && (
          <PaymentInfoRow
            label="최근 재발송"
            value={formatDateTime(data.paymentRequest.lastResentAt)}
          />
        )}
        {data.paymentRequest.expiresAt && (
          <PaymentInfoRow
            label="만료 일시"
            value={formatDateTime(data.paymentRequest.expiresAt)}
          />
        )}
      </Card>

      {/* 메모 */}
      <Card>
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-gray-500" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-gray-900">메모</div>
              {!memoEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setMemoEditing(true)}
                >
                  {data.adminMemo ? '편집' : '추가'}
                </Button>
              )}
            </div>

            {memoEditing ? (
              <div className="space-y-2">
                <textarea
                  value={memoDraft}
                  onChange={(e) => setMemoDraft(e.target.value)}
                  rows={4}
                  placeholder="관리자 메모를 입력하세요"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <div className="flex justify-end gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleCancelMemo}
                    disabled={memoSaving}
                  >
                    취소
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveMemo}
                    disabled={memoSaving}
                  >
                    {memoSaving ? '저장 중...' : '저장'}
                  </Button>
                </div>
              </div>
            ) : data.adminMemo ? (
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {data.adminMemo}
              </p>
            ) : (
              <p className="text-sm text-gray-400">등록된 메모가 없습니다.</p>
            )}

            {data.requestMemo && (
              <div className="mt-4 pt-3 border-t">
                <div className="text-xs text-gray-500 mb-1">
                  임대인 요청 메모
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">
                  {data.requestMemo}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
