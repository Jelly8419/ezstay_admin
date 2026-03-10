import { useState, useEffect } from 'react';
import type { Receipt, ReceiptType, ReceiptIssueStatus } from '../../types';
import { formatDateTime, maskPhone } from '../../utils/format';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { receiptService } from '../../services/receiptService';
import type { ReceiptPagination } from '../../services/receiptService';

const receiptTypeLabels: Record<ReceiptType, string> = {
  personal: '개인소득공제용',
  business: '사업자증빙용',
  tax_invoice: '전자세금계산서',
};

const issueStatusConfig: Record<ReceiptIssueStatus, { variant: 'warning' | 'success' | 'danger'; label: string }> = {
  requested: { variant: 'warning', label: '발급요청' },
  issued: { variant: 'success', label: '발급완료' },
  rejected: { variant: 'danger', label: '반려' },
};

export default function ReceiptList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pagination, setPagination] = useState<ReceiptPagination | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const itemsPerPage = 20;

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await receiptService.getReceipts({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { issueStatus: statusFilter }),
        ...(typeFilter && { receiptType: typeFilter }),
      });
      setReceipts(response.receipts || []);
      setPagination(response.pagination || null);
    } catch (err) {
      console.error('영수증 목록 로드 실패:', err);
      setError('영수증 목록을 불러오는데 실패했습니다.');
      setReceipts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReceipts();
  }, [currentPage, statusFilter, typeFilter]);

  const handleSearch = () => {
    setCurrentPage(1);
    loadReceipts();
  };

  const handleIssue = async (id: number) => {
    if (!confirm('영수증을 발급하시겠습니까?')) return;
    try {
      setActionLoading(id);
      await receiptService.issueReceipt(id);
      alert('영수증이 발급되었습니다.');
      loadReceipts();
    } catch (err: any) {
      alert(err?.message || '발급 실패');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('영수증 발급을 반려하시겠습니까?')) return;
    try {
      setActionLoading(id);
      await receiptService.rejectReceipt(id);
      alert('영수증이 반려되었습니다.');
      loadReceipts();
    } catch (err: any) {
      alert(err?.message || '반려 실패');
    } finally {
      setActionLoading(null);
    }
  };

  const columns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: number) => `#${value}`,
      width: '5%',
    },
    {
      key: 'hostName',
      title: '호스트',
      render: (_: any, receipt: Receipt) => (
        <div>
          <p className="font-medium text-gray-900">{receipt.hostName}</p>
          <p className="text-xs text-gray-500">{maskPhone(receipt.hostPhone)}</p>
        </div>
      ),
      width: '14%',
    },
    {
      key: 'receiptType',
      title: '영수증 종류',
      render: (value: ReceiptType | null) =>
        value ? (
          <span className="text-sm">{receiptTypeLabels[value] || value}</span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
      width: '13%',
    },
    {
      key: 'receiptNumber',
      title: '발급번호/사업자번호',
      render: (_: any, receipt: Receipt) => {
        if (receipt.receiptType === 'business' || receipt.receiptType === 'tax_invoice') {
          return (
            <div className="text-sm">
              {receipt.businessName && <p className="font-medium">{receipt.businessName}</p>}
              {receipt.repName && <p className="text-xs text-gray-500">대표: {receipt.repName}</p>}
              {receipt.receiptNumber && <p className="text-xs text-gray-500">{receipt.receiptNumber}</p>}
            </div>
          );
        }
        return <span className="text-sm">{receipt.receiptNumber || '-'}</span>;
      },
      width: '16%',
    },
    {
      key: 'issueStatus',
      title: '상태',
      render: (value: ReceiptIssueStatus) => {
        const config = issueStatusConfig[value] || { variant: 'default' as const, label: value };
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
      width: '10%',
    },
    {
      key: 'issuedAt',
      title: '발급일',
      render: (value: string | null) => value ? formatDateTime(value) : '-',
      width: '12%',
    },
    {
      key: 'createdAt',
      title: '신청일',
      render: (value: string) => formatDateTime(value),
      width: '12%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, receipt: Receipt) => (
        <div className="flex gap-2">
          {receipt.issueStatus === 'requested' && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleIssue(receipt.id)}
                disabled={actionLoading === receipt.id}
              >
                {actionLoading === receipt.id ? '처리중...' : '발급'}
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => handleReject(receipt.id)}
                disabled={actionLoading === receipt.id}
              >
                {actionLoading === receipt.id ? '처리중...' : '반려'}
              </Button>
            </>
          )}
          {receipt.issueNote && (
            <span className="text-xs text-gray-500 self-center" title={receipt.issueNote}>
              메모
            </span>
          )}
        </div>
      ),
      width: '18%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">영수증 관리</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                onSearch={handleSearch}
                placeholder="호스트명, 이메일, 전화번호로 검색"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 상태</option>
              <option value="requested">발급요청</option>
              <option value="issued">발급완료</option>
              <option value="rejected">반려</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">전체 종류</option>
              <option value="personal">개인소득공제용</option>
              <option value="business">사업자증빙용</option>
              <option value="tax_invoice">전자세금계산서</option>
            </select>
          </div>
          <div className="text-sm text-gray-600">
            총 {pagination?.totalCount ?? receipts.length}건
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
            <Button onClick={loadReceipts}>다시 시도</Button>
          </div>
        ) : (
          <Table columns={columns} data={receipts} />
        )}
      </Card>

      {pagination && pagination.totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={pagination.totalPages} onPageChange={setCurrentPage} />
      )}
    </div>
  );
}
