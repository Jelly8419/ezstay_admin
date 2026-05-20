import { useSearchParams } from 'react-router-dom';
import RentalOrderList from './RentalOrderList';
import RentalRefundList from '../rental-refund-requests/RentalRefundList';
import RentalItemList from '../rental-items/RentalItemList';
import MoveInGuestOrderList from '../move-in-orders/MoveInGuestOrderList';
import MoveInRefundList from '../move-in-refunds/MoveInRefundList';

type DomainKey = 'internal' | 'move-in';
type InternalTab = 'orders' | 'refunds' | 'items';
type MoveInTab = 'orders' | 'refunds';

const DOMAINS: { key: DomainKey; label: string }[] = [
  { key: 'internal', label: '내부 계약' },
  { key: 'move-in',  label: '입주 준비' },
];

const INTERNAL_TABS: { key: InternalTab; label: string }[] = [
  { key: 'orders',  label: '배송 상태 관리' },
  { key: 'refunds', label: '환불 요청 관리' },
  { key: 'items',   label: '재고 관리' },
];

const MOVE_IN_TABS: { key: MoveInTab; label: string }[] = [
  { key: 'orders',  label: '주문 관리' },
  { key: 'refunds', label: '반품 요청 관리' },
];

function resolveDomain(value: string | null): DomainKey {
  return value === 'move-in' ? 'move-in' : 'internal';
}

function resolveInternalTab(value: string | null): InternalTab {
  if (value === 'refunds' || value === 'items') return value;
  return 'orders';
}

function resolveMoveInTab(value: string | null): MoveInTab {
  if (value === 'refunds') return value;
  return 'orders';
}

export default function RentalOptionPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const domain = resolveDomain(searchParams.get('domain'));
  const internalTab = resolveInternalTab(searchParams.get('tab'));
  const moveInTab = resolveMoveInTab(searchParams.get('tab'));

  const handleDomainChange = (next: DomainKey) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'internal') {
      params.delete('domain');
    } else {
      params.set('domain', next);
    }
    params.delete('tab');
    setSearchParams(params);
  };

  const handleTabChange = (next: string) => {
    const params = new URLSearchParams(searchParams);
    const isInternalDefault = domain === 'internal' && next === 'orders';
    const isMoveInDefault = domain === 'move-in' && next === 'orders';
    if (isInternalDefault || isMoveInDefault) {
      params.delete('tab');
    } else {
      params.set('tab', next);
    }
    setSearchParams(params);
  };

  const subTabs =
    domain === 'internal'
      ? INTERNAL_TABS.map((t) => ({ key: t.key, label: t.label }))
      : MOVE_IN_TABS.map((t) => ({ key: t.key, label: t.label }));
  const activeTabKey = domain === 'internal' ? internalTab : moveInTab;

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">옵션상품 관리</h1>

      {/* 1단 탭: 도메인 */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {DOMAINS.map((d) => (
            <button
              key={d.key}
              onClick={() => handleDomainChange(d.key)}
              className={`py-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                domain === d.key
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {d.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 2단 탭: 기능 */}
      <div className="flex flex-wrap gap-2">
        {subTabs.map((t) => (
          <button
            key={t.key}
            onClick={() => handleTabChange(t.key)}
            className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
              activeTabKey === t.key
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      {domain === 'internal' && internalTab === 'orders'  && <RentalOrderList />}
      {domain === 'internal' && internalTab === 'refunds' && <RentalRefundList />}
      {domain === 'internal' && internalTab === 'items'   && <RentalItemList />}
      {domain === 'move-in'  && moveInTab === 'orders'    && <MoveInGuestOrderList />}
      {domain === 'move-in'  && moveInTab === 'refunds'   && <MoveInRefundList />}
    </div>
  );
}
