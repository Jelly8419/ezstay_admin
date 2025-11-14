import { Link } from 'react-router-dom';
import type { Contract, ContractStatus } from '../../types/roomManagement';

interface ContractHistoryProps {
  contracts: Contract[];
}

const getStatusInfo = (
  status: ContractStatus
): { label: string; className: string } => {
  switch (status) {
    case 'IN_PROGRESS':
      return {
        label: '입실 중',
        className: 'bg-blue-100 text-blue-800',
      };
    case 'COMPLETED':
      return {
        label: '계약 종료',
        className: 'bg-gray-100 text-gray-800',
      };
    case 'CANCELLED':
      return {
        label: '취소됨',
        className: 'bg-red-100 text-red-800',
      };
    default:
      return {
        label: status,
        className: 'bg-gray-100 text-gray-800',
      };
  }
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
