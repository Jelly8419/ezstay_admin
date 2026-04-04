import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type {
  PaymentSummaryItem,
  PaymentLog,
  Pagination as PaginationType,
} from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { paymentService } from '../../services/paymentService';

// ── 공통 유틸 ──

/** 결제수단 한글 변환 (API 가이드 v2 기준) */
const formatPaymentMethod = (method: string, easyPayProvider?: string | null): string => {
  if (method === 'EASY_PAY' && easyPayProvider) {
    const labels: Record<string, string> = { KAKAO: '카카오페이', NAVER: '네이버페이', PAYCO: '페이코' };
    return labels[easyPayProvider] ?? '간편결제';
  }
  const labels: Record<string, string> = {
    CARD: '신용카드',
    CREDIT_CARD: '신용카드',
    VIRTUAL_ACCOUNT: '가상계좌',
    TRANSFER: '계좌이체',
    MOBILE: '휴대폰',
    EASY_PAY: '간편결제',
    ORIGINAL_PAYMENT: '원결제수단',
  };
  return labels[method] ?? method;
};

/** 결제수단 뱃지 */
const getMethodBadge = (method: string, easyPayProvider?: string | null) => {
  const display = formatPaymentMethod(method, easyPayProvider);
  const isEasyPay = method === 'EASY_PAY';
  const isCard = method === 'CARD' || method === 'CREDIT_CARD';
  const cls = isEasyPay
    ? 'bg-purple-100 text-purple-800'
    : isCard
    ? 'bg-blue-100 text-blue-800'
    : 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}>
      {display}
    </span>
  );
};

/** 거래유형 뱃지 (API가 한글로 내려줌: 결제완료, 부분취소, 전체취소) */
const getTransactionTypeBadge = (type: string) => {
  const map: Record<string, 'success' | 'warning' | 'danger'> = {
    '결제완료': 'success',
    '부분취소': 'warning',
    '전체취소': 'danger',
  };
  return <Badge variant={map[type] || 'default'}>{type}</Badge>;
};

/** 유저구분 뱃지 (API가 한글로 내려줌: 게스트, 호스트) */
const getUserTypeBadge = (userType: string) => {
  if (userType === 'host' || userType === '호스트') return <Badge variant="info">호스트</Badge>;
  return <Badge variant="success">게스트</Badge>;
};

/** 상품구분 뱃지 (API가 한글로 내려줌: 계약, 렌탈 등) */
const getProductTypeBadge = (type: string) => {
  const map: Record<string, 'default' | 'info' | 'warning' | 'danger'> = {
    '계약': 'default',
    '렌탈': 'info',
    '위약금': 'danger',
    '보증금 환급': 'info',
    '호스트부담금': 'warning',
  };
  return <Badge variant={map[type] || 'default'}>{type}</Badge>;
};

/** 결제유형 뱃지 (paymentType: CONTRACT | HOST_BURDEN) */
const getPaymentTypeBadge = (paymentType?: string) => {
  if (paymentType === 'HOST_BURDEN') return <Badge variant="warning">호스트부담</Badge>;
  return null;
};

// ── 탭1: 주문별 결제 현황 ──

function OrderPaymentTab() {
  const [payments, setPayments] = useState<PaymentSummaryItem[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPayments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getPaymentSummary({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(productTypeFilter && { productType: productTypeFilter }),
      });
      const data = response as any;
      setPayments(data.payments || data.logs || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error('결제 목록 로드 실패:', err);
      setError('결제 목록을 불러오는데 실패했습니다.');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadPayments();
  };

  const columns = [
    {
      key: 'orderId',
      title: '주문번호',
      render: (value: string) => (
        <span className="font-mono text-sm">{value || '-'}</span>
      ),
      width: '12%',
    },
    {
      key: 'paidAt',
      title: '결제일시',
      render: (value: string | null) => (
        <span className="text-sm">{value ? formatDateTime(value) : '-'}</span>
      ),
      width: '12%',
    },
    {
      key: 'userName',
      title: '이름',
      render: (value: string, record: PaymentSummaryItem) => (
        <span className="text-sm">{value || record.guest?.name || '-'}</span>
      ),
      width: '8%',
    },
    {
      key: 'roomName',
      title: '방 이름',
      render: (value: string) => (
        <span className="text-sm truncate block max-w-[160px]" title={value}>
          {value || '-'}
        </span>
      ),
      width: '14%',
    },
    {
      key: 'productType',
      title: '구분',
      render: (value: string, record: PaymentSummaryItem) => (
        <div className="flex items-center gap-1">
          {getProductTypeBadge(value)}
          {record.rowType === 'RENTAL' && (
            <Badge variant="info" className="text-xs">추가결제</Badge>
          )}
        </div>
      ),
      width: '12%',
    },
    {
      key: 'paidAmount',
      title: '결제금액',
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
      width: '10%',
    },
    {
      key: 'refundedAmount',
      title: '환불누적금액',
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-600 font-semibold' : ''}>
          {value > 0 ? formatCurrency(value) : '0'}
        </span>
      ),
      width: '10%',
    },
    {
      key: 'currentBalance',
      title: '현재 유지금액',
      render: (value: number) => (
        <span className={`font-semibold ${value < 0 ? 'text-red-600' : ''}`}>
          {formatCurrency(value)}
        </span>
      ),
      width: '10%',
    },
    {
      key: 'paymentMethod',
      title: '결제수단',
      render: (value: string, record: PaymentSummaryItem) => getMethodBadge(value, record.easyPayProvider),
      width: '8%',
    },
    {
      key: 'paymentStatus',
      title: '결제상태',
      render: (value: string) => (
        <span className="text-xs text-gray-700">{value || '-'}</span>
      ),
      width: '8%',
    },
    {
      key: 'actions',
      title: '',
      render: (_: any, record: PaymentSummaryItem) => {
        const to = record.rowType === 'RENTAL'
          ? `/payments/${record.rentalOrderId}?type=rental&from=orders`
          : `/payments/${record.orderId}?type=contract&from=orders`;
        return (
          <Link to={to}>
            <Button variant="secondary" size="sm">상세</Button>
          </Link>
        );
      },
      width: '7%',
    },
  ];

  return (
    <>
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">기간:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <select
                value={productTypeFilter}
                onChange={(e) => {
                  setProductTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">상품 전체</option>
                <option value="contract">계약</option>
                <option value="rental">렌탈</option>
                <option value="contract_rental">계약/렌탈</option>
                <option value="penalty">위약금</option>
              </select>
            </div>
            <div className="flex-1 min-w-[250px]">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                placeholder="계약번호 / 이름 / 010-1234-5678 검색"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            총 {pagination?.total ?? payments.length}건
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadPayments}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={payments} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
}

// ── 탭2: 결제/취소 내역 ──

function PaymentLogTab() {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [transactionTypeFilter, setTransactionTypeFilter] = useState('');
  const [productTypeFilter, setProductTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await paymentService.getPaymentLogs({
        page: currentPage,
        limit: 20,
        ...(searchTerm && { search: searchTerm }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(transactionTypeFilter && { transactionType: transactionTypeFilter }),
        ...(productTypeFilter && { productType: productTypeFilter }),
      });
      const data = response as any;
      setLogs(data.logs || data.payments || []);
      setPagination(data.pagination || null);
    } catch (err) {
      console.error('결제 로그 로드 실패:', err);
      setError('결제/취소 내역을 불러오는데 실패했습니다.');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [currentPage]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadLogs();
  };

  const columns = [
    {
      key: 'occurredAt',
      title: '발생 일시',
      render: (value: string) => (
        <span className="text-sm">{formatDateTime(value)}</span>
      ),
      width: '12%',
    },
    {
      key: 'transactionType',
      title: '거래 유형',
      render: (value: string) => getTransactionTypeBadge(value),
      width: '9%',
    },
    {
      key: 'paymentMethod',
      title: '결제 수단',
      render: (value: string, record: PaymentLog) => getMethodBadge(value, record.easyPayProvider),
      width: '9%',
    },
    {
      key: 'productType',
      title: '상품 구분',
      render: (value: string, record: PaymentLog) => (
        <div className="flex items-center gap-1">
          {getProductTypeBadge(value)}
          {getPaymentTypeBadge(record.paymentType)}
        </div>
      ),
      width: '14%',
    },
    {
      key: 'amount',
      title: '금액',
      render: (value: number) => {
        const isNegative = value < 0;
        return (
          <span className={`font-semibold ${isNegative ? 'text-red-600' : ''}`}>
            {isNegative ? '' : '+'}{formatCurrency(value)}
          </span>
        );
      },
      width: '10%',
    },
    {
      key: 'orderId',
      title: '주문번호',
      render: (value: string) => (
        <span className="font-mono text-sm">{value || '-'}</span>
      ),
      width: '10%',
    },
    {
      key: 'userName',
      title: '이름',
      render: (value: string) => value || '-',
      width: '8%',
    },
    {
      key: 'userType',
      title: '유저 구분',
      render: (value: string) => getUserTypeBadge(value),
      width: '7%',
    },
    {
      key: 'roomName',
      title: '방 이름',
      render: (value: string) => (
        <span className="text-sm truncate block max-w-[120px]" title={value}>
          {value || '-'}
        </span>
      ),
      width: '10%',
    },
  ];

  return (
    <>
      <Card>
        <div className="space-y-4">
          <div className="flex gap-4 items-end flex-wrap">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">기간:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
              <span className="text-gray-400">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            <div>
              <select
                value={transactionTypeFilter}
                onChange={(e) => {
                  setTransactionTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">거래유형 전체</option>
                <option value="PAYMENT_COMPLETED">결제완료</option>
                <option value="PARTIAL_CANCEL">부분취소</option>
                <option value="FULL_CANCEL">전체취소</option>
              </select>
            </div>
            <div>
              <select
                value={productTypeFilter}
                onChange={(e) => {
                  setProductTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">상품 전체</option>
                <option value="contract">계약</option>
                <option value="rental">렌탈</option>
                <option value="deposit_refund">보증금 환급</option>
                <option value="penalty">위약금</option>
              </select>
            </div>
            <div className="flex-1 min-w-[250px]">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                placeholder="주문번호 / 이름 / 010-1234-5678 검색"
              />
            </div>
          </div>
          <div className="text-sm text-gray-600">
            총 {pagination?.total ?? logs.length}건
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadLogs}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={logs} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </>
  );
}

// ── 메인 ──

type TabType = 'orders' | 'logs';

export default function PaymentList() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'orders' ? 'orders' : 'logs';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const tabs: { key: TabType; label: string }[] = [
    { key: 'logs', label: '결제/취소 내역' },
    { key: 'orders', label: '주문별 결제 현황' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">결제 관리</h1>

      {/* 탭 네비게이션 */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8" aria-label="결제 관리 탭">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
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

      {/* 탭 컨텐츠 */}
      {activeTab === 'orders' ? <OrderPaymentTab /> : <PaymentLogTab />}
    </div>
  );
}
