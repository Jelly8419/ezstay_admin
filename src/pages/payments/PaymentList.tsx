import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type {
  PaymentSummaryItem,
  PaymentLog,
  PaymentMethod,
  PaymentTransactionType,
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

const getMethodLabel = (method: string) => {
  const map: Record<string, string> = {
    CARD: '신용카드',
    CREDIT_CARD: '신용카드',
    VIRTUAL_ACCOUNT: '가상계좌',
    TRANSFER: '계좌이체',
    MOBILE: '휴대폰',
    EASY_PAY: '간편결제',
    ORIGINAL_PAYMENT: '원결제수단',
    '카드': '카드',
    '가상계좌': '가상계좌',
    '계좌이체': '계좌이체',
    '휴대폰': '휴대폰',
    '간편결제': '간편결제',
  };
  return map[method] || method;
};

const getMethodBadge = (method: string) => {
  const colorMap: Record<string, string> = {
    CARD: 'bg-blue-100 text-blue-800',
    CREDIT_CARD: 'bg-blue-100 text-blue-800',
    EASY_PAY: 'bg-yellow-100 text-yellow-800',
    VIRTUAL_ACCOUNT: 'bg-green-100 text-green-800',
    TRANSFER: 'bg-green-100 text-green-800',
    MOBILE: 'bg-purple-100 text-purple-800',
  };
  const cls = colorMap[method] || 'bg-gray-100 text-gray-800';
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${cls}`}>
      {getMethodLabel(method)}
    </span>
  );
};

const getProductTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    contract: '계약',
    rental: '렌탈',
    contract_rental: '계약/렌탈',
    penalty: '위약금',
    deposit_refund: '보증금 환급',
  };
  return map[type] || type;
};

const getTransactionTypeBadge = (type: PaymentTransactionType | string) => {
  const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'default'; label: string }> = {
    PAYMENT_COMPLETED: { variant: 'success', label: '결제완료' },
    PARTIAL_CANCEL: { variant: 'warning', label: '부분취소' },
    FULL_CANCEL: { variant: 'danger', label: '전체취소' },
    '결제완료': { variant: 'success', label: '결제완료' },
    '부분취소': { variant: 'warning', label: '부분취소' },
    '전체취소': { variant: 'danger', label: '전체취소' },
  };
  const config = map[type] || { variant: 'default' as const, label: type };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getUserTypeBadge = (userType: string) => {
  if (userType === 'host') return <Badge variant="info">호스트</Badge>;
  return <Badge variant="success">게스트</Badge>;
};

const getProductTypeBadge = (type: string) => {
  const map: Record<string, { variant: 'default' | 'info' | 'warning' | 'danger'; label: string }> = {
    contract: { variant: 'default', label: '계약' },
    rental: { variant: 'info', label: '렌탈' },
    contract_rental: { variant: 'warning', label: '계약/렌탈' },
    penalty: { variant: 'danger', label: '위약금' },
    deposit_refund: { variant: 'info', label: '보증금 환급' },
  };
  const config = map[type] || { variant: 'default' as const, label: type };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

const getContractStatusBadge = (status: string) => {
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
      setPayments(response.payments || []);
      setPagination(response.pagination || null);
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
      key: 'contractId',
      title: '계약ID',
      render: (value: string) => (
        <span className="font-mono text-sm">{value || '-'}</span>
      ),
      width: '9%',
    },
    {
      key: 'paidAt',
      title: '결제일시',
      render: (value: string | null) => (
        <span className="text-sm">{value ? formatDateTime(value) : '-'}</span>
      ),
      width: '10%',
    },
    {
      key: 'productType',
      title: '상품 구분',
      render: (value: string) => getProductTypeBadge(value),
      width: '7%',
    },
    {
      key: 'roomName',
      title: '방 이름',
      render: (value: string) => (
        <span className="text-sm truncate block max-w-[140px]" title={value}>
          {value || '-'}
        </span>
      ),
      width: '10%',
    },
    {
      key: 'userName',
      title: '이름',
      render: (value: string, record: PaymentSummaryItem) => (
        <span className="text-sm">{value || record.guest?.name || '-'}</span>
      ),
      width: '7%',
    },
    {
      key: 'userType',
      title: '유저 구분',
      render: (value: string) => getUserTypeBadge(value),
      width: '6%',
    },
    {
      key: 'totalPaidAmount',
      title: '총 결제금액',
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
      width: '9%',
    },
    {
      key: 'totalRefundedAmount',
      title: '총 환불금액',
      render: (value: number) => (
        <span className={value > 0 ? 'text-red-600' : ''}>
          {value > 0 ? formatCurrency(value) : '0'}
        </span>
      ),
      width: '9%',
    },
    {
      key: 'currentBalance',
      title: '현재 잔액',
      render: (value: number) => (
        <span className={`font-semibold ${value < 0 ? 'text-red-600' : ''}`}>
          {formatCurrency(value)}
        </span>
      ),
      width: '9%',
    },
    {
      key: 'paymentMethod',
      title: '결제수단',
      render: (value: string) => getMethodBadge(value),
      width: '7%',
    },
    {
      key: 'contractStatus',
      title: '계약상태',
      render: (value: string) => getContractStatusBadge(value),
      width: '9%',
    },
    {
      key: 'actions',
      title: '',
      render: (_: any, record: PaymentSummaryItem) => (
        <Link to={`/payments/${record.contractId}`}>
          <Button variant="secondary" size="sm">상세</Button>
        </Link>
      ),
      width: '5%',
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
      setLogs(response.logs || []);
      setPagination(response.pagination || null);
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

  const getLogProductTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      contract: '계약',
      contract_option: '계약/옵션',
      option: '옵션',
      host_cancel_penalty: '호스트 취소 위약금',
      guest_cancel: '게스트 취소',
      deposit_refund: '보증금 환급',
      rental: '렌탈',
      penalty: '위약금',
    };
    return map[type] || getProductTypeLabel(type);
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
      render: (value: string) => getMethodBadge(value),
      width: '9%',
    },
    {
      key: 'productType',
      title: '상품 구분',
      render: (value: string) => (
        <span className="text-sm">{getLogProductTypeLabel(value)}</span>
      ),
      width: '12%',
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
  const [activeTab, setActiveTab] = useState<TabType>('orders');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'orders', label: '계약별 결제 현황' },
    { key: 'logs', label: '결제/취소 내역' },
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
