import { useSearchParams } from 'react-router-dom';
import MoveInCaseList from './MoveInCaseList';
import MoveInRefundList from '../move-in-refunds/MoveInRefundList';
import MoveInGuestOrderList from '../move-in-orders/MoveInGuestOrderList';
import MoveInPaymentList from '../move-in-payments/MoveInPaymentList';

type TabKey = 'cases' | 'refunds' | 'orders' | 'payments';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'cases', label: '케이스 목록' },
  { key: 'refunds', label: '반품 요청' },
  { key: 'orders', label: '임차인 주문·환불 관리' },
  { key: 'payments', label: '결제 내역' },
];

function resolveTab(param: string | null): TabKey {
  if (param === 'refunds' || param === 'orders' || param === 'payments')
    return param;
  return 'cases';
}

export default function MoveInServicePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = resolveTab(searchParams.get('tab'));

  const handleTabChange = (tab: TabKey) => {
    if (tab === 'cases') {
      // 기본 탭은 쿼리에서 제거해 URL 깔끔하게 유지
      searchParams.delete('tab');
    } else {
      searchParams.set('tab', tab);
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">입주 준비 서비스</h1>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'cases' && <MoveInCaseList />}
      {activeTab === 'refunds' && <MoveInRefundList />}
      {activeTab === 'orders' && <MoveInGuestOrderList />}
      {activeTab === 'payments' && <MoveInPaymentList />}
    </div>
  );
}
