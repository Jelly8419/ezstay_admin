import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockContracts } from '../../data/mockContracts';
import { Contract, ContractStatus } from '../../types';
import { formatCurrency, formatDate, getStatusColor, getStatusText } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';

export default function ContractList() {
  const [contracts, setContracts] = useState<Contract[]>(mockContracts);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContractStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터링
  const filteredContracts = contracts.filter((contract) => {
    const matchesSearch =
      contract.id.toString().includes(searchTerm);

    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredContracts.length / itemsPerPage);
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 계약 취소
  const handleCancel = (id: number) => {
    if (confirm('정말 이 계약을 취소하시겠습니까?')) {
      setContracts(
        contracts.map((c) => (c.id === id ? { ...c, status: 'CANCELLED_BY_GUEST' } : c))
      );
    }
  };

  const columns = [
    {
      key: 'id',
      title: '계약번호',
      render: (value: number) => `#${value}`,
      width: '8%',
    },
    {
      key: 'roomId',
      title: '매물 ID',
      render: (value: number) => `#${value}`,
      width: '8%',
    },
    {
      key: 'guestId',
      title: '게스트 ID',
      render: (value: number) => `#${value}`,
      width: '10%',
    },
    {
      key: 'checkInDate',
      title: '체크인',
      render: (value: string) => formatDate(value),
      width: '10%',
    },
    {
      key: 'checkOutDate',
      title: '체크아웃',
      render: (value: string) => formatDate(value),
      width: '10%',
    },
    {
      key: 'finalTotalAmount',
      title: '금액',
      render: (value: number) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
      width: '10%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: ContractStatus) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '12%',
    },
    {
      key: 'createdAt',
      title: '계약일',
      render: (value: string) => formatDate(value),
      width: '10%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, contract: Contract) => (
        <div className="flex gap-2">
          <Link to={`/contracts/${contract.id}`}>
            <Button variant="secondary" size="sm">
              상세
            </Button>
          </Link>
          {contract.status === 'PAYMENT_COMPLETED' && (
            <Button
              variant="danger"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCancel(contract.id);
              }}
            >
              취소
            </Button>
          )}
        </div>
      ),
      width: '12%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">계약 관리</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="계약번호로 검색"
          />

          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as ContractStatus | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">전체</option>
              <option value="PENDING_APPROVAL">승인 대기</option>
              <option value="APPROVED">승인됨</option>
              <option value="PAYMENT_COMPLETED">결제 완료</option>
              <option value="IN_PROGRESS">진행중</option>
              <option value="COMPLETED">완료</option>
              <option value="CANCELLED_BY_GUEST">게스트 취소</option>
              <option value="CANCELLED_BY_HOST">호스트 취소</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            총 {filteredContracts.length}개의 계약
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={paginatedContracts} />
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
