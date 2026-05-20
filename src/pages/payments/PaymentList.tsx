import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import type {
  PaymentSummaryItem,
  PaymentLog,
  Pagination as PaginationType,
  PaymentSourceFilter,
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

/** 상품구분 뱃지 (API가 한글로 내려줌: 계약, 렌탈, 청소 등) */
const getProductTypeBadge = (type: string) => {
  const map: Record<string, 'default' | 'info' | 'warning' | 'danger' | 'success'> = {
    '계약': 'default',
    '렌탈': 'info',
    '위약금': 'danger',
    '보증금 환급': 'info',
    '호스트부담금': 'warning',
    // 입주 준비
    '청소': 'success',
    '입주용품': 'info',
    '침구류대여': 'info',
    '입주용품+침구류': 'info',
  };
  return <Badge variant={map[type] || 'default'}>{type}</Badge>;
};

// ── 도메인 필터 옵션 ──

const SOURCE_OPTIONS: { value: PaymentSourceFilter; label: string }[] = [
  { value: 'all',      label: '전체 도메인' },
  { value: 'internal', label: '내부 계약' },
  { value: 'move_in',  label: '입주 준비' },
];

// 도메인별 productType 옵션
const INTERNAL_PRODUCT_OPTIONS = [
  { value: '', label: '상품 전체' },
  { value: '계약', label: '계약' },
  { value: '렌탈', label: '렌탈' },
  { value: '보증금 환급', label: '보증금 환급' },
  { value: '호스트부담금', label: '호스트부담금' },
];

const MOVE_IN_PRODUCT_OPTIONS = [
  { value: '', label: '상품 전체' },
  { value: '청소', label: '청소' },
  { value: '입주용품', label: '입주용품' },
  { value: '침구류대여', label: '침구류대여' },
  { value: '입주용품+침구류', label: '입주용품+침구류' },
];

const ALL_PRODUCT_OPTIONS = [
  { value: '', label: '상품 전체' },
  ...INTERNAL_PRODUCT_OPTIONS.slice(1),
  ...MOVE_IN_PRODUCT_OPTIONS.slice(1),
];

function productOptionsFor(source: PaymentSourceFilter) {
  if (source === 'internal') return INTERNAL_PRODUCT_OPTIONS;
  if (source === 'move_in') return MOVE_IN_PRODUCT_OPTIONS;
  return ALL_PRODUCT_OPTIONS;
}

/** 결제유형 뱃지 (paymentType: CONTRACT | HOST_BURDEN) */
const getPaymentTypeBadge = (paymentType?: string) => {
  if (paymentType === 'HOST_BURDEN') return <Badge variant="warning">호스트부담</Badge>;
  return null;
};

/**
 * 결제/취소 내역(logs) 행의 productType 으로부터 rowType 추정.
 * logs 응답은 rowType 필드가 없으므로 한글 productType 으로 분기.
 */
function inferRowTypeFromLog(record: PaymentLog): string {
  if (record.productType === '청소') return 'MOVE_IN_CLEANING';
  if (
    record.productType === '입주용품' ||
    record.productType === '침구류대여' ||
    record.productType === '입주용품+침구류'
  ) {
    return 'MOVE_IN_GUEST_ORDER';
  }
  return 'CONTRACT';
}

/**
 * rowType 별 상세 페이지 링크 생성.
 * - CONTRACT          → /payments/:orderId?type=contract
 * - RENTAL            → /payments/:rentalOrderId?type=rental
 * - MOVE_IN_CLEANING  → /payments/move-in-cleaning/:moveInCaseId
 * - MOVE_IN_GUEST_ORDER → /rental-orders?domain=move-in&openOrder=:orderId
 * 필요한 식별자가 응답에 없으면 null 반환 (호출부에서 상세 버튼 숨김).
 */
function buildDetailLink(
  row: { rowType?: string; orderId?: string; rentalOrderId?: string | null; moveInCaseId?: number | null },
  from: 'orders' | 'logs'
): string | null {
  switch (row.rowType) {
    case 'RENTAL':
      return row.rentalOrderId
        ? `/payments/${row.rentalOrderId}?type=rental&from=${from}`
        : null;
    case 'MOVE_IN_CLEANING':
      return row.moveInCaseId != null
        ? `/payments/move-in-cleaning/${row.moveInCaseId}?from=${from}`
        : null;
    case 'MOVE_IN_GUEST_ORDER':
      return row.orderId
        ? `/rental-orders?domain=move-in&openOrder=${encodeURIComponent(row.orderId)}`
        : null;
    case 'CONTRACT':
    default:
      return row.orderId
        ? `/payments/${row.orderId}?type=contract&from=${from}`
        : null;
  }
}

// ── 탭1: 주문별 결제 현황 ──

interface SubTabProps {
  source: PaymentSourceFilter;
}

function OrderPaymentTab({ source }: SubTabProps) {
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
        source,
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

  // source 변경 시 페이지/상품필터 리셋 후 재로드
  useEffect(() => {
    setCurrentPage(1);
    setProductTypeFilter('');
  }, [source]);

  useEffect(() => {
    loadPayments();
  }, [currentPage, source]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadPayments();
  };

  const columns = [
    {
      key: 'orderId',
      title: '주문번호',
      render: (value: string, record: PaymentSummaryItem) => (
        <div className="font-mono text-sm space-y-0.5">
          <div>{value || '-'}</div>
          {record.pgOrderNo && (
            <div className="text-xs text-gray-400">PG: {record.pgOrderNo}</div>
          )}
        </div>
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
        const to = buildDetailLink(record, 'orders');
        if (!to) {
          return <span className="text-xs text-gray-400">-</span>;
        }
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
                {productOptionsFor(source).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
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

function PaymentLogTab({ source }: SubTabProps) {
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
        source,
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

  // source 변경 시 페이지/상품필터 리셋 후 재로드
  useEffect(() => {
    setCurrentPage(1);
    setProductTypeFilter('');
  }, [source]);

  useEffect(() => {
    loadLogs();
  }, [currentPage, source]);

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
      render: (value: string, record: PaymentLog) => {
        const display = record.rentalOrderId || value || '-';
        const to = buildDetailLink(
          {
            rowType: record.rentalOrderId ? 'RENTAL' : inferRowTypeFromLog(record),
            orderId: value,
            rentalOrderId: record.rentalOrderId,
            moveInCaseId: record.moveInCaseId,
          },
          'logs'
        );
        return (
          <div className="font-mono text-sm space-y-0.5">
            {to ? (
              <Link to={to} className="text-primary-600 hover:underline">{display}</Link>
            ) : (
              <div>{display}</div>
            )}
            {record.pgOrderNo && (
              <div className="text-xs text-gray-400">PG: {record.pgOrderNo}</div>
            )}
          </div>
        );
      },
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
                {productOptionsFor(source).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
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
  const [sourceFilter, setSourceFilter] = useState<PaymentSourceFilter>('all');

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

      {/* 도메인 필터 (양 탭 공통) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-gray-700">도메인</span>
        <div className="inline-flex bg-gray-100 rounded-lg p-1">
          {SOURCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSourceFilter(opt.value)}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                sourceFilter === opt.value
                  ? 'bg-white shadow text-gray-900 font-medium'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      {activeTab === 'orders' ? (
        <OrderPaymentTab source={sourceFilter} />
      ) : (
        <PaymentLogTab source={sourceFilter} />
      )}
    </div>
  );
}
