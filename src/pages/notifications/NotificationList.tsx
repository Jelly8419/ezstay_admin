import { useState } from 'react';
import { mockNotifications } from '../../data/mockNotifications';
import { Notification, NotificationType, NotificationStatus } from '../../types';
import { formatDateTime, getStatusColor, getStatusText } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';

export default function NotificationList() {
  const [notifications] = useState<Notification[]>(mockNotifications);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<NotificationType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<NotificationStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // 필터링
  const filteredNotifications = notifications.filter((notification) => {
    const matchesSearch =
      notification.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.template.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType = typeFilter === 'all' || notification.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || notification.status === statusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage);
  const paginatedNotifications = filteredNotifications.slice(
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
      key: 'type',
      title: '유형',
      render: (value: NotificationType) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '10%',
    },
    {
      key: 'recipient',
      title: '수신자',
      width: '20%',
    },
    {
      key: 'template',
      title: '템플릿',
      width: '15%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: NotificationStatus) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '10%',
    },
    {
      key: 'sentAt',
      title: '발송일시',
      render: (value: string) => formatDateTime(value),
      width: '17%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">알림 서비스</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="수신자, 템플릿으로 검색"
          />

          <div className="flex gap-4">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">유형:</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as NotificationType | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="email">이메일</option>
                <option value="sms">SMS</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">상태:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as NotificationStatus | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="success">성공</option>
                <option value="failed">실패</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            총 {filteredNotifications.length}개의 발송 내역 (실패:{' '}
            {filteredNotifications.filter((n) => n.status === 'failed').length}건)
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={paginatedNotifications} />
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
