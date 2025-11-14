import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RoomStatus } from '../../types';
import { formatDate, getStatusColor, getStatusText } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';
import { propertyService, Property } from '../../services/roomService';
import { AlertCircle } from 'lucide-react';

export default function RoomList() {
  const [rooms, setRooms] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<RoomStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 데이터 로드
  useEffect(() => {
    loadRooms();
  }, [statusFilter]);

  const loadRooms = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await propertyService.getProperties({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        limit: 1000,
      });

      setRooms(response.properties);
    } catch (err: any) {
      console.error('매물 목록 로드 실패:', err);
      setError('매물 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 필터링
  const filteredRooms = rooms.filter((room) => {
    const matchesSearch =
      room.roomName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.address.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || room.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage);
  const paginatedRooms = filteredRooms.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const columns = [
    {
      key: 'id',
      title: 'ID',
      render: (value: number) => value,
      width: '5%',
    },
    {
      key: 'roomName',
      title: '제목',
      render: (_: string, room: Property) => (
        <div>
          <div className="font-medium">{room.roomName}</div>
          <div className="text-sm text-gray-500">{room.address}</div>
        </div>
      ),
      width: '30%',
    },
    {
      key: 'area',
      title: '면적',
      render: (value: number) => `${value}㎡`,
      width: '10%',
    },
    {
      key: 'dailyRent',
      title: '일일 임대료',
      render: (value: number) => value ? `₩${value.toLocaleString()}` : '-',
      width: '12%',
    },
    {
      key: 'status',
      title: '상태',
      render: (value: string) => (
        <Badge className={getStatusColor(value)}>
          {getStatusText(value)}
        </Badge>
      ),
      width: '10%',
    },
    {
      key: 'createdAt',
      title: '등록일',
      render: (value: string) => formatDate(value),
      width: '12%',
    },
    {
      key: 'actions',
      title: '액션',
      render: (_: any, room: Property) => (
        <div className="flex gap-2">
          <Link to={`/rooms/${room.id}`}>
            <Button variant="secondary" size="sm">
              상세
            </Button>
          </Link>
          {room.status === 'published' && (
            <Link to={`/rooms/${room.id}/management`}>
              <Button variant="primary" size="sm">
                관리
              </Button>
            </Link>
          )}
        </div>
      ),
      width: '15%',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">방 관리</h1>
      </div>

      <Card>
        <div className="space-y-4">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="제목, 주소, 호스트명으로 검색"
          />

          <div className="flex gap-4">
            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">상태:</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as RoomStatus | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="draft">작성중</option>
                <option value="pending_review">심사중</option>
                <option value="approved">승인</option>
                <option value="rejected">반려</option>
                <option value="published">게시됨</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            총 {filteredRooms.length}개의 매물
          </div>
        </div>
      </Card>

      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-gray-500">로딩 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-gray-900 font-semibold mb-1">데이터 로드 실패</p>
              <p className="text-gray-500 mb-3">{error}</p>
              <button
                onClick={loadRooms}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : (
          <Table columns={columns} data={paginatedRooms} />
        )}
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
