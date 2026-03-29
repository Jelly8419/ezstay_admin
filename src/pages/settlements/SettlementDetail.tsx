import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import type { Settlement, SettlementDetail as SettlementDetailType } from '../../types';
import { formatCurrency } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { settlementService } from '../../services/settlementService';

export default function SettlementDetail() {
  const { settlementId } = useParams<{ settlementId: string }>();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<SettlementDetailType | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!settlementId) return;
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const [detailRes, listRes] = await Promise.all([
          settlementService.getSettlementDetail(Number(settlementId)),
          settlementService.getSettlements({ search: settlementId }),
        ]);
        setDetail(detailRes);
        setSettlement(listRes.settlements.find(s => s.id === Number(settlementId)) ?? null);
      } catch {
        setError('정산 상세 정보를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [settlementId]);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="text-center py-24">
        <p className="text-red-500 mb-4">{error || '정산 정보를 찾을 수 없습니다.'}</p>
        <Button onClick={() => navigate('/settlements')}>목록으로</Button>
      </div>
    );
  }

  const { settlementBreakdown, contractPaymentDetail, rentalOrders, rentalOrdersTotalPaid } = detail;

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/settlements')}
          className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          목록으로
        </button>
        <h1 className="text-2xl font-bold">정산 #{settlementId}</h1>
        {settlement && (
          <Badge
            variant={
              settlement.status === 'COMPLETED' ? 'success'
              : settlement.status === 'ON_HOLD' ? 'danger'
              : settlement.status === 'READY' ? 'info'
              : 'warning'
            }
          >
            {settlement.statusLabel}
          </Badge>
        )}
      </div>

      {/* 정산 내역 */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">정산 내역</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">임대료</span>
            <span>{formatCurrency(settlementBreakdown.rentalFee)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">관리비</span>
            <span>{formatCurrency(settlementBreakdown.maintenanceFee)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">청소비</span>
            <span>{formatCurrency(settlementBreakdown.cleaningFee)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">총 수입 (Gross)</span>
            <span className="font-medium">{formatCurrency(settlementBreakdown.grossAmount)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">플랫폼 수수료 (호스트 부담)</span>
            <span className="text-red-500">- {formatCurrency(settlementBreakdown.hostPlatformFee)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">환불 차감</span>
            <span className="text-red-500">- {formatCurrency(settlementBreakdown.refundDeduction)}</span>
          </div>
          <div className="flex justify-between py-2 pt-3">
            <span className="font-semibold">최종 정산금액 (Net)</span>
            <span className="font-bold text-lg text-primary-600">{formatCurrency(settlementBreakdown.netAmount)}</span>
          </div>
        </div>
      </Card>

      {/* 계약 결제 상세 */}
      <Card>
        <h2 className="text-lg font-semibold mb-4">계약 결제 상세</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">임대료</span>
            <span>{formatCurrency(contractPaymentDetail.rentalFee)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">관리비</span>
            <span>{formatCurrency(contractPaymentDetail.maintenanceFee)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">청소비</span>
            <span>{formatCurrency(contractPaymentDetail.cleaningFee)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">보증금</span>
            <span>{formatCurrency(contractPaymentDetail.deposit)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">플랫폼 수수료 (게스트 부담)</span>
            <span>{formatCurrency(contractPaymentDetail.platformFee)}</span>
          </div>
          <div className="flex justify-between py-2 pt-3">
            <span className="font-semibold">최종 결제금액</span>
            <span className="font-bold text-lg">{formatCurrency(contractPaymentDetail.finalTotalAmount)}</span>
          </div>
        </div>
      </Card>

      {/* 렌탈 주문 */}
      {rentalOrders.length > 0 && (
        <Card>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">렌탈 주문</h2>
            <span className="text-sm text-gray-500">
              합계: <span className="font-semibold text-gray-800">{formatCurrency(rentalOrdersTotalPaid)}</span>
            </span>
          </div>
          <div className="space-y-4">
            {rentalOrders.map((order) => (
              <div key={order.orderId} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <span className="font-medium text-sm">{order.orderTypeLabel}</span>
                    <span className="ml-2 text-xs text-gray-400 font-mono">{order.orderId}</span>
                    <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{order.status}</span>
                  </div>
                  <div className="text-right text-sm">
                    <div className="font-semibold">{formatCurrency(order.paidAmount)}</div>
                    {order.refundedAmount > 0 && (
                      <div className="text-xs text-red-500">환불 -{formatCurrency(order.refundedAmount)}</div>
                    )}
                  </div>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                      <th className="pb-1.5 font-medium">품목</th>
                      <th className="pb-1.5 font-medium text-right">수량</th>
                      <th className="pb-1.5 font-medium text-right">단가</th>
                      <th className="pb-1.5 font-medium text-right">합계</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items.map((item) => (
                      <tr key={item.id} className="border-b border-gray-50 last:border-0">
                        <td className="py-1.5">{item.itemName}</td>
                        <td className="py-1.5 text-right text-gray-600">{item.quantity}</td>
                        <td className="py-1.5 text-right text-gray-600">{formatCurrency(item.unitPrice)}</td>
                        <td className="py-1.5 text-right">{formatCurrency(item.totalPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
