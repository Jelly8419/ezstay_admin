import { useState, useEffect } from 'react';
import type { Receipt, Pagination as PaginationType } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/format';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { receiptService } from '../../services/receiptService';

export default function ReceiptList() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [pagination, setPagination] = useState<PaginationType | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const itemsPerPage = 20;

  const loadReceipts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await receiptService.getReceipts({
        page: currentPage,
        limit: itemsPerPage,
        ...(searchTerm && { search: searchTerm }),
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
  }, [currentPage]);

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
    if (!confirm('영수증을 반려하시겠습니까?')) return;
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

  const getStatusBadge = (status: string) => {
    const map: Record<string, { variant: 'warning' | 'success' | 'danger' | 'default' | 'info'; label: string }> = {
      PENDING: { variant: 'warning', label: '대기중' },
      ISSUED: { variant: 'success', label: '발급완료' },
      REJECTED: { variant: 'danger', label: '반려' },
    };
    const config = map[status] || { variant: 'default' as const, label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const columns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: number) => `#${value}`,
      width: '6%',
    },
    {
      key: 'contractId',
      title: '계약 ID',
      render: (value: number) => `#${value}`,
      width: '8%',
    },
    {
      key: 'orderId',
      title: '주문번호',
      render: (value: string) => value || '-',
      width: '15%',
    },
    {
      key: 'guest',
      title: '게스트',
      render: (value: any) => value?.name || '-',
      width: '10%',
    },
    {
      key: 'room',
      title: '매물',
      render: (value: any) => value?.roomName || '-',
      width: '15%',
    },
    {
      key: 'totalAmount',
      title: '금액',
      render: (value: number) => <span className="font-semibold">{formatCurrency(value)}</span>,
      width: '12%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: string) => getStatusBadge(value),
      width: '10%',
    },
    {
      key: 'issuedAt',
      title: '발행일',
      render: (value: string) => value ? formatDateTime(value) : '-',
      width: '12%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, receipt: Receipt) => (
        <div className="flex gap-2">
          {receipt.receiptUrl && (
            <a href={receipt.receiptUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="secondary">보기</Button>
            </a>
          )}
          {receipt.status === 'PENDING' && (
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
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            onSearch={handleSearch}
            placeholder="계약번호 또는 주문번호로 검색"
          />
          <div className="text-sm text-gray-600">
            총 {pagination?.total ?? receipts.length}건
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
