import { useState, useEffect } from 'react';
import type { Receipt, ReceiptType, ReceiptUserType, ReceiptTargetType } from '../../types';
import { formatDateTime, formatCurrency } from '../../utils/format';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { receiptService } from '../../services/receiptService';
import type { ReceiptPagination } from '../../services/receiptService';
import ReceiptDetailModal from './ReceiptDetailModal';

type TabType = 'pending' | 'history';

const receiptTypeLabels: Record<ReceiptType, string> = {
  personal: '개인소득공제용',
  business: '사업자증빙용',
  tax_invoice: '전자세금계산서',
};

const targetTypeLabels: Record<ReceiptTargetType, string> = {
  CONTRACT_FEE: '플랫폼 계약 수수료',
  HOST_CANCEL_FEE: '호스트 취소 수수료',
  GUEST_CANCEL_FEE: '게스트 취소 위약금',
  OPTION_SALE: '플랫폼 옵션 상품',
};

const userTypeLabels: Record<ReceiptUserType, string> = {
  HOST: '호스트',
  GUEST: '게스트',
};

const tabs: { key: TabType; label: string }[] = [
  { key: 'pending', label: '발급 대기' },
  { key: 'history', label: '발급 이력' },
];

export default function ReceiptList() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pagination, setPagination] = useState<ReceiptPagination | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // 필터
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [receiptTypeFilter, setReceiptTypeFilter] = useState('');
  const [targetTypeFilter, setTargetTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // 상세 모달
  const [selectedReceiptId, setSelectedReceiptId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const itemsPerPage = 20;

  const resetFilters = () => {
    setSearchTerm('');
    setUserTypeFilter('');
    setReceiptTypeFilter('');
    setTargetTypeFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);

      const commonParams = {
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(userTypeFilter && { userType: userTypeFilter }),
        ...(receiptTypeFilter && { receiptType: receiptTypeFilter }),
        ...(targetTypeFilter && { targetType: targetTypeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      };

      let response;
      if (activeTab === 'pending') {
        response = await receiptService.getReceipts({ ...commonParams, status: 'PENDING' });
      } else {
        response = await receiptService.getReceiptHistory(commonParams);
      }

      setReceipts(response.receipts || []);
      setPagination(response.pagination || null);
    } catch {
      setError('영수증 목록을 불러오는데 실패했습니다.');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [currentPage, activeTab, userTypeFilter, receiptTypeFilter, targetTypeFilter, startDate, endDate]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    resetFilters();
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadReceipts();
  };

  const handleIssue = async (id: number) => {
    if (!confirm('영수증을 발급 처리하시겠습니까?')) return;
    try {
      setActionLoading(id);
      await receiptService.issueReceipt(id);
      alert('영수증이 발급 처리되었습니다.');
      loadReceipts();
    } catch {
      alert('발급 처리에 실패했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportCsv = async () => {
    try {
      await receiptService.exportCsv({
        ...(searchTerm && { search: searchTerm }),
        ...(userTypeFilter && { userType: userTypeFilter }),
        ...(receiptTypeFilter && { receiptType: receiptTypeFilter }),
        ...(targetTypeFilter && { targetType: targetTypeFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
        ...(activeTab === 'pending' && { status: 'PENDING' }),
        ...(activeTab === 'history' && { status: 'ISSUED' }),
      });
    } catch {
      alert('CSV 다운로드에 실패했습니다.');
    }
  };

  const openDetail = (id: number) => {
    setSelectedReceiptId(id);
    setDetailOpen(true);
  };

  const pendingColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: number) => (
        <button className="text-blue-600 hover:underline" onClick={() => openDetail(value)}>
          #{value}
        </button>
      ),
      width: '5%',
    },
    {
      key: 'userType',
      title: '사용자 유형',
      render: (value: ReceiptUserType) => (
        <Badge variant={value === 'HOST' ? 'info' : 'secondary'}>{userTypeLabels[value]}</Badge>
      ),
      width: '9%',
    },
    {
      key: 'userName',
      title: '사용자',
      render: (_: any, r: Receipt) => (
        <button className="text-left hover:text-blue-600" onClick={() => openDetail(r.id)}>
          <p className="font-medium text-gray-900">{r.userName}</p>
          <p className="text-xs text-gray-500">ID: {r.userId}</p>
        </button>
      ),
      width: '12%',
    },
    {
      key: 'orderId',
      title: '주문번호',
      render: (value: string) => <span className="text-sm font-mono">{value}</span>,
      width: '13%',
    },
    {
      key: 'receiptType',
      title: '영수증 종류',
      render: (value: ReceiptType) => <span className="text-sm">{receiptTypeLabels[value]}</span>,
      width: '11%',
    },
    {
      key: 'targetType',
      title: '발급 유형',
      render: (value: ReceiptTargetType) => <span className="text-sm">{targetTypeLabels[value]}</span>,
      width: '13%',
    },
    {
      key: 'amount',
      title: '금액',
      render: (value: number) => <span className="font-medium">{formatCurrency(value)}</span>,
      width: '10%',
    },
    {
      key: 'date',
      title: '날짜',
      width: '9%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, r: Receipt) => (
        <Button
          size="sm"
          variant="primary"
          onClick={() => handleIssue(r.id)}
          disabled={actionLoading === r.id}
        >
          {actionLoading === r.id ? '처리중...' : '발급'}
        </Button>
      ),
      width: '8%',
    },
  ];

  const historyColumns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: number) => (
        <button className="text-blue-600 hover:underline" onClick={() => openDetail(value)}>
          #{value}
        </button>
      ),
      width: '5%',
    },
    {
      key: 'userType',
      title: '사용자 유형',
      render: (value: ReceiptUserType) => (
        <Badge variant={value === 'HOST' ? 'info' : 'secondary'}>{userTypeLabels[value]}</Badge>
      ),
      width: '9%',
    },
    {
      key: 'userName',
      title: '사용자',
      render: (_: any, r: Receipt) => (
        <button className="text-left hover:text-blue-600" onClick={() => openDetail(r.id)}>
          <p className="font-medium text-gray-900">{r.userName}</p>
          <p className="text-xs text-gray-500">ID: {r.userId}</p>
        </button>
      ),
      width: '12%',
    },
    {
      key: 'orderId',
      title: '주문번호',
      render: (value: string) => <span className="text-sm font-mono">{value}</span>,
      width: '13%',
    },
    {
      key: 'receiptType',
      title: '영수증 종류',
      render: (value: ReceiptType) => <span className="text-sm">{receiptTypeLabels[value]}</span>,
      width: '10%',
    },
    {
      key: 'targetType',
      title: '발급 유형',
      render: (value: ReceiptTargetType) => <span className="text-sm">{targetTypeLabels[value]}</span>,
      width: '12%',
    },
    {
      key: 'amount',
      title: '금액',
      render: (value: number) => <span className="font-medium">{formatCurrency(value)}</span>,
      width: '9%',
    },
    {
      key: 'issuedAt',
      title: '발급일시',
      render: (value: string | null) => value ? formatDateTime(value) : '-',
      width: '12%',
    },
    {
      key: 'issuedByAdmin',
      title: '처리자',
      render: (value: { id: number; name: string } | null) => value?.name || '-',
      width: '8%',
    },
  ];

  const columns = activeTab === 'pending' ? pendingColumns : historyColumns;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">영수증 관리</h1>
        <Button variant="secondary" onClick={handleExportCsv}>
          CSV 다운로드
        </Button>
      </div>

      {/* 탭 */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-8">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* 필터 */}
      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                placeholder="사용자명 또는 전화번호로 검색"
              />
            </div>
            <select
              value={userTypeFilter}
              onChange={(e) => { setUserTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 사용자</option>
              <option value="HOST">호스트</option>
              <option value="GUEST">게스트</option>
            </select>
            <select
              value={receiptTypeFilter}
              onChange={(e) => { setReceiptTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 종류</option>
              <option value="personal">개인소득공제용</option>
              <option value="business">사업자증빙용</option>
              <option value="tax_invoice">전자세금계산서</option>
            </select>
            <select
              value={targetTypeFilter}
              onChange={(e) => { setTargetTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 유형</option>
              <option value="CONTRACT_FEE">플랫폼 계약 수수료</option>
              <option value="HOST_CANCEL_FEE">호스트 취소 수수료</option>
              <option value="GUEST_CANCEL_FEE">게스트 취소 위약금</option>
              <option value="OPTION_SALE">플랫폼 옵션 상품</option>
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <span className="text-gray-500">~</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
            <div className="text-sm text-gray-600">
              총 {pagination?.totalCount ?? receipts.length}건
            </div>
          </div>
        </div>
      </Card>

      {/* 테이블 */}
      <Card>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={loadReceipts}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={receipts} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
      )}

      {/* 상세 모달 */}
      <ReceiptDetailModal
        receiptId={selectedReceiptId}
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        onIssued={loadReceipts}
      />
    </div>
  );
}
