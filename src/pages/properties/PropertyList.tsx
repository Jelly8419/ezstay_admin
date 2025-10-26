import { useState } from 'react';
import { Link } from 'react-router-dom';
import { mockProperties } from '../../data/mockProperties';
import { Property, PropertyStatus, PropertyVisibility } from '../../types';
import { formatDate, getStatusColor, getStatusText } from '../../utils/format';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { SearchBar } from '../../components/common/SearchBar';
import { Pagination } from '../../components/common/Pagination';
import { Button } from '../../components/ui/Button';

export default function PropertyList() {
  const [properties, setProperties] = useState<Property[]>(mockProperties);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | 'all'>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<PropertyVisibility | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터링
  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.hostName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || property.status === statusFilter;
    const matchesVisibility = visibilityFilter === 'all' || property.visibility === visibilityFilter;

    return matchesSearch && matchesStatus && matchesVisibility;
  });

  // 페이지네이션
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);
  const paginatedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 가시성 토글
  const handleVisibilityToggle = (id: number) => {
    setProperties(
      properties.map((p) =>
        p.id === id
          ? { ...p, visibility: p.visibility === 'visible' ? 'hidden' : 'visible' }
          : p
      )
    );
  };

  // 비활성화
  const handleInactivate = (id: number) => {
    if (confirm('정말 이 매물을 비활성화하시겠습니까?')) {
      setProperties(
        properties.map((p) =>
          p.id === id ? { ...p, status: 'inactive', visibility: 'inactive' } : p
        )
      );
    }
  };

  const columns = [
    {
      header: 'ID',
      accessor: (property: Property) => property.id,
      width: '5%',
    },
    {
      header: '썸네일',
      accessor: (property: Property) => (
        <img
          src={property.thumbnailUrl}
          alt={property.title}
          className="w-16 h-16 object-cover rounded"
        />
      ),
      width: '8%',
    },
    {
      header: '제목',
      accessor: (property: Property) => (
        <div>
          <div className="font-medium">{property.title}</div>
          <div className="text-sm text-gray-500">{property.address}</div>
        </div>
      ),
      width: '25%',
    },
    {
      header: '호스트',
      accessor: (property: Property) => property.hostName,
      width: '10%',
    },
    {
      header: '상태',
      accessor: (property: Property) => (
        <Badge className={getStatusColor(property.status)}>
          {getStatusText(property.status)}
        </Badge>
      ),
      width: '8%',
    },
    {
      header: '가시성',
      accessor: (property: Property) => (
        <Badge className={getStatusColor(property.visibility)}>
          {getStatusText(property.visibility)}
        </Badge>
      ),
      width: '8%',
    },
    {
      header: '등록일',
      accessor: (property: Property) => formatDate(property.createdAt),
      width: '10%',
    },
    {
      header: '액션',
      accessor: (property: Property) => (
        <div className="flex gap-2">
          <Link to={`/properties/${property.id}`}>
            <Button variant="secondary" size="sm">
              상세
            </Button>
          </Link>
          {property.status === 'approved' && property.visibility !== 'inactive' && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleVisibilityToggle(property.id)}
              >
                {property.visibility === 'visible' ? '비공개' : '공개'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleInactivate(property.id)}
              >
                비활성화
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
        <h1 className="text-2xl font-bold">매물 관리</h1>
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
                onChange={(e) => setStatusFilter(e.target.value as PropertyStatus | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="pending">심사중</option>
                <option value="approved">승인</option>
                <option value="rejected">반려</option>
                <option value="inactive">비활성</option>
              </select>
            </div>

            <div className="flex gap-2 items-center">
              <label className="text-sm font-medium text-gray-700">가시성:</label>
              <select
                value={visibilityFilter}
                onChange={(e) => setVisibilityFilter(e.target.value as PropertyVisibility | 'all')}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
              >
                <option value="all">전체</option>
                <option value="visible">노출</option>
                <option value="hidden">비공개</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            총 {filteredProperties.length}개의 매물
          </div>
        </div>
      </Card>

      <Card>
        <Table columns={columns} data={paginatedProperties} />
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
