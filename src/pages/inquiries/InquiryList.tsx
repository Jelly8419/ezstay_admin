import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockInquiries } from '../../data/mockInquiries';
import { Inquiry, InquiryStatus } from '../../types';
import { formatDateTime, getStatusColor, getStatusText } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';

export default function InquiryList() {
  const [inquiries] = useState<Inquiry[]>(mockInquiries);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<InquiryStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터링
  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inquiry.content.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredInquiries.length / itemsPerPage);
  const paginatedInquiries = filteredInquiries.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: number) => `#${value}`,
      width: '8%',
    },
    {
      key: 'title',
      title: '제목',
      render: (value: string, inquiry: Inquiry) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500 truncate max-w-xs">{inquiry.content}</div>
        </div>
      ),
      width: '30%',
    },
    {
      key: 'userName',
      title: '작성자',
      width: '10%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: InquiryStatus) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '10%',
    },
    {
      key: 'createdAt',
      title: '문의일시',
      render: (value: string) => formatDateTime(value),
      width: '15%',
    },
    {
      key: 'answeredAt',
      title: '답변일시',
      render: (value: string | undefined) =>
        value ? formatDateTime(value) : '-',
      width: '15%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, inquiry: Inquiry) => (
        <Link to={`/inquiries/${inquiry.id}`}>
          <Button variant={inquiry.status === 'pending' ? 'primary' : 'secondary'} size="sm">
            {inquiry.status === 'pending' ? '답변하기' : '상세보기'}
          </Button>
        </Link>
      ),
      width: '12%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">고객센터 (문의)</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="제목, 작성자, 내용으로 검색"
          />

          <div className="flex gap-4 items-center">
            <label className="text-sm font-medium text-gray-700">상태:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as InquiryStatus | 'all')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">전체</option>
              <option value="pending">답변대기</option>
              <option value="answered">답변완료</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            총 {filteredInquiries.length}개의 문의 (답변 대기:{' '}
            {filteredInquiries.filter((i) => i.status === 'pending').length}건)
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={paginatedInquiries} />
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
