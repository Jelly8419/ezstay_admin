import { useState } from 'react';
import { mockSettlements } from '../../data/mockSettlements';
import { Settlement, SettlementStatus } from '../../types';
import { formatCurrency, formatDate, maskBankAccount, getStatusColor, getStatusText } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';

export default function SettlementList() {
  const [settlements, setSettlements] = useState<Settlement[]>(mockSettlements);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<SettlementStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터링
  const filteredSettlements = settlements.filter((settlement) => {
    const matchesSearch =
      settlement.hostName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      settlement.bankAccount.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || settlement.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredSettlements.length / itemsPerPage);
  const paginatedSettlements = filteredSettlements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 정산 완료
  const handleComplete = (id: number) => {
    if (confirm('정말 이 정산을 완료하시겠습니까?')) {
      setSettlements(
        settlements.map((s) =>
          s.id === id
            ? { ...s, status: 'completed', completedAt: new Date().toISOString() }
            : s
        )
      );
    }
  };

  // 정산 보류
  const handleHold = (id: number) => {
    if (confirm('이 정산을 보류하시겠습니까?')) {
      setSettlements(
        settlements.map((s) => (s.id === id ? { ...s, status: 'on_hold' } : s))
      );
    }
  };

  const columns = [
    {
      key: 'id',
      title: '정산번호',
      render: (value: number) => `#${value}`,
      width: '8%',
    },
    {
      key: 'hostName',
      title: '호스트',
      width: '12%',
    },
    {
      key: 'amount',
      title: '금액',
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
      width: '15%',
    },
    {
      key: 'bankAccount',
      title: '계좌번호',
      render: (value: string) => maskBankAccount(value),
      width: '15%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: SettlementStatus) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '10%',
    },
    {
      key: 'scheduledAt',
      title: '예정일',
      render: (value: string) => formatDate(value),
      width: '12%',
    },
    {
      key: 'completedAt',
      title: '완료일',
      render: (value: string | undefined) =>
        value ? formatDate(value) : '-',
      width: '12%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, settlement: Settlement) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">
            상세
          </Button>
          {settlement.status === 'pending' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleComplete(settlement.id);
                }}
              >
                완료
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleHold(settlement.id);
                }}
              >
                보류
              </Button>
            </>
          )}
        </div>
      ),
      width: '16%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">정산 관리</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="호스트명, 계좌번호로 검색"
          />

          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SettlementStatus | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">전체</option>
              <option value="pending">대기</option>
              <option value="completed">완료</option>
              <option value="on_hold">보류</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            총 {filteredSettlements.length}개의 정산 내역
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={paginatedSettlements} />
      </Card>

      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
