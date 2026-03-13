import { useState, useEffect } from 'react';
import type { ReceiptDetail } from '../../types';
import { formatDateTime, formatCurrency } from '../../utils/format';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { receiptService } from '../../services/receiptService';

const receiptTypeLabels: Record<string, string> = {
  personal: '개인소득공제용',
  business: '사업자증빙용',
  tax_invoice: '전자세금계산서',
};

const targetTypeLabels: Record<string, string> = {
  CONTRACT_FEE: '플랫폼 계약 수수료',
  HOST_CANCEL_FEE: '호스트 계약 취소 수수료',
  GUEST_CANCEL_FEE: '게스트 취소 위약금 (플랫폼 귀속)',
  OPTION_SALE: '플랫폼 옵션 상품',
};

const userTypeLabels: Record<string, string> = {
  HOST: '호스트',
  GUEST: '게스트',
};

interface Props {
  receiptId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onIssued?: () => void;
}

export default function ReceiptDetailModal({ receiptId, isOpen, onClose, onIssued }: Props) {
  const [detail, setDetail] = useState<ReceiptDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [issueNote, setIssueNote] = useState('');
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (isOpen && receiptId) {
      loadDetail(receiptId);
    }
    if (!isOpen) {
      setDetail(null);
      setIssueNote('');
      setError(null);
    }
  }, [isOpen, receiptId]);

  const loadDetail = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await receiptService.getReceiptDetail(id);
      setDetail(data);
    } catch {
      setError('영수증 상세 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    if (!detail || !confirm('영수증을 발급 처리하시겠습니까?')) return;
    try {
      setIssuing(true);
      await receiptService.issueReceipt(detail.id, issueNote || undefined);
      alert('영수증이 발급 처리되었습니다.');
      onIssued?.();
      onClose();
    } catch {
      alert('발급 처리에 실패했습니다.');
    } finally {
      setIssuing(false);
    }
  };

  const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="flex py-2 border-b border-gray-100 last:border-0">
      <span className="w-32 shrink-0 text-sm font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-900">{value || '-'}</span>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="영수증 상세" size="lg">
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : error ? (
        <p className="text-red-500 text-center py-8">{error}</p>
      ) : detail ? (
        <div className="space-y-6">
          {/* 기본 정보 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">기본 정보</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow label="영수증 ID" value={`#${detail.id}`} />
              <InfoRow label="사용자 유형" value={userTypeLabels[detail.userType]} />
              <InfoRow label="사용자" value={`${detail.userName} (ID: ${detail.userId})`} />
              <InfoRow label="전화번호" value={detail.userPhone} />
              <InfoRow label="이메일" value={detail.userEmail} />
              <InfoRow label="주문번호" value={detail.orderId} />
            </div>
          </div>

          {/* 영수증 정보 */}
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-2">영수증 정보</h4>
            <div className="bg-gray-50 rounded-lg p-4">
              <InfoRow label="영수증 종류" value={receiptTypeLabels[detail.receiptType]} />
              <InfoRow label="발급 유형" value={targetTypeLabels[detail.targetType]} />
              <InfoRow label="금액" value={formatCurrency(detail.amount)} />
              <InfoRow label="날짜" value={detail.date} />
              <InfoRow
                label="상태"
                value={
                  <Badge variant={detail.status === 'ISSUED' ? 'success' : 'warning'}>
                    {detail.status === 'ISSUED' ? '발급 완료' : '발급 대기'}
                  </Badge>
                }
              />
              {detail.receiptNumber && <InfoRow label="발급번호" value={detail.receiptNumber} />}
              {detail.businessName && <InfoRow label="사업자명" value={detail.businessName} />}
              {detail.repName && <InfoRow label="대표자명" value={detail.repName} />}
              {detail.email && <InfoRow label="이메일" value={detail.email} />}
            </div>
          </div>

          {/* 정산 정보 */}
          {detail.settlement && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">연결 정산</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <InfoRow label="정산 ID" value={`#${detail.settlement.id}`} />
                <InfoRow label="정산 상태" value={detail.settlement.status} />
                <InfoRow label="정산 금액" value={formatCurrency(detail.settlement.netAmount)} />
                <InfoRow label="예상 정산일" value={detail.settlement.expectedDate} />
                {detail.settlement.completedAt && (
                  <InfoRow label="정산 완료일" value={formatDateTime(detail.settlement.completedAt)} />
                )}
              </div>
            </div>
          )}

          {/* 발급 정보 (이미 발급된 경우) */}
          {detail.status === 'ISSUED' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">발급 처리 정보</h4>
              <div className="bg-green-50 rounded-lg p-4">
                <InfoRow label="발급일시" value={detail.issuedAt ? formatDateTime(detail.issuedAt) : '-'} />
                <InfoRow label="처리자" value={detail.issuedByAdmin?.name || '-'} />
                {detail.issueNote && <InfoRow label="메모" value={detail.issueNote} />}
              </div>
            </div>
          )}

          {/* 발급 처리 (PENDING인 경우) */}
          {detail.status === 'PENDING' && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">발급 처리</h4>
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <textarea
                  value={issueNote}
                  onChange={(e) => setIssueNote(e.target.value)}
                  placeholder="메모 (선택사항)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={2}
                />
                <Button
                  variant="primary"
                  onClick={handleIssue}
                  disabled={issuing}
                  className="w-full"
                >
                  {issuing ? '처리 중...' : '발급 완료 처리'}
                </Button>
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400 text-right">
            생성: {formatDateTime(detail.createdAt)} / 수정: {formatDateTime(detail.updatedAt)}
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
