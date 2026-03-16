import { Link } from 'react-router-dom';
import type { Contract, ContractStatus } from '../../types/roomManagement';

interface ContractHistoryProps {
  contracts: Contract[];
}

const getStatusInfo = (
  status: ContractStatus
): { label: string; className: string } => {
  const map: Record<string, { label: string; className: string }> = {
    PENDING_APPROVAL: { label: '계약 요청', className: 'bg-yellow-100 text-yellow-800' },
    APPROVED: { label: '계약 승인(결제 대기)', className: 'bg-blue-100 text-blue-800' },
    REJECTED: { label: '계약 거절', className: 'bg-red-100 text-red-800' },
    PAYMENT_COMPLETED: { label: '결제 완료', className: 'bg-green-100 text-green-800' },
    IN_PROGRESS: { label: '임대 중', className: 'bg-blue-100 text-blue-800' },
    COMPLETED: { label: '계약 종료', className: 'bg-gray-100 text-gray-800' },
    CANCELLED_BY_GUEST: { label: '게스트 취소', className: 'bg-red-100 text-red-800' },
    CANCELLED_BY_HOST: { label: '호스트 취소', className: 'bg-red-100 text-red-800' },
    CANCELLED_BY_ADMIN_WITH_REFUND: { label: '관리자 취소(환불)', className: 'bg-red-100 text-red-800' },
    CANCELLED_BY_ADMIN_NO_REFUND: { label: '관리자 취소(미환불)', className: 'bg-red-100 text-red-800' },
    REFUNDED: { label: '환불', className: 'bg-purple-100 text-purple-800' },
    APPROVAL_EXPIRED: { label: '승인 만료', className: 'bg-gray-100 text-gray-800' },
    PAYMENT_EXPIRED: { label: '결제 만료', className: 'bg-gray-100 text-gray-800' },
    CANCEL_REQUESTED: { label: '요청 취소', className: 'bg-yellow-100 text-yellow-800' },
  };
  return map[status] || { label: status, className: 'bg-gray-100 text-gray-800' };
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
  }).format(amount);
};

export default function ContractHistory({ contracts }: ContractHistoryProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">계약 정보</h3>

      {contracts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          계약 내역이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계약 번호
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  게스트 이름
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계약 상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  계약 기간
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  결제 금액
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">

                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contracts.map((contract) => {
                const statusInfo = getStatusInfo(contract.status);
                return (
                  <tr key={contract.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {contract.id}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {contract.guestName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatDate(contract.checkInDate)} ~{' '}
                      {formatDate(contract.checkOutDate)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                      {formatCurrency(contract.totalAmount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm">
                      <Link
                        to={`/admin/reservations/${contract.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        보기
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
