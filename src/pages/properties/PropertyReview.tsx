import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Table } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { SearchBar } from '../../components/common/SearchBar';
import { Eye, AlertCircle } from 'lucide-react';
import { propertyService, Property } from '../../services/propertyService';

const getStatusBadgeVariant = (status: string): 'warning' | 'success' | 'danger' | 'default' => {
  switch (status) {
    case 'pending_review': return 'warning';
    case 'approved': return 'success';
    case 'rejected': return 'danger';
    case 'published': return 'success';
    default: return 'default';
  }
};

const getStatusLabel = (status: string): string => {
  switch (status) {
    case 'pending_review': return '심사 대기';
    case 'approved': return '승인';
    case 'rejected': return '반려';
    case 'published': return '게시됨';
    case 'draft': return '작성중';
    default: return status;
  }
};

export const PropertyReview: React.FC = () => {
  const navigate = useNavigate();
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending_review');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 통계용 카운트
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadProperties();
  }, [statusFilter]);

  const loadProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      if (statusFilter === 'pending_review') {
        // 심사 대기 전용 API
        const response = await propertyService.getPendingReviewProperties();
        setProperties(response.properties);
      } else {
        // 전체 또는 필터링된 목록
        const response = await propertyService.getProperties({
          status: statusFilter !== 'all' ? statusFilter : undefined,
        });
        setProperties(response.properties);
      }

      // 통계 로드 (전체 데이터 필요)
      const allResponse = await propertyService.getProperties({ limit: 1000 });
      setStats({
        pending: allResponse.properties.filter((p) => p.status === 'pending_review').length,
        approved: allResponse.properties.filter((p) => p.status === 'approved').length,
        rejected: allResponse.properties.filter((p) => p.status === 'rejected').length,
      });
    } catch (err) {
      console.error('매물 목록 로드 실패:', err);
      setError('매물 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewClick = (property: Property, action: 'approve' | 'reject') => {
    setSelectedProperty(property);
    setReviewAction(action);
    setIsReviewModalOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!selectedProperty) return;

    if (reviewAction === 'reject' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);

      if (reviewAction === 'approve') {
        await propertyService.approveProperty(selectedProperty.id);
        alert('매물이 승인되었습니다.');
      } else {
        await propertyService.rejectProperty(selectedProperty.id, rejectionReason);
        alert('매물이 반려되었습니다.');
      }

      setIsReviewModalOpen(false);
      setRejectionReason('');
      loadProperties(); // 목록 새로고침
    } catch (err: any) {
      console.error('매물 심사 처리 실패:', err);
      alert(err.message || '매물 심사 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProperties = properties.filter((property) => {
    const matchesSearch =
      property.roomName.includes(searchQuery) ||
      property.address.includes(searchQuery) ||
      property.host.name.includes(searchQuery);
    return matchesSearch;
  });

  const columns = [
    {
      key: 'photos',
      title: '썸네일',
      width: '100px',
      render: (photos: Property['photos']) => (
        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
          {photos && photos.length > 0 ? (
            <img
              src={`http://localhost:8080${photos[0].photoUrl}`}
              alt="매물 썸네일"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
          )}
        </div>
      ),
    },
    {
      key: 'roomName',
      title: '매물 제목',
      render: (value: string, record: Property) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-xs text-gray-500">ID: {record.id}</div>
        </div>
      ),
    },
    {
      key: 'address',
      title: '위치',
    },
    {
      key: 'host',
      title: '등록자',
      render: (host: Property['host']) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/users/${host.id}`);
          }}
          className="text-primary-600 hover:underline"
        >
          {host.name}
        </button>
      ),
    },
    {
      key: 'area',
      title: '면적',
      render: (value: number) => `${value}㎡`,
    },
    {
      key: 'dailyRent',
      title: '일일 임대료',
      render: (value: number) => `₩${value.toLocaleString()}`,
    },
    {
      key: 'status',
      title: '상태',
      render: (value: string) => (
        <Badge variant={getStatusBadgeVariant(value)}>{getStatusLabel(value)}</Badge>
      ),
    },
    {
      key: 'submittedAt',
      title: '제출일',
      render: (value: string | null) =>
        value ? new Date(value).toLocaleDateString('ko-KR') : '-',
    },
    {
      key: 'actions',
      title: '액션',
      width: '200px',
      render: (_: any, record: Property) => (
        <div className="flex gap-2">
          {record.status === 'pending_review' && (
            <>
              <Button
                size="sm"
                variant="success"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReviewClick(record, 'approve');
                }}
              >
                승인
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={(e) => {
                  e.stopPropagation();
                  handleReviewClick(record, 'reject');
                }}
              >
                반려
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/properties/${record.id}`);
            }}
          >
            <Eye className="w-4 h-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">매물 심사</h1>
        <p className="text-gray-500 mt-2">새로 등록된 매물을 심사하고 승인/반려 처리합니다</p>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchBar
            placeholder="제목, 주소, 호스트명으로 검색"
            value={searchQuery}
            onChange={setSearchQuery}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="pending_review">심사 대기</option>
            <option value="approved">승인</option>
            <option value="rejected">반려</option>
            <option value="all">전체</option>
          </select>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600 mt-2">심사 대기</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">{stats.approved}</div>
            <div className="text-sm text-gray-600 mt-2">승인</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-3xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600 mt-2">반려</div>
          </div>
        </Card>
      </div>

      {/* Table */}
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
                onClick={loadProperties}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : (
          <Table columns={columns} data={filteredProperties} />
        )}
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => {
          setIsReviewModalOpen(false);
          setRejectionReason('');
        }}
        title={reviewAction === 'approve' ? '매물 승인' : '매물 반려'}
        size="lg"
        footer={
          <div className="flex gap-2 justify-end">
            <Button
              variant="secondary"
              onClick={() => {
                setIsReviewModalOpen(false);
                setRejectionReason('');
              }}
              disabled={isSubmitting}
            >
              취소
            </Button>
            <Button
              variant={reviewAction === 'approve' ? 'success' : 'danger'}
              onClick={handleReviewSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? '처리 중...'
                : reviewAction === 'approve'
                ? '승인하기'
                : '반려하기'}
            </Button>
          </div>
        }
      >
        {selectedProperty && (
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-2">{selectedProperty.roomName}</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>위치: {selectedProperty.address}</p>
                <p>호스트: {selectedProperty.host.name}</p>
                <p>
                  제출일:{' '}
                  {selectedProperty.submittedAt
                    ? new Date(selectedProperty.submittedAt).toLocaleString('ko-KR')
                    : '-'}
                </p>
              </div>
            </div>

            {reviewAction === 'approve' ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ 이 매물을 승인하시겠습니까? 승인 후 호스트가 게시할 수 있습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-sm text-red-800">
                    ⚠️ 이 매물을 반려하시겠습니까? 반려 사유를 입력해주세요.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    반려 사유 *
                  </label>
                  <textarea
                    placeholder="상세한 반려 사유를 입력해주세요 (예: 사진 품질이 낮습니다. 밝고 선명한 사진으로 다시 업로드해주세요.)"
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
